const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { money } = require('./fields');
module.exports = sequelize.define('InvoiceItem', {
  item_type: { type: DataTypes.ENUM('product', 'service'), allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  price: money('price'),
  cost: money('cost'),
  gst_percent: money('gst_percent', { p: 5 }),
  amount: money('amount'),
}, { tableName: 'invoice_items', timestamps: false });
