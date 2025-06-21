// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/authMiddleware'); // Import the middleware

router.get('/public', productController.getPublicProducts);
router.get('/detailed-inventory', verifyToken, productController.getDetailedInventory);
// When a GET request comes to /api/products, first verify the token,
// then run the getAllProductsWithInventory function.
router.get('/', verifyToken, productController.getAllProductsWithInventory);
router.post('/', verifyToken, productController.createProduct);          // POST /api/products
router.put('/:id', verifyToken, productController.updateProduct);        // PUT /api/products/:id
router.delete('/:id', verifyToken, productController.deleteProduct);     // DELETE /api/products/:id

router.get('/:id', productController.getProductById);

module.exports = router;