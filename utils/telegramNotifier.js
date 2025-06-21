const axios = require('axios');

/**
 * Sends a formatted order notification to the configured Telegram group.
 * @param {object} orderData - The data for the order.
 * @param {object} orderData.customer - Customer details { name, phone }.
 * @param {Array<object>} orderData.items - Array of items in the cart.
 */
async function sendTelegramOrderNotification(orderData) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.error('Telegram credentials are not configured in .env file.');
        return;
    }

    // Using our helper function to pre-process the text
    const customerName = escapeMarkdown(orderData.customer.name);
    const customerPhone = escapeMarkdown(orderData.customer.phone);

    let message = `‼️ *New Order Received* ‼️\n\n`;
    message += `*ឈ្មោះអតិថិជន:* ${customerName}\n`;
    message += `*លេខទូរស័ព្ទទំនាក់ទំនង:* \`${customerPhone}\`\n\n`;
    message += ` 🧾 *វិក្ក័យបត្រ:* 🧾\n\n`;

    let totalAmount = 0;
    orderData.items.forEach(item => {
        const itemTotal = item.selling_price * item.quantity;
        totalAmount += itemTotal;
        const itemName = escapeMarkdown(item.name_km || item.name_en); // <-- CHANGE THIS LINE

        // =================================================================
        // THE FIX: The first hyphen for the list item must also be escaped.
        // =================================================================
        message += `  \\- ${itemName} \\(x${item.quantity}\\) \\- *${itemTotal.toLocaleString('en-US')} ฿*\n`;
    });

    const totalAmountString = escapeMarkdown(totalAmount.toLocaleString('en-US'));
    message += `\n*Total Amount: ${totalAmountString} ฿*`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'MarkdownV2'
        });
        console.log('Successfully sent order notification to Telegram.');
    } catch (error) {
        console.error('Failed to send Telegram notification:', error.response ? error.response.data : error.message);
    }
}

// Telegram's MarkdownV2 is very strict. We must escape these characters.
function escapeMarkdown(text) {
    if (typeof text !== 'string') return text;
    const escapeChars = '_*[]()~`>#+-=|{}.!';
    return text.replace(new RegExp(`[${escapeChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`, 'g'), '\\$&');
}


module.exports = { sendTelegramOrderNotification };