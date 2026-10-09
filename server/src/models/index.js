// Loads all models and defines the relationships between them
const { sequelize } = require('../config/database');
const User = require('./User');
const Customer = require('./Customer');
const Product = require('./Product');
const Service = require('./Service');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Setting = require('./Setting');
const EmailConfig = require('./EmailConfig');

Customer.hasMany(Invoice, { foreignKey: 'customer_id', onDelete: 'SET NULL' });   // 1 customer -> many invoices
Invoice.belongsTo(Customer, { foreignKey: 'customer_id' });
Invoice.hasMany(InvoiceItem, { as: 'items', foreignKey: 'invoice_id', onDelete: 'CASCADE' }); // 1 invoice -> many items
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });
Product.hasMany(InvoiceItem, { foreignKey: 'product_id', onDelete: 'SET NULL' }); // 1 product -> many items
InvoiceItem.belongsTo(Product, { foreignKey: 'product_id' });
Service.hasMany(InvoiceItem, { foreignKey: 'service_id', onDelete: 'SET NULL' });
InvoiceItem.belongsTo(Service, { foreignKey: 'service_id' });

module.exports = { sequelize, User, Customer, Product, Service, Invoice, InvoiceItem, Setting, EmailConfig };
