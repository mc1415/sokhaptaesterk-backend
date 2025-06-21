const { sendTelegramOrderNotification } = require('../utils/telegramNotifier');
const supabase = require('../services/supabaseService');

const createOrder = async (req, res) => {
    try {
        const { items, customer } = req.body;

        // --- 1. Basic Server-Side Validation ---
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item.' });
        }
        if (!customer || !customer.name || !customer.phone) {
            return res.status(400).json({ error: 'Customer name and phone number are required.' });
        }

        // --- 2. (Future Enhancement) Verify Product Prices & Stock ---
        // In a real-world, high-stakes application, you would loop through `items`,
        // fetch each product's real price and stock from Supabase, and verify them
        // to prevent a malicious user from changing prices on the frontend.
        // For now, we trust the data from the client.

        // --- 3. (Future Enhancement) Save the Order to Your Database ---
        // This is where you would insert the order into your Supabase 'orders' and
        // 'order_items' tables, and then decrement the product stock.
        // We will skip this for now to focus on the notification.
        console.log('--- Simulating Order ---');
        console.log('Customer:', customer);
        console.log('Items:', items);
        console.log('------------------------');


        // --- 4. Send the Notification ---
        // We can use the data directly from the request body.
        await sendTelegramOrderNotification({ items, customer });

        // --- 5. Send a Success Response ---
        res.status(201).json({ message: 'Order received successfully! Thank you.' });

    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({ error: 'There was an error processing your order. Please try again later.' });
    }
};

module.exports = {
    createOrder
};