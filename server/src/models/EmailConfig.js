const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = sequelize.define('EmailConfig', {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  business_email: { type: DataTypes.STRING(254) },
  connected_email: { type: DataTypes.STRING(254) },
  refresh_token: { type: DataTypes.TEXT },
}, { tableName: 'email_config', timestamps: false });
