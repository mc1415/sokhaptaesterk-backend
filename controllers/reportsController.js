// backend/controllers/reportsController.js
const supabase = require('../services/supabaseService');

// This function generates a detailed sales report for a given date range
const generateSalesReport = async (req, res) => {
    // Get start_date and end_date from the query parameters (e.g., /api/reports/sales?start_date=...&end_date=...)
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Start date and end date are required.' });
    }

    try {
        // Use an RPC call to a new, powerful database function
        const { data, error } = await supabase.rpc('generate_sales_report_for_period', {
            p_start_date: start_date,
            p_end_date: end_date
        });

        if (error) throw error;
        
        // The function will return a single JSON object with all the stats
        res.status(200).json(data);

    } catch (err) {
        console.error('Error generating sales report:', err);
        res.status(500).json({ error: 'Failed to generate sales report', details: err.message });
    }
};

module.exports = {
    generateSalesReport
};