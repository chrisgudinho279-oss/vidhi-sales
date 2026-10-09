const { Op } = require('sequelize');
const { sequelize, Invoice, InvoiceItem, Product, Service, Customer, Setting, EmailConfig } = require('../models');
const { asyncHandler, httpError } = require('../middleware/errorMiddleware');
const { calculate } = require('../utils/calculations');
const { createInvoicePdf } = require('../utils/invoicePdf');
const { sendInvoiceEmail } = require('../utils/gmailOAuth');
const v = require('../utils/validators');

const STATUSES = ['Paid', 'Pending', 'Partially Paid'];
const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'];
const SUPPLY = ['Intra-State', 'Inter-State'];
const bad = (m) => httpError(400, m);

// Next number is decided by the database: VS-00001, VS-00002 ...
async function nextInvoiceNo(t) {
  const last = await Invoice.findOne({ order: [['id', 'DESC']], transaction: t, lock: t.LOCK.UPDATE });
  const n = last ? parseInt(last.invoice_no.replace(/\D/g, ''), 10) + 1 : 1;
  return 'VS-' + String(n).padStart(5, '0');
}

// Put stock back (used when an invoice is edited or deleted)
async function restoreStock(invoiceId, t) {
  const items = await InvoiceItem.findAll({ where: { invoice_id: invoiceId, item_type: 'product' }, transaction: t });
  for (const it of items) {
    if (it.product_id) await Product.increment({ stock_quantity: it.quantity }, { where: { id: it.product_id }, transaction: t });
  }
}

// Validate the customer / invoice header fields
function validateHeader(b) {
  const name = String(b.customer_name || '').trim();
  if (!name) throw bad('Customer name is required');
  if (name.length < 2 || name.length > 150) throw bad('Customer name must be 2-150 characters');
  const phone = String(b.phone || '').trim(), email = String(b.email || '').trim();
  const gstin = String(b.gstin || '').trim().toUpperCase(), address = String(b.address || '').trim();
  if (!v.checkPhone(phone)) throw bad(v.PHONE_MSG);
  if (!v.checkEmail(email)) throw bad(v.EMAIL_MSG);
  if (!v.checkGstin(gstin)) throw bad(v.GSTIN_MSG);
  if (address.length > 300) throw bad('Address is too long (max 300)');
  if (!v.isValidDate(b.invoice_date)) throw bad('Invoice date is required and must be valid');
  if (!STATUSES.includes(b.status)) throw bad('Select a valid payment status');
  if (!METHODS.includes(b.payment_method)) throw bad('Select a valid payment method');
  if (!SUPPLY.includes(b.supply_type)) throw bad('Select a valid supply type');
  const dp = b.discount_percent === '' || b.discount_percent == null ? 0 : Number(b.discount_percent);
  if (!(dp >= 0 && dp <= 100)) throw bad('Discount must be between 0 and 100');
  return { name, phone, email, gstin, address, dp };
}

