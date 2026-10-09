const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { signToken, recordFail, clearFails } = require('../middleware/authMiddleware');
const { asyncHandler, httpError } = require('../middleware/errorMiddleware');
const v = require('../utils/validators');
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10); // same timing whether user exists or not

exports.login = asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!username || !password) throw httpError(400, 'Username and password are required');
  if (username.length > 50 || password.length > 100) throw httpError(400, 'Invalid username or password');
  const user = await User.findOne({ where: { username } });
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) { recordFail(req.limitKey); throw httpError(401, 'Invalid username or password'); }
  clearFails(req.limitKey);
  res.json({ token: signToken(user), username: user.username });
});

exports.register = asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (!v.checkUsername(username)) throw httpError(400, 'Username must be 3-30 letters, numbers or underscore');
  if (!v.checkPassword(password)) throw httpError(400, v.PASSWORD_MSG);
  if (await User.findOne({ where: { username } })) throw httpError(400, 'Username already exists');
  const user = await User.create({ username, password_hash: await bcrypt.hash(password, 10) });
  res.status(201).json({ id: user.id, username: user.username });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!user || !(await bcrypt.compare(String(current_password || ''), user.password_hash))) throw httpError(400, 'Current password is wrong');
  if (!v.checkPassword(new_password)) throw httpError(400, v.PASSWORD_MSG);
  if (new_password === current_password) throw httpError(400, 'New password must be different from the current password');
  await user.update({ password_hash: await bcrypt.hash(new_password, 10) });
  res.json({ message: 'Password changed successfully' });
});
