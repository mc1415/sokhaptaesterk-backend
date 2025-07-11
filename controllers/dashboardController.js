// backend/controllers/dashboardController.js
const supabase = require('../services/supabaseService');

const getDashboardSummary = async (req, res) => {
    try {
        // Get today's date and the date for the start of the current month
        const today = new Date().toISOString().slice(0, 10);
        const startOfMonth = new Date(new Date().setDate(1)).toISOString().slice(0, 10);

        // Run all our database queries concurrently for max speed
        const [
            salesTodayData,
            salesMonthData,
            lowStockData,
            topProductsData
        ] = await Promise.all([
            // Query 1: Sales Today, using your function name and arguments
            supabase.rpc('get_sales_total_for_date_range', { 
                start_date: today,
                end_date: today 
            }),
            // Query 2: Sales This Month, using your function name and arguments
            supabase.rpc('get_sales_total_for_date_range', {
                start_date: startOfMonth,
                end_date: today
            }),
            // Query 3: Low Stock Count (using a direct query is efficient here)
            supabase.from('inventory_view').select('product_name, quantity', { count: 'exact' }).lt('quantity', 10),
            // Query 4: Top Selling Products, using your function name and arguments
            supabase.rpc('get_top_selling_products', {
                days_past: 30,       // Get top sellers from the last 30 days
                product_limit: 5     // Get the top 5 products
            })
        ]);

        // Error checking for each promise
        if (salesTodayData.error) throw salesTodayData.error;
        if (salesMonthData.error) throw salesMonthData.error;
        if (lowStockData.error) throw lowStockData.error;
        if (topProductsData.error) throw topProductsData.error;

        // --- Data Formatting ---
        // Your RPC for sales returns a table, so we need to extract the single value
        const salesToday = salesTodayData.data[0]?.total_sales || 0;
        const salesThisMonth = salesMonthData.data[0]?.total_sales || 0;

        // Format the response object for the frontend
        const summary = {
            sales_today: salesToday,
            sales_this_month: salesThisMonth,
            low_stock_item_count: lowStockData.count || 0,
            low_stock_items: lowStockData.data || [],
            top_selling_products: topProductsData.data || []
        };
        
        res.status(200).json(summary);

    } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard summary', details: err.message });
    }
};

const getExpiringSoonProducts = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiryThresholdDate = thirtyDaysFromNow.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('inventory')
            .select(`
                quantity,
                expiry_date,
                batch_number,
                product_id ( name_en, name_km, sku ),
                warehouse_id ( name )
            `)
            .gt('quantity', 0)
            .lte('expiry_date', expiryThresholdDate)
            .gte('expiry_date', today)
            .order('expiry_date', { ascending: true });

        if (error) {
            console.error("Supabase error in getExpiringSoonProducts:", error);
            throw error;
        }

        // Now, let's rename the keys in the response for cleaner frontend code.
        const formattedData = data.map(item => ({
            ...item,
            product: item.product_id, // Rename product_id to product
            warehouse: item.warehouse_id, // Rename warehouse_id to warehouse
            product_id: undefined, // Remove the old key
            warehouse_id: undefined // Remove the old key
        }));

        res.status(200).json(formattedData);

    } catch (err) {
        console.error('Controller error in getExpiringSoonProducts:', err.message);
        res.status(500).json({ error: 'Failed to retrieve expiring products.' });
    }
};

module.exports = {
    getDashboardSummary,
    getExpiringSoonProducts
};