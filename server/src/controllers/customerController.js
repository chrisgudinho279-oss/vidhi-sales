const { Customer } = require('../models');
module.exports = require('../utils/crud')(Customer, 'Customer', { uniqueBy: ['phone'] });
