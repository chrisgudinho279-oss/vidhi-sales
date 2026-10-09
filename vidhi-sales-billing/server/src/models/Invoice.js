const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { money } = require('./fields');
module.exports = sequelize.define('Invoice', {
  invoice_no: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  invoice_date: { type: DataTypes.DATEONLY, allowNull: false },
  customer_name: { type: DataTypes.STRING(150), allowNull: false },
  phone: { type: DataTypes.STRING(20), defaultValue: '' },
  email: { type: DataTypes.STRING(120), defaultValue: '' },
  address: { type: DataTypes.TEXT },
  gstin: { type: DataTypes.STRING(20), defaultValue: '' },
  supply_type: { type: DataTypes.ENUM('Intra-State', 'Inter-State'), defaultValue: 'Intra-State' },
  status: { type: DataTypes.ENUM('Paid', 'Pending', 'Partially Paid'), defaultValue: 'Pending' },
  payment_method: { type: DataTypes.ENUM('Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'), defaultValue: 'Cash' },
  subtotal: money('subtotal'),
  discount_percent: money('discount_percent', { p: 5 }),
  discount: money('discount'),
  tax: money('tax'),
  total: money('total'),
  cost: money('cost'),
  profit: money('profit', { neg: true }), // can be negative = loss
  amount_paid: money('amount_paid'),
  balance: money('balance'),
}, { tableName: 'invoices', updatedAt: false });
