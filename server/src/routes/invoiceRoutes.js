const router = require('express').Router();
router.param('id', require('../middleware/errorMiddleware').validId);
const c = require('../controllers/invoiceController');
router.get('/backup', c.backup);        // must be before /:id
router.post('/restore', c.restore);
router.post('/:id/email', c.email);
router.get('/:id/pdf', c.pdf);
router.get('/', c.list); router.get('/:id', c.get); router.post('/', c.create);
router.put('/:id', c.update); router.delete('/:id', c.remove);
module.exports = router;