// Create (id = null) or update (id given) an invoice inside ONE transaction
async function saveInvoice(b, id, t) {
  let invoice = null;
  const h = validateHeader(b);
  if (id) {
    invoice = await Invoice.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!invoice) throw httpError(404, 'Invoice not found');
    await restoreStock(id, t);
    await InvoiceItem.destroy({ where: { invoice_id: id }, transaction: t });
  }

  // 1. validate every row
  if (!Array.isArray(b.items) || b.items.length > 100) throw bad('Invoice must have between 1 and 100 rows');
  const lines = [], need = {}, seen = { product: new Set(), service: new Set() };
  for (const it of b.items) {
    const type = it.item_type === 'service' ? 'service' : 'product';
    const refId = type === 'product' ? it.product_id : it.service_id;
    let label = String(it.name || '').trim();
    if (!refId && !label) continue; // empty row
    const Catalog = type === 'product' ? Product : Service;
    if (refId) {
      const row = await Catalog.findByPk(refId, { transaction: t });
      if (!row) throw bad(`Selected ${type} no longer exists`);
      label = row.name;
    } else {
      // CUSTOM item: free text name, no stock tracking
      if (label.length < 2 || label.length > 200) throw bad(`Custom ${type} name must be 2-200 characters`);
      if (await Catalog.findOne({ where: { name: label }, transaction: t })) throw bad(`"${label}" already exists in the ${type} list. Select it instead of using Custom`);
    }
    const key = refId ? 'id:' + refId : 'custom:' + label.toLowerCase();
    if (seen[type].has(key)) throw bad(`"${label}" is added more than once. Increase its quantity instead`);
    seen[type].add(key);

    const quantity = Number(it.quantity), price = Number(it.price), gst = it.gst_percent === '' || it.gst_percent == null ? 0 : Number(it.gst_percent);
    const cost = it.cost === '' || it.cost == null ? 0 : Number(it.cost);
    if (!(Number.isInteger(quantity) && quantity > 0 && quantity <= 100000)) throw bad(`Quantity must be a whole number from 1 to 100000 (${label})`);
    if (!(price > 0 && price <= 10000000)) throw bad(`Selling price must be greater than 0 (${label})`);
    if (!(cost >= 0 && cost <= 10000000)) throw bad(`Cost price cannot be negative (${label})`);
    if (!(gst >= 0 && gst <= 100)) throw bad(`GST % must be between 0 and 100 (${label})`);
    if (type === 'product' && refId) need[refId] = (need[refId] || 0) + quantity;
    lines.push({
      item_type: type, name: label, quantity, price, cost, gst_percent: gst,
      product_id: type === 'product' ? refId || null : null, service_id: type === 'service' ? refId || null : null,
    });
  }
  if (!lines.length) throw bad('Add at least one product or service');

  // 2. stock check + reduce stock (catalogue products only)
  for (const pid of Object.keys(need)) {
    const p = await Product.findByPk(pid, { transaction: t, lock: t.LOCK.UPDATE });
    if (p.stock_quantity < need[pid]) throw bad(`Only ${p.stock_quantity} in stock for "${p.name}"`);
    await p.update({ stock_quantity: p.stock_quantity - need[pid] }, { transaction: t });
  }

  // 3. recalculate everything on the server
  const calc = calculate(lines, h.dp, b.status, b.amount_paid);

  // 4. link / create customer
  let customer_id = b.customer_id || null;
  if (customer_id && !(await Customer.findByPk(customer_id, { transaction: t }))) customer_id = null;
  if (!customer_id) {
    const [c] = await Customer.findOrCreate({
      where: { name: h.name, phone: h.phone },
      defaults: { email: h.email, address: h.address, gstin: h.gstin, supply_type: b.supply_type },
      transaction: t,
    });
    customer_id = c.id;
  }

  const data = {
    invoice_date: b.invoice_date, customer_id, customer_name: h.name, phone: h.phone, email: h.email, address: h.address, gstin: h.gstin,
    supply_type: b.supply_type, status: b.status, payment_method: b.payment_method,
    subtotal: calc.subtotal, discount_percent: calc.discount_percent, discount: calc.discount, tax: calc.tax, total: calc.total,
    cost: calc.cost, profit: calc.profit, amount_paid: calc.amount_paid, balance: calc.balance,
  };
  if (invoice) await invoice.update(data, { transaction: t });
  else invoice = await Invoice.create({ ...data, invoice_no: await nextInvoiceNo(t) }, { transaction: t });

  await InvoiceItem.bulkCreate(calc.lines.map((l) => ({ ...l, invoice_id: invoice.id })), { transaction: t });
  return invoice;
}

const load = (id) => Invoice.findByPk(id, { include: [{ model: InvoiceItem, as: 'items' }], order: [[{ model: InvoiceItem, as: 'items' }, 'id', 'ASC']] });

exports.list = asyncHandler(async (req, res) => {
  const { q, status, from, to } = req.query;
  const where = {};
  if (status) { if (!STATUSES.includes(status)) throw bad('Invalid status filter'); where.status = status; }
  if ((from && !v.isValidDate(from)) || (to && !v.isValidDate(to))) throw bad('Invalid date filter');
  if (from && to && from > to) throw bad('"From" date cannot be after "To" date');
  if (from || to) where.invoice_date = { ...(from && { [Op.gte]: from }), ...(to && { [Op.lte]: to }) };
  if (q) where[Op.or] = ['invoice_no', 'customer_name', 'phone'].map((f) => ({ [f]: { [Op.like]: `%${String(q).slice(0, 50)}%` } }));
  res.json(await Invoice.findAll({ where, order: [['invoice_date', 'DESC'], ['id', 'DESC']] }));
});

