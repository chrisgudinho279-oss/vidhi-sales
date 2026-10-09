// Adds admin user, products, services, sample customer and settings
const bcrypt = require('bcryptjs');
const { sequelize, ensureDatabase } = require('./config/database');
const { User, Product, Service, Customer, Setting } = require('./models');

const products = [
  ['S2 All Klean Floor Cleaner', 250], ['S3 Window Shine Glass Cleaner', 280], ['S1 Germ Free Bathroom Cleaner', 260],
  ['K6 Natural Steel Polish', 320], ['S6 Super Lime Away', 350], ['S12 Hand Wash', 220], ['K1 Sparklean Dish Wash', 240],
  ['S17 Carpet Brite', 450], ['S14 Floor Stripper Heavy Duty', 550], ['Carpet Cleaner', 450],
  ['Dry Vacuum Cleaner', 12000], ['Single Disc Machine', 35000], ['High Pressure Machine', 28000], ['Carpet Extractor', 55000],
];
const services = [
  'Housekeeping Consultancy', 'Professional Cleaning Solutions', 'Product Supply', 'Deep Cleaning Services',
  'Housekeeping Operational Guidance', 'Housekeeping Staff Training', 'Cleaning Methods & Techniques Training', 'Chemical Training',
  'Equipment Training', 'SOP Development & Implementation', 'Quality Control & Inspection Systems', 'Manpower & Work Planning',
  'Hygiene Improvement & Maintenance Programs', 'Professional Cleaning & Deep Cleaning Services',
  'Cleaning Machines & Equipment Consultancy', 'Professional Cleaning Chemicals Consultancy', 'Hygiene & Sanitation Solutions',
  'Cleaning Tools & Accessories Supply',
];

async function seedData({ force = false } = {}) {
  if (force) { await ensureDatabase(); await sequelize.sync(); }
  if (!force && (await User.count()) > 0) return;
  await User.findOrCreate({ where: { username: 'admin' }, defaults: { password_hash: await bcrypt.hash('admin123', 10) } });
  for (const [name, price] of products) {
    const machine = price >= 10000;
    await Product.findOrCreate({
      where: { name },
      defaults: {
        category: machine ? 'Machines & Equipment' : 'Cleaning Chemicals', selling_price: price, cost_price: Math.round(price * 0.7),
        gst_percent: 18, stock_quantity: machine ? 5 : 50, low_stock_limit: machine ? 2 : 10,
      },
    });
  }
  for (const name of services) await Service.findOrCreate({ where: { name }, defaults: { price: 1000, cost_price: 400, gst_percent: 18 } });
  await Customer.findOrCreate({
    where: { name: 'Sample Customer' },
    defaults: { phone: '9876543210', email: 'sample@example.com', address: 'Ponda, Goa', gstin: '', supply_type: 'Intra-State' },
  });
  await Setting.findOrCreate({ where: { id: 1 }, defaults: {} });
  console.log('Seed complete. Login: admin / admin123');
}

module.exports = { seedData };
if (require.main === module) {
  seedData({ force: true }).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
