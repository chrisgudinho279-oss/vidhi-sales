const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
module.exports = sequelize.define('Setting', {
  company_name: { type: DataTypes.STRING(150), defaultValue: 'VIDHI SALES' },
  tagline: { type: DataTypes.STRING(200), defaultValue: 'Housekeeping & Professional Cleaning Solutions' },
  phone: { type: DataTypes.STRING(20), defaultValue: '9049007159' },
  logo: { type: DataTypes.TEXT('long') },
  signature: { type: DataTypes.TEXT('long') },
  bank_details: { type: DataTypes.TEXT },
  footer_text: { type: DataTypes.STRING(250), defaultValue: 'Right Product • Right Method • Right Training • Right Result' },
}, { tableName: 'settings', timestamps: false });
