// backend/routes/warehouseRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getAllWarehouses, 
    createWarehouse, 
    updateWarehouse 
} = require('../controllers/warehouseController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET all warehouses
router.get('/', verifyToken, getAllWarehouses);

// POST to create a new warehouse
router.post('/', verifyToken, createWarehouse);

// PUT to update a specific warehouse
router.put('/:id', verifyToken, updateWarehouse);

module.exports = router;