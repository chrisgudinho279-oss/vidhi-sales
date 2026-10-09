const router = require('express').Router();
router.param('id', require('../middleware/errorMiddleware').validId);
const { products } = require('../controllers/productController');
router.get('/', products.list); router.post('/', products.create);
router.put('/:id', products.update); router.delete('/:id', products.remove);
module.exports = router;
