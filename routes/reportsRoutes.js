// backend/routes/reportsRoutes.js
const express = require('express');
const router = express.Router();
const { generateSalesReport } = require('../controllers/reportsController');
const { verifyToken } = require('../middleware/authMiddleware');

// Define the route for generating a sales report
router.get('/sales', verifyToken, generateSalesReport);

module.exports = router;