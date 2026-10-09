// All bill maths. The BACKEND is the source of truth - browser totals are never trusted.
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const fail = (m) => Object.assign(new Error(m), { status: 400 });

function calculate(lines, discountPercent, status, amountPaid) {
  // only rows with a name, quantity > 0 and price > 0 are counted
  const valid = lines.filter((l) => String(l.name || '').trim() && Number(l.quantity) > 0 && Number(l.price) > 0);
  const dp = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  let subtotal = 0, cost = 0;
  const out = valid.map((l) => {
    const amount = r2(l.quantity * l.price);
    subtotal += amount;
    cost += l.quantity * (Number(l.cost) || 0);
    return { ...l, amount };
  });
  const discount = r2((subtotal * dp) / 100);
  // GST is charged on the amount AFTER discount
  const tax = r2(out.reduce((s, l) => s + (l.amount * (1 - dp / 100) * (Number(l.gst_percent) || 0)) / 100, 0));
  subtotal = r2(subtotal); cost = r2(cost);
  const total = r2(subtotal + tax - discount);
  const profit = r2(subtotal - discount - cost);

  let paid = 0;
  if (status === 'Paid') paid = total;
  else if (status === 'Partially Paid') {
    paid = r2(amountPaid);
    if (!(paid > 0)) throw fail('Partial payment must be greater than 0');
    if (paid >= total) throw fail('Partial payment must be less than the total');
  }
  return { lines: out, subtotal, discount_percent: dp, discount, tax, total, cost, profit, amount_paid: paid, balance: r2(total - paid) };
}

module.exports = { calculate, r2 };
