const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { money } = require('./fields');
module.exports = sequelize.define('Service', {
  name: { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: { msg: 'Service name is required' }, len: { args: [2, 200], msg: 'Service name must be 2-200 characters' } } },
  price: money('price', { pos: true }),
  cost_price: money('cost_price'),
  gst_percent: money('gst_percent', { def: 18, p: 5, max: 100 }),
}, { tableName: 'services' });
