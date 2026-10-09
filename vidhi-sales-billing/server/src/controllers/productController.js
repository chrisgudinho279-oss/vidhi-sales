const { Product, Service } = require('../models');
const crud = require('../utils/crud');
exports.products = crud(Product, 'Product');
exports.services = crud(Service, 'Service');
