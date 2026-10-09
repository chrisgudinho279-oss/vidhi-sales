// Database connection (Sequelize + MySQL)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  name: process.env.DB_NAME || 'vidhi_billing',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const sequelize = new Sequelize(cfg.name, cfg.user, cfg.password, {
  host: cfg.host, port: cfg.port, dialect: 'mysql', logging: false,
  define: { underscored: true }, // created_at, customer_id style columns
});

// Creates the database "vidhi_billing" if it does not exist yet
async function ensureDatabase() {
  const c = await mysql.createConnection({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password });
  await c.query(`CREATE DATABASE IF NOT EXISTS \`${cfg.name}\``);
  await c.end();
}

module.exports = { sequelize, ensureDatabase };
