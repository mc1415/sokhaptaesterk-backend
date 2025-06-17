// backend/controllers/transferController.js
const supabase = require('../services/supabaseService');

// Function to create a new stock transfer
const createTransfer = async (req, res) => {
    // We expect an array of 'items' in the request body
    const { from_warehouse_id, to_warehouse_id, items, notes } = req.body;
    const initiated_by = req.user.id; // Get the user ID from the verified token

    // Basic validation
    if (!from_warehouse_id || !to_warehouse_id || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required transfer information (from, to, and items).' });
    }
    if (from_warehouse_id === to_warehouse_id) {
        return res.status(400).json({ error: 'Source and destination warehouses cannot be the same.' });
    }

    try {
        // Call the Supabase database function to handle the transfer atomically
        const { data: newTransferId, error } = await supabase.rpc('process_stock_transfer', {
            p_from_warehouse_id: from_warehouse_id,
            p_to_warehouse_id: to_warehouse_id,
            p_staff_id: initiated_by,
            p_notes: notes,
            p_items_to_transfer: items // Pass the array of items
        });

        if (error) {
            // If the database function returned an error (e.g., not enough stock), throw it
            throw error;
        }

        res.status(201).json({ message: 'Stock transfer completed successfully.', transferId: newTransferId });

    } catch (err) {
        console.error('Error creating stock transfer:', err);
        // Provide the specific database error message to the frontend if available
        res.status(500).json({ error: 'Failed to process stock transfer.', details: err.message });
    }
};

// Function to get the history of all transfers
const getTransferHistory = async (req, res) => {
    try {
        // Query the transfers table and join related data for a user-friendly display
        const { data, error } = await supabase
            .from('stock_transfers')
            .select(`
                id,
                transfer_date,
                status,
                from_warehouse:warehouses!stock_transfers_from_warehouse_id_fkey(name),
                to_warehouse:warehouses!stock_transfers_to_warehouse_id_fkey(name),
                initiator:staff(full_name)
            `)
            .order('transfer_date', { ascending: false }); // Show most recent first

        if (error) throw error;

        res.status(200).json(data);
    } catch (err) {
        console.error('Error fetching transfer history:', err);
        res.status(500).json({ error: 'Failed to fetch transfer history.' });
    }
};


module.exports = {
    createTransfer,
    getTransferHistory,
};