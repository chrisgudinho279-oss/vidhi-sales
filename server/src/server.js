const app = require('./app');
const { sequelize, ensureDatabase } = require('./config/database');
require('./models');
const { seedData } = require('./seed');
const PORT = process.env.PORT || 4000;

if ((process.env.JWT_SECRET || 'change_this_secret') === 'change_this_secret') {
  console.warn('WARNING: change JWT_SECRET in .env before using this system for real.');
}
(async () => {
  try {
    await ensureDatabase();        // create DB if missing
    await sequelize.sync();        // create tables if missing
    await seedData();              // first run only: admin, products, services
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  } catch (e) {
    console.error('Could not start server. Is MySQL running and .env correct?\n', e.message);
    process.exit(1);
  }
})();
