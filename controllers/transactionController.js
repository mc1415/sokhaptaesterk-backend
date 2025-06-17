// backend/controllers/transactionController.js
const supabase = require('../services/supabaseService');

// In backend/controllers/transactionController.js

const createSale = async (req, res) => {
    const { warehouse_id, sale_items, total_amount, payment_method } = req.body;
    const staff_id = req.user.id; 

    if (!warehouse_id || !sale_items || !total_amount || !payment_method) {
        return res.status(400).json({ error: 'Missing required sale data.' });
    }

    try {
        const { data: newSaleId, error: rpcError } = await supabase.rpc('process_sale', {
            p_staff_id: staff_id,
            p_warehouse_id: warehouse_id,
            p_sale_items: sale_items,
            p_total_amount: total_amount,
            p_payment_method: payment_method
        });

        if (rpcError) throw rpcError;

        // --- START OF THE FIX ---

        // Step 1: Fetch the basic transaction details
        const { data: transactionData, error: detailsError } = await supabase
            .from('sales_transactions')
            .select('*, staff(full_name)')
            .eq('id', newSaleId)
            .single();

        if (detailsError) throw detailsError;

        // Step 2: Extract all product IDs from the sale_items JSON
        const productIds = transactionData.sale_items.map(item => item.product_id);

        // Step 3: Fetch all the corresponding product names in one query
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name_en')
            .in('id', productIds);

        if (productsError) throw productsError;

        // Step 4: Create a fast lookup map (id -> name)
        const productNameMap = new Map(products.map(p => [p.id, p.name_en]));

        // Step 5: Create a new, "enriched" sale_items array that includes the name
        const enrichedSaleItems = transactionData.sale_items.map(item => ({
            ...item,
            name_en: productNameMap.get(item.product_id) || 'Unknown Product'
        }));

        // Step 6: Create the final data object to send back to the frontend
        const finalTransactionData = {
            ...transactionData,
            sale_items: enrichedSaleItems // Replace the old array with the new one
        };

        // --- END OF THE FIX ---

        res.status(201).json({ 
            message: 'Sale processed successfully', 
            transactionId: newSaleId,
            transactionData: finalTransactionData // Send the fully enriched data
        });

    } catch (err) {
        console.error('Error in createSale transaction:', err);
        res.status(500).json({ error: 'Failed to process sale.', details: err.message });
    }
};

const getSalesHistory = async (req, res) => {
    try {
        // We want to get the transaction data AND the name of the staff member who made the sale.
        // The '.select()' syntax with a join is perfect for this.
        const { data, error } = await supabase
            .from('sales_transactions')
            .select(`
                id,
                transaction_time,
                total_amount,
                payment_method,
                staff:staff(full_name) 
            `)
            .order('transaction_time', { ascending: false }); // Show most recent sales first

        if (error) {
            throw error;
        }

        // The result will have a 'staff' object. Let's flatten it for easier use on the frontend.
        const formattedData = data.map(sale => ({
            ...sale,
            staff_name: sale.staff ? sale.staff.full_name : 'N/A'
        }));

        res.status(200).json(formattedData);

    } catch (err) {
        console.error("Error fetching sales history:", err);
        res.status(500).json({ error: "Failed to retrieve sales history.", details: err.message });
    }
};

const getSaleDetails = async (req, res) => {
    const { id } = req.params;

    try {
        // Step 1: Fetch the main transaction, including the 'sale_items' jsonb column
        const { data: transaction, error: transactionError } = await supabase
            .from('sales_transactions')
            .select(`
                id,
                receipt_number,
                transaction_time,
                total_amount,
                payment_method,
                sale_items,
                staff:staff(full_name)
            `)
            .eq('id', id)
            .single();

        if (transactionError) throw transactionError;
        if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });

        // Step 2: Extract all the product IDs from the 'sale_items' JSON
        const productIds = transaction.sale_items.map(item => item.product_id);

        // Step 3: Fetch the names of all those products in a single query
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name_en')
            .in('id', productIds);

        if (productsError) throw productsError;

        // Step 4: Create a quick lookup map for product names (id -> name)
        const productNameMap = new Map(products.map(p => [p.id, p.name_en]));

        // Step 5: Add the product name to each item in the 'sale_items' array
        const enrichedItems = transaction.sale_items.map(item => ({
            ...item,
            name_en: productNameMap.get(item.product_id) || 'Unknown Product'
        }));

        // Step 6: Send the complete, enriched transaction data to the frontend
        res.status(200).json({
            ...transaction,
            sale_items: enrichedItems, // Replace old items with enriched items
        });

    } catch(err) {
        console.error(`Error fetching details for sale ${id}:`, err);
        res.status(500).json({ error: 'Failed to retrieve sale details.', details: err.message });
    }
};

const adjustStock = async (req, res) => {
    const { product_id, warehouse_id, adjustment_quantity, reason, notes } = req.body;
    const staff_id = req.user.id;

    if (!product_id || !warehouse_id || !adjustment_quantity || !reason) {
        return res.status(400).json({ error: 'Missing required adjustment data.' });
    }

    try {
        // Use an RPC function for safety, similar to transfers
        const { error } = await supabase.rpc('process_stock_adjustment', {
            p_product_id: product_id,
            p_warehouse_id: warehouse_id,
            p_quantity: adjustment_quantity, // Can be positive (stock in) or negative (stock out)
            p_reason: reason,
            p_staff_id: staff_id,
            p_notes: notes
        });

        if (error) throw error;

        res.status(200).json({ message: 'Stock adjusted successfully.' });
    } catch (err) {
        console.error('Error adjusting stock:', err);
        res.status(500).json({ error: 'Failed to adjust stock.', details: err.message });
    }
};

module.exports = {
    createSale,
    getSalesHistory,
    getSaleDetails,
    adjustStock
};