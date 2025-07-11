// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

// The main endpoint for all dashboard data
router.get('/summary', verifyToken, dashboardController.getDashboardSummary);
router.get('/expiring-soon', verifyToken, dashboardController.getExpiringSoonProducts);


module.exports = router;