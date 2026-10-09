// Run with: npm run seed   (from project root)
const { seedData } = require('../server/src/seed');
seedData({ force: true }).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
