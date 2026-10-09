const { Product, Service } = require('../models');
const crud = require('../utils/crud');
exports.products = crud(Product, 'Product', { uniqueBy: ['name'] });
exports.services = crud(Service, 'Service', { uniqueBy: ['name'] });
