const { Op } = require('sequelize');
const { sequelize, Invoice, InvoiceItem, Product, Customer } = require('../models');
const { asyncHandler, httpError } = require('../middleware/errorMiddleware');
const { calculate } = require('../utils/calculations');

const STATUSES = ['Paid', 'Pending', 'Partially Paid'];

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

// Create (id = null) or update (id given) an invoice inside ONE transaction
async function saveInvoice(b, id, t) {
  let invoice = null;
  if (id) {
    invoice = await Invoice.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!invoice) throw httpError(404, 'Invoice not found');
    await restoreStock(id, t);
    await InvoiceItem.destroy({ where: { invoice_id: id }, transaction: t });
  }

  const name = String(b.customer_name || '').trim();
  if (!name) throw httpError(400, 'Customer name is required');
  const status = STATUSES.includes(b.status) ? b.status : 'Pending';

  // 1. validate rows
  const lines = [], need = {};
  for (const it of b.items || []) {
    const type = it.item_type === 'service' ? 'service' : 'product';
    const refId = type === 'product' ? it.product_id : it.service_id;
    let label = String(it.name || '').trim();
    if (!refId && !label) continue; // empty row
    if (type === 'product' && refId) {
      const p = await Product.findByPk(refId, { transaction: t });
      if (!p) throw httpError(400, 'Selected product no longer exists');
      label = p.name;
      need[refId] = (need[refId] || 0) + Number(it.quantity);
    }
    const quantity = Number(it.quantity), price = Number(it.price);
    if (!(Number.isInteger(quantity) && quantity > 0)) throw httpError(400, `Quantity must be a whole number greater than 0 (${label})`);
    if (!(price > 0)) throw httpError(400, `Selling price must be greater than 0 (${label})`);
    lines.push({
      item_type: type, name: label, quantity, price, cost: Number(it.cost) || 0, gst_percent: Number(it.gst_percent) || 0,
      product_id: type === 'product' ? refId || null : null, service_id: type === 'service' ? refId || null : null,
    });
  }
  if (!lines.length) throw httpError(400, 'Add at least one product or service');

  // 2. stock check + reduce stock
  for (const pid of Object.keys(need)) {
    const p = await Product.findByPk(pid, { transaction: t, lock: t.LOCK.UPDATE });
    if (p.stock_quantity < need[pid]) throw httpError(400, `Only ${p.stock_quantity} in stock for "${p.name}"`);
    await p.update({ stock_quantity: p.stock_quantity - need[pid] }, { transaction: t });
  }

  // 3. recalculate everything on the server
  const calc = calculate(lines, b.discount_percent, status, b.amount_paid);

  // 4. link / create customer
  let customer_id = b.customer_id || null;
  if (customer_id && !(await Customer.findByPk(customer_id, { transaction: t }))) customer_id = null;
  if (!customer_id) {
    const [c] = await Customer.findOrCreate({
      where: { name, phone: b.phone || '' },
      defaults: { email: b.email || '', address: b.address || '', gstin: b.gstin || '', supply_type: b.supply_type || 'Intra-State' },
      transaction: t,
    });
    customer_id = c.id;
  }

  const data = {
    invoice_date: b.invoice_date || new Date().toISOString().slice(0, 10),
    customer_id, customer_name: name, phone: b.phone || '', email: b.email || '', address: b.address || '', gstin: b.gstin || '',
    supply_type: b.supply_type === 'Inter-State' ? 'Inter-State' : 'Intra-State', status,
    payment_method: b.payment_method || 'Cash',
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
  if (status) where.status = status;
  if (from || to) where.invoice_date = { ...(from && { [Op.gte]: from }), ...(to && { [Op.lte]: to }) };
  if (q) where[Op.or] = ['invoice_no', 'customer_name', 'phone'].map((f) => ({ [f]: { [Op.like]: `%${q}%` } }));
  res.json(await Invoice.findAll({ where, order: [['invoice_date', 'DESC'], ['id', 'DESC']] }));
});

exports.get = asyncHandler(async (req, res) => {
  const inv = await load(req.params.id);
  if (!inv) throw httpError(404, 'Invoice not found');
  res.json(inv);
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
  if (!Array.isArray(list)) throw httpError(400, 'Invalid backup file');
  let added = 0, skipped = 0;
  await sequelize.transaction(async (t) => {
    for (const b of list) {
      if (!b.invoice_no || (await Invoice.findOne({ where: { invoice_no: b.invoice_no }, transaction: t }))) { skipped++; continue; }
      const { id, items = [], customer_id, ...data } = b;
      const inv = await Invoice.create(data, { transaction: t });
      await InvoiceItem.bulkCreate(items.map(({ id: x, invoice_id, product_id, service_id, ...it }) => ({ ...it, invoice_id: inv.id })), { transaction: t });
      added++;
    }
  });
  res.json({ message: `Restore complete: ${added} added, ${skipped} skipped (already exist)` });
});
