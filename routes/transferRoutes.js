// backend/routes/transferRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller functions we just created
const { createTransfer, getTransferHistory } = require('../controllers/transferController');
// Import the middleware to protect the routes
const { verifyToken } = require('../middleware/authMiddleware');

// Route to get all transfer history
// GET /api/transfers/
router.get('/', verifyToken, getTransferHistory);

// Route to create a new transfer
// POST /api/transfers/
router.post('/', verifyToken, createTransfer);

module.exports = router;