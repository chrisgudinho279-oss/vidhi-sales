const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
module.exports = sequelize.define('User', {
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true, validate: { notEmpty: { msg: 'Username is required' } } },
  password_hash: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'users', updatedAt: false });
