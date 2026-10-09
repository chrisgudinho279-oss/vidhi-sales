const router = require('express').Router();
const c = require('../controllers/invoiceController');
router.get('/backup', c.backup);        // must be before /:id
router.post('/restore', c.restore);
router.get('/', c.list); router.get('/:id', c.get); router.post('/', c.create);
router.put('/:id', c.update); router.delete('/:id', c.remove);
module.exports = router;
