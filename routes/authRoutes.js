// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller that has our login logic
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Define the route: when a POST request comes to /api/auth/login,
// run the login function from our controller.
router.post('/login', authController.login);
router.get('/staff', verifyToken, authController.getAllStaff);
router.post('/staff', verifyToken, authController.createStaff);
router.put('/staff/:id', verifyToken, authController.updateStaff);
router.delete('/staff/:id', verifyToken, authController.deleteStaff);

module.exports = router;