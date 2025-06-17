// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

// The main endpoint for all dashboard data
router.get('/summary', verifyToken, getDashboardSummary);

module.exports = router;