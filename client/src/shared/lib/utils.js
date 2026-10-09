export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtDate = (d) => (d ? String(d).slice(0, 10).split('-').reverse().join('/') : '');
export const today = () => new Date().toISOString().slice(0, 10);
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Live calculation shown while typing (the server recalculates again when saving)
export function calcInvoice(rows, discountPercent, status, amountPaid) {
  const valid = rows.filter((r) => String(r.name || '').trim() && Number(r.quantity) > 0 && Number(r.price) > 0);
  const dp = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  let subtotal = 0, cost = 0, taxBase = 0;
  valid.forEach((r) => {
    const amount = Number(r.quantity) * Number(r.price);
    subtotal += amount;
    cost += Number(r.quantity) * (Number(r.cost) || 0);
    taxBase += (amount * (1 - dp / 100) * (Number(r.gst_percent) || 0)) / 100;
  });
  const discount = r2((subtotal * dp) / 100);
  const tax = r2(taxBase);
  subtotal = r2(subtotal); cost = r2(cost);
  const total = r2(subtotal + tax - discount);
  const paid = status === 'Paid' ? total : status === 'Partially Paid' ? r2(amountPaid) : 0;
  return { subtotal, discount, tax, total, cost, profit: r2(subtotal - discount - cost), amount_paid: paid, balance: r2(total - paid), count: valid.length };
}

export const profitText = (n) => (n < 0 ? `Loss: ${inr(-n)}` : `Profit: ${inr(n)}`);

// ---------- validation helpers ----------
export const isPhone = (v) => !v || /^[6-9]\d{9}$/.test(v);
export const isEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export const isGstin = (v) => !v || /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(v).toUpperCase());
export const isStrongPassword = (v) => /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(v || '');
export const PASSWORD_MSG = 'Password must be 8-64 characters with at least one letter and one number';
export const PHONE_MSG = 'Phone must be a valid 10-digit mobile number';
export const EMAIL_MSG = 'Email address is not valid';
export const GSTIN_MSG = 'GSTIN is not valid (15 characters, e.g. 30ABCDE1234F1Z5)';

// Returns a list of error messages for the invoice form (empty list = OK)
export function validateInvoice({ form, pRows, sRows, products, editing, calc }) {
  const e = [];
  const name = String(form.customer_name || '').trim();
  if (!name) e.push('Customer name is required');
  else if (name.length < 2) e.push('Customer name must be at least 2 characters');
  if (!isPhone(form.phone)) e.push(PHONE_MSG);
  if (!isEmail(form.email)) e.push(EMAIL_MSG);
  if (!isGstin(form.gstin)) e.push(GSTIN_MSG);
  if (!form.invoice_date) e.push('Invoice date is required');
  const dp = form.discount_percent === '' ? 0 : Number(form.discount_percent);
  if (!(dp >= 0 && dp <= 100)) e.push('Discount must be between 0 and 100');

  let rowErrors = 0;
  const check = (rows, label, isProduct) => {
    const seen = new Set();
    rows.forEach((r, i) => {
      const n = `${label} row ${i + 1}`;
      const nm = String(r.name || '').trim();
      const touched = r.ref_id || nm || r.custom;
      if (!touched) {
        if (Number(r.price) > 0) { e.push(`${n}: select an item or choose Custom`); rowErrors++; }
        return;
      }
      const before = e.length;
      if (r.custom && nm.length < 2) e.push(`${n}: type the custom name (at least 2 characters)`);
      if (!r.custom && !r.ref_id) e.push(`${n}: select an item`);
      const key = r.ref_id ? 'id:' + r.ref_id : 'c:' + nm.toLowerCase();
      if (nm && seen.has(key)) e.push(`${n}: "${nm}" is added more than once. Increase its quantity instead`);
      seen.add(key);
      const q = Number(r.quantity), p = Number(r.price), c = r.cost === '' ? 0 : Number(r.cost), g = r.gst_percent === '' ? 0 : Number(r.gst_percent);
      if (!(Number.isInteger(q) && q > 0)) e.push(`${n}: quantity must be a whole number greater than 0`);
      if (!(p > 0)) e.push(`${n}: selling price must be greater than 0`);
      if (!(c >= 0)) e.push(`${n}: cost price cannot be negative`);
      if (!(g >= 0 && g <= 100)) e.push(`${n}: GST % must be between 0 and 100`);
      if (isProduct && r.ref_id && !editing) {
        const item = products.find((x) => String(x.id) === String(r.ref_id));
        if (item && q > item.stock_quantity) e.push(`${n}: only ${item.stock_quantity} in stock for "${item.name}"`);
      }
      if (e.length > before) rowErrors++;
    });
  };
  check(pRows, 'Product', true);
  check(sRows, 'Service', false);
  if (calc.count === 0 && rowErrors === 0) e.push('Add at least one product or service with quantity and price greater than 0');
  if (form.status === 'Partially Paid') {
    if (!(calc.amount_paid > 0)) e.push('Partial payment must be greater than 0');
    else if (calc.amount_paid >= calc.total) e.push('Partial payment must be less than the total');
  }
  return e;
}
