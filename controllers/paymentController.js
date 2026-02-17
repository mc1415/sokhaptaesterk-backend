// backend/controllers/paymentController.js
const crypto = require('crypto');

const createAbaQr = async (req, res) => {
    // 1. Get transaction details from our frontend
    const { tran_id, amount, items_base64 } = req.body;
    
    // --- 2. Get Credentials and ADD A CHECK ---
    const merchantId = process.env.PAYWAY_MERCHANT_ID;
    const apiKey = process.env.PAYWAY_API_KEY;
    const paywayApiUrl = process.env.PAYWAY_API_URL || 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/generate-qr';

    if (!merchantId || !apiKey) {
        console.error("FATAL ERROR: PayWay credentials not found in .env file.");
        return res.status(500).json({ error: 'Payment gateway is not configured on the server.' });
    }

    // --- 3. Prepare data ---
    const req_time = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const purchase_type = 'purchase';
    const lifetime = parseInt(process.env.PAYWAY_QR_LIFETIME_MINUTES || '6', 10);
    const qr_image_template = process.env.PAYWAY_QR_IMAGE_TEMPLATE || 'template3_color';
    const callback_url = process.env.PAYWAY_CALLBACK_URL
        ? Buffer.from(process.env.PAYWAY_CALLBACK_URL).toString('base64')
        : '';
    
    const bodyForPayway = {
        req_time,
        merchant_id: merchantId,
        tran_id,
        amount,
        items: items_base64 || '',
        purchase_type,
        payment_option: "abapay_khqr",
        callback_url: callback_url || null,
        currency: "USD",
        lifetime,
        qr_image_template,
    };

    // --- 4. Create the Hash ---
    // The hash string must only contain values for the fields being sent.
    // The order is critical and must match the documentation.
    const hashString = 
        bodyForPayway.req_time +
        bodyForPayway.merchant_id +
        bodyForPayway.tran_id +
        bodyForPayway.amount +
        (bodyForPayway.items || '') +
        '' + // first_name
        '' + // last_name
        '' + // email
        '' + // phone
        (bodyForPayway.purchase_type || '') +
        bodyForPayway.payment_option +
        (bodyForPayway.callback_url || '') +
        '' + // return_deeplink
        bodyForPayway.currency +
        '' + // custom_fields
        '' + // return_params
        '' + // payout
        bodyForPayway.lifetime +
        bodyForPayway.qr_image_template;

    const hmac = crypto.createHmac('sha512', apiKey);
    hmac.update(hashString);
    const hash = hmac.digest('base64');
    
    bodyForPayway.hash = hash;

    // --- 5. Make the API call ---
    try {
        const response = await fetch(paywayApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyForPayway)
        });

        const responseData = await response.json();

        if (!response.ok || responseData.status.code !== "0") {
            console.error("PayWay QR API Error:", responseData);
            return res.status(400).json({ 
                error: `PayWay Error: ${responseData.status.message}`,
                code: responseData.status.code
            });
        }

        res.status(200).json(responseData);

    } catch (error) {
        console.error('Error contacting PayWay QR API:', error);
        res.status(500).json({ error: 'Failed to generate QR code.' });
    }
};

module.exports = {
    createAbaQr
};
