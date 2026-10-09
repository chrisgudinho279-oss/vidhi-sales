const { Op } = require('sequelize');
const { Invoice, Product } = require('../models');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { r2 } = require('../utils/calculations');

const pad = (n) => String(n).padStart(2, '0');
function dateRange(year, month) {
  if (!year) return {};
  const y = Number(year), m = Number(month);
  const from = m ? `${y}-${pad(m)}-01` : `${y}-01-01`;
  const to = m ? `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}` : `${y}-12-31`;
  return { invoice_date: { [Op.between]: [from, to] } };
}
const sum = (rows, f) => r2(rows.reduce((s, r) => s + Number(r[f]), 0));

exports.todaySales = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const rows = await Invoice.findAll({ where: { invoice_date: today } });
  const by_method = { Cash: 0, UPI: 0, Card: 0, 'Bank Transfer': 0, Cheque: 0 };
  rows.forEach((row) => {
    const method = row.payment_method;
    if (Object.hasOwn(by_method, method)) by_method[method] = r2(by_method[method] + Number(row.total));
  });
  res.json({ date: today, total_sales: sum(rows, 'total'), total_invoices: rows.length, by_method });
});

exports.summary = asyncHandler(async (req, res) => {
  const rows = await Invoice.findAll({ where: dateRange(req.query.year, req.query.month) });
  const products = await Product.findAll({ order: [['stock_quantity', 'ASC']] });
  const low = products.filter((p) => p.stock_quantity <= p.low_stock_limit);
  res.json({
    total_sales: sum(rows, 'total'), total_invoices: rows.length, paid: sum(rows, 'amount_paid'), pending: sum(rows, 'balance'),
    cost: sum(rows, 'cost'), profit: sum(rows, 'profit'), total_products: products.length, low_stock_count: low.length,
    low_stock: low.slice(0, 10).map((p) => ({ id: p.id, name: p.name, stock_quantity: p.stock_quantity, low_stock_limit: p.low_stock_limit })),
  });
});

exports.monthly = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const rows = await Invoice.findAll({ where: dateRange(year) });
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, invoices: 0, sales: 0, cost: 0, profit: 0 }));
  rows.forEach((r) => {
    const m = months[Number(String(r.invoice_date).slice(5, 7)) - 1];
    m.invoices += 1; m.sales = r2(m.sales + r.total); m.cost = r2(m.cost + r.cost); m.profit = r2(m.profit + r.profit);
  });
  res.json({ year, months });
});
