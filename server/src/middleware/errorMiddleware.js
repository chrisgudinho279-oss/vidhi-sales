exports.httpError = (status, message) => Object.assign(new Error(message), { status });
// wraps async controllers so errors go to errorHandler
exports.asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// router.param('id', validId): ids must be positive whole numbers
exports.validId = (req, res, next, id) => (/^\d{1,10}$/.test(id) ? next() : res.status(400).json({ message: 'Invalid id' }));
exports.notFound = (req, res) => res.status(404).json({ message: 'Route not found' });
exports.errorHandler = (err, req, res, next) => { // eslint-disable-line
  let status = err.status || 500, message = err.message;
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON sent to server'; }
  else if (err.type === 'entity.too.large') { status = 413; message = 'Data is too large (max 5 MB)'; }
  else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    status = 400; message = err.errors.map((e) => e.message).join(', ');
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    status = 400; message = 'This record is in use and cannot be deleted';
  } else if (!err.status && err.name && err.name.startsWith('Sequelize')) {
    status = 500; message = 'Database error: ' + err.message;
  }
  if (status === 500) console.error(err);
  res.status(status).json({ message });
};
