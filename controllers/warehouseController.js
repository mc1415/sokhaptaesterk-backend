// backend/controllers/warehouseController.js
const supabase = require('../services/supabaseService');

// GET all warehouses (already exists)
const getAllWarehouses = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('warehouses')
            .select('*') // Get all columns for the management page
            .order('name', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching warehouses:', err.message);
        res.status(500).json({ error: 'Failed to fetch warehouses.' });
    }
};

// CREATE a new warehouse
const createWarehouse = async (req, res) => {
    const { name, location, is_retail_location } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Warehouse name is required.' });
    }

    try {
        const { data, error } = await supabase
            .from('warehouses')
            .insert([{ name, location, is_retail_location }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('Error creating warehouse:', err);
        res.status(500).json({ error: 'Failed to create warehouse.' });
    }
};

// UPDATE an existing warehouse
const updateWarehouse = async (req, res) => {
    const { id } = req.params;
    const { name, location, is_retail_location } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Warehouse name is required.' });
    }

    try {
        const { data, error } = await supabase
            .from('warehouses')
            .update({ name, location, is_retail_location })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Warehouse not found.' });
        
        res.status(200).json(data);
    } catch (err) {
        console.error('Error updating warehouse:', err);
        res.status(500).json({ error: 'Failed to update warehouse.' });
    }
};


module.exports = {
    getAllWarehouses,
    createWarehouse,
    updateWarehouse,
};