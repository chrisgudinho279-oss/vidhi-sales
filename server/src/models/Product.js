const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { money } = require('./fields');
module.exports = sequelize.define('Product', {
  name: { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: { msg: 'Product name is required' }, len: { args: [2, 200], msg: 'Product name must be 2-200 characters' } } },
  category: { type: DataTypes.STRING(80), defaultValue: 'General' },
  selling_price: money('selling_price', { pos: true }),
  cost_price: money('cost_price'),
  gst_percent: money('gst_percent', { def: 18, p: 5, max: 100 }),
  stock_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { isInt: { msg: 'Stock must be a whole number' }, min: { args: [0], msg: 'Stock cannot be negative' }, max: { args: [10000000], msg: 'Stock is too large' } } },
  low_stock_limit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, validate: { isInt: { msg: 'Low stock limit must be a whole number' }, min: { args: [0], msg: 'Low stock limit cannot be negative' } } },
  image: { type: DataTypes.TEXT('long') },
}, { tableName: 'products' });
