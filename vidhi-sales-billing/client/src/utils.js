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
