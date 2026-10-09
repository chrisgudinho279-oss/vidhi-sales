const app = require('./app');
const { sequelize, ensureDatabase } = require('./config/database');
require('./models');
const { seedData } = require('./seed');
const PORT = process.env.PORT || 4000;

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
