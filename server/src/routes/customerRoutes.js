const router = require('express').Router();
router.param('id', require('../middleware/errorMiddleware').validId);
const c = require('../controllers/customerController');
router.get('/', c.list); router.post('/', c.create);
router.put('/:id', c.update); router.delete('/:id', c.remove);
module.exports = router;
