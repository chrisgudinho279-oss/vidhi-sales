const router = require('express').Router();
const c = require('../controllers/authController');
const { auth, loginLimiter } = require('../middleware/authMiddleware');
const { User } = require('../models');
// register: free only for the very first user, afterwards login is needed
const firstUserOrAuth = async (req, res, next) => ((await User.count()) === 0 ? next() : auth(req, res, next));
router.post('/login', loginLimiter, c.login);
router.post('/register', firstUserOrAuth, c.register);
router.post('/change-password', auth, c.changePassword);
module.exports = router;
