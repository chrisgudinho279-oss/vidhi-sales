const router = require('express').Router();
const c = require('../controllers/emailController');

router.get('/google/status', c.status);
router.post('/google/connect', c.connect);
router.post('/google/disconnect', c.disconnect);
router.put('/business-address', c.saveBusinessEmail);

module.exports = router;
