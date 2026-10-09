// Helper: DECIMAL column that always comes back as a Number, with range validation
const { DataTypes } = require('sequelize');
exports.money = (name, { def = 0, neg = false, pos = false, max = 100000000, p = 12, s = 2 } = {}) => {
  const label = name.replace(/_/g, ' ');
  const validate = {};
  if (!neg) {
    validate.min = { args: [pos ? 0.01 : 0], msg: pos ? `${label} must be greater than 0` : `${label} cannot be negative` };
    validate.max = { args: [max], msg: `${label} cannot be more than ${max}` };
  }
  return {
    type: DataTypes.DECIMAL(p, s), allowNull: false, defaultValue: def, validate,
    get() { return Number(this.getDataValue(name)); },
  };
};
