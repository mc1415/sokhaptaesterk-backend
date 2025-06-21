// backend/controllers/settingsController.js
const supabase = require('../services/supabaseService');

const getCurrencyRates = async (req, res) => {
    try {
        const { data, error } = await supabase.from('currencies').select('*');
        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve currency rates.' });
    }
};

const updateCurrencyRates = async (req, res) => {
    // Expects an array of currency objects in the body, e.g., [{code: 'USD', rate_to_base: 0.0273}]
    const ratesToUpdate = req.body; 

    if (!Array.isArray(ratesToUpdate) || ratesToUpdate.length === 0) {
        return res.status(400).json({ error: 'Invalid data format.' });
    }

    try {
        // Use Supabase upsert to update existing rates or insert new ones
        const { data, error } = await supabase
            .from('currencies')
            .upsert(ratesToUpdate, { onConflict: 'code' }) // 'code' is the conflict column
            .select();

        if (error) throw error;
        res.status(200).json({ message: 'Currency rates updated successfully.', data });
    } catch (err) {
        console.error("Error updating currency rates:", err);
        res.status(500).json({ error: 'Failed to update currency rates.' });
    }
};

module.exports = { getCurrencyRates, updateCurrencyRates };