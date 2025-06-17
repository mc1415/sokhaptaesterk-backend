// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/authMiddleware');

// When a POST request comes to /api/transactions/sales, first verify the token,
// then run the createSale function.
router.post('/sales', verifyToken, transactionController.createSale);
router.get('/sales', verifyToken, transactionController.getSalesHistory);
router.get('/sales/:id', verifyToken, transactionController.getSaleDetails);
router.post('/stock', verifyToken, transactionController.adjustStock);

// We will add the stock adjustment route here later
// router.post('/stock', verifyToken, transactionController.adjustStock);

module.exports = router;