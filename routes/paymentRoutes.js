// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createAbaQr } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

// backend/routes/paymentRoutes.js
router.post('/aba-qr', verifyToken, createAbaQr);

module.exports = router;