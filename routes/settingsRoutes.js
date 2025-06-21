// backend/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/currencies', verifyToken, settingsController.getCurrencyRates);
router.post('/currencies', verifyToken, settingsController.updateCurrencyRates);

module.exports = router;