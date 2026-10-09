const jwt = require('jsonwebtoken');
const SECRET = () => process.env.JWT_SECRET || 'change_this_secret';
exports.signToken = (user) => jwt.sign({ id: user.id, username: user.username }, SECRET(), { expiresIn: '8h' });
exports.auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please login first' });
  try { req.user = jwt.verify(token, SECRET()); next(); }
  catch { res.status(401).json({ message: 'Session expired. Please login again' }); }
};
