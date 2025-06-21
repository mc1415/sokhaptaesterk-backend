const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');

// This is a public route. No `verifyToken` is needed because anyone
// should be able to place an order.
// It will handle POST requests to /api/orders
router.post('/', orderController.createOrder);

module.exports = router;