const router = require('express').Router();
router.param('id', require('../middleware/errorMiddleware').validId);
const { services } = require('../controllers/productController');
router.get('/', services.list); router.post('/', services.create);
router.put('/:id', services.update); router.delete('/:id', services.remove);
module.exports = router;
