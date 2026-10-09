const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const v = require('../utils/validators');
module.exports = sequelize.define('Customer', {
  name: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: { msg: 'Customer name is required' }, len: { args: [2, 150], msg: 'Customer name must be 2-150 characters' } } },
  phone: { type: DataTypes.STRING(20), defaultValue: '', validate: { ok(x) { if (!v.checkPhone(x)) throw new Error(v.PHONE_MSG); } } },
  email: { type: DataTypes.STRING(120), defaultValue: '', validate: { ok(x) { if (!v.checkEmail(x)) throw new Error(v.EMAIL_MSG); } } },
  address: { type: DataTypes.TEXT, validate: { len: { args: [0, 300], msg: 'Address is too long (max 300)' } } },
  gstin: { type: DataTypes.STRING(20), defaultValue: '', set(x) { this.setDataValue('gstin', String(x || '').toUpperCase()); }, validate: { ok(x) { if (!v.checkGstin(x)) throw new Error(v.GSTIN_MSG); } } },
  supply_type: { type: DataTypes.ENUM('Intra-State', 'Inter-State'), defaultValue: 'Intra-State' },
}, { tableName: 'customers' });