exports.get = asyncHandler(async (req, res) => {
  const inv = await load(req.params.id);
  if (!inv) throw httpError(404, 'Invoice not found');
  res.json(inv);
});

exports.pdf = asyncHandler(async (req, res) => {
  const inv = await load(req.params.id);
  if (!inv) throw httpError(404, 'Invoice not found');
  if (!v.checkEmail(inv.email) || !inv.email) throw httpError(400, 'Add a valid customer email to this invoice before preparing its email.');
  const settings = await Setting.findByPk(1);
  const emailConfig = await EmailConfig.findByPk(1);
  const pdf = await createInvoicePdf(inv, settings);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${inv.invoice_no}.pdf"`,
    'X-Billing-Copy-Email': (emailConfig && emailConfig.business_email) || process.env.BILLING_COPY_EMAIL || '',
  });
  res.send(pdf);
});

exports.email = asyncHandler(async (req, res) => {
  const inv = await load(req.params.id);
  if (!inv) throw httpError(404, 'Invoice not found');
  if (!v.checkEmail(inv.email) || !inv.email) throw httpError(400, 'Add a valid customer email to this invoice before emailing it.');
  const [settings, emailConfig] = await Promise.all([Setting.findByPk(1), EmailConfig.findByPk(1)]);
  const recipients = await sendInvoiceEmail(inv, settings, emailConfig);
  res.json({ message: 'Invoice emailed successfully.', ...recipients });
});

exports.create = asyncHandler(async (req, res) => {
  const inv = await sequelize.transaction((t) => saveInvoice(req.body, null, t));
  res.status(201).json(await load(inv.id));
});

exports.update = asyncHandler(async (req, res) => {
  const inv = await sequelize.transaction((t) => saveInvoice(req.body, req.params.id, t));
  res.json(await load(inv.id));
});

exports.remove = asyncHandler(async (req, res) => {
  await sequelize.transaction(async (t) => {
    const inv = await Invoice.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!inv) throw httpError(404, 'Invoice not found');
    await restoreStock(inv.id, t);
    await InvoiceItem.destroy({ where: { invoice_id: inv.id }, transaction: t });
    await inv.destroy({ transaction: t });
  });
  res.json({ message: 'Invoice deleted and stock restored' });
});

// ---- Backup / restore ----
exports.backup = asyncHandler(async (req, res) => {
  const all = await Invoice.findAll({ include: [{ model: InvoiceItem, as: 'items' }], order: [['id', 'ASC']] });
  res.json({ app: 'vidhi-billing', exported_at: new Date().toISOString(), invoices: all });
});

// Restore adds invoices that do not exist yet (by invoice_no). Stock is NOT changed.
exports.restore = asyncHandler(async (req, res) => {
  const list = req.body && req.body.invoices;
  if (req.body?.app !== 'vidhi-billing' || !Array.isArray(list)) throw bad('This is not a valid VIDHI SALES backup file');
  if (list.length > 5000) throw bad('Backup has too many invoices (max 5000)');
  let added = 0, skipped = 0;
  await sequelize.transaction(async (t) => {
    for (const b of list) {
      if (!b || !/^VS-\d{5,}$/.test(b.invoice_no || '') || !String(b.customer_name || '').trim() || !v.isValidDate(String(b.invoice_date).slice(0, 10)) || !Array.isArray(b.items)) {
        throw bad(`Backup file is corrupted near invoice "${b && b.invoice_no}"`);
      }
      if (await Invoice.findOne({ where: { invoice_no: b.invoice_no }, transaction: t })) { skipped++; continue; }
      const { id, items, customer_id, ...data } = b;
      const inv = await Invoice.create(data, { transaction: t });
      await InvoiceItem.bulkCreate(items.map(({ id: x, invoice_id, product_id, service_id, ...it }) => ({ ...it, invoice_id: inv.id })), { transaction: t });
      added++;
    }
  });
  res.json({ message: `Restore complete: ${added} added, ${skipped} skipped (already exist)` });
});
