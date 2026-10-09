const jwt = require('jsonwebtoken');
const SECRET = () => process.env.JWT_SECRET || 'change_this_secret';
exports.signToken = (user) => jwt.sign({ id: user.id, username: user.username }, SECRET(), { expiresIn: '8h', algorithm: 'HS256' });

// Every protected route uses this: valid JWT required
exports.auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please login first' });
  try { req.user = jwt.verify(token, SECRET(), { algorithms: ['HS256'] }); next(); }
  catch { res.status(401).json({ message: 'Session expired. Please login again' }); }
};

// Brute-force protection: 5 wrong passwords => locked for 15 minutes (per IP + username)
const attempts = new Map();
const MAX = 5, WINDOW = 15 * 60 * 1000;
exports.loginLimiter = (req, res, next) => {
  const key = req.ip + '|' + String((req.body && req.body.username) || '').toLowerCase();
  const now = Date.now();
  const a = attempts.get(key);
  if (a && a.until && a.until <= now) attempts.delete(key);
  else if (a && a.until) return res.status(429).json({ message: `Too many failed attempts. Try again in ${Math.ceil((a.until - now) / 60000)} minute(s)` });
  req.limitKey = key;
  next();
};
exports.recordFail = (key) => {
  const now = Date.now();
  let a = attempts.get(key);
  if (!a || a.reset < now) a = { count: 0, reset: now + WINDOW };
  a.count += 1;
  if (a.count >= MAX) a.until = now + WINDOW;
  attempts.set(key, a);
};
exports.clearFails = (key) => attempts.delete(key);
