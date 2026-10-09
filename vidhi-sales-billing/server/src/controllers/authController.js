const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { signToken } = require('../middleware/authMiddleware');
const { asyncHandler, httpError } = require('../middleware/errorMiddleware');

exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) throw httpError(400, 'Username and password are required');
  const user = await User.findOne({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw httpError(401, 'Invalid username or password');
  res.json({ token: signToken(user), username: user.username });
});

exports.register = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) throw httpError(400, 'Username and password are required');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  const user = await User.create({ username, password_hash: await bcrypt.hash(password, 10) });
  res.status(201).json({ id: user.id, username: user.username });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!user || !(await bcrypt.compare(current_password || '', user.password_hash))) throw httpError(400, 'Current password is wrong');
  if (!new_password || new_password.length < 6) throw httpError(400, 'New password must be at least 6 characters');
  await user.update({ password_hash: await bcrypt.hash(new_password, 10) });
  res.json({ message: 'Password changed successfully' });
});
