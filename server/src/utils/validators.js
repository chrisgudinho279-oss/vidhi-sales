// Shared validation rules (used by models, controllers and routes)
const PHONE = /^[6-9]\d{9}$/;
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
const USERNAME = /^[A-Za-z0-9_]{3,30}$/;

exports.checkPhone = (v) => !v || PHONE.test(v);
exports.checkEmail = (v) => !v || EMAIL.test(v);
exports.checkGstin = (v) => !v || GSTIN.test(String(v).toUpperCase());
exports.checkPassword = (v) => PASSWORD.test(v || '');
exports.checkUsername = (v) => USERNAME.test(v || '');
exports.isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(new Date(s));
exports.PASSWORD_MSG = 'Password must be 8-64 characters with at least one letter and one number';
exports.PHONE_MSG = 'Phone must be a valid 10-digit mobile number';
exports.EMAIL_MSG = 'Email address is not valid';
exports.GSTIN_MSG = 'GSTIN is not valid (15 characters, e.g. 30ABCDE1234F1Z5)';
