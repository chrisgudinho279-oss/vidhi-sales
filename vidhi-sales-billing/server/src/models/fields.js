// Helper: DECIMAL column that always comes back to JavaScript as a Number
const { DataTypes } = require('sequelize');
exports.money = (name, { def = 0, neg = false, p = 12, s = 2 } = {}) => ({
  type: DataTypes.DECIMAL(p, s),
  allowNull: false,
  defaultValue: def,
  validate: neg ? {} : { min: { args: [0], msg: `${name.replace(/_/g, ' ')} cannot be negative` } },
  get() { return Number(this.getDataValue(name)); },
});
