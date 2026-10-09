const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
module.exports = sequelize.define('Customer', {
  name: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: { msg: 'Customer name is required' } } },
  phone: { type: DataTypes.STRING(20), defaultValue: '' },
  email: { type: DataTypes.STRING(120), defaultValue: '' },
  address: { type: DataTypes.TEXT },
  gstin: { type: DataTypes.STRING(20), defaultValue: '' },
  supply_type: { type: DataTypes.ENUM('Intra-State', 'Inter-State'), defaultValue: 'Intra-State' },
}, { tableName: 'customers' });
