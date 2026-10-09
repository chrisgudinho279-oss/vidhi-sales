const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { money } = require('./fields');
module.exports = sequelize.define('Product', {
  name: { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: { msg: 'Product name is required' } } },
  category: { type: DataTypes.STRING(80), defaultValue: 'General' },
  selling_price: money('selling_price'),
  cost_price: money('cost_price'),
  gst_percent: money('gst_percent', { def: 18, p: 5 }),
  stock_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: { args: [0], msg: 'Stock cannot be negative' } } },
  low_stock_limit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  image: { type: DataTypes.TEXT('long') },
}, { tableName: 'products' });
