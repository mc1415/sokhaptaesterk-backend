// backend/index.js

// 1. Load environment variables from .env file
require('dotenv').config(); 

// 2. Import necessary packages
const express = require('express');
const cors = require('cors');

// 3. Import your route files (we will create these next)
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const transferRoutes = require('./routes/transferRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// 4. Create the Express application
const app = express();

const defaultLocalOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:8080',
  'http://127.0.0.1:5500'
];

const allowedOrigins = [
  process.env.CORS_ORIGIN,       // For your deployed production site
  process.env.CORS_ORIGIN_LOCAL, // For your local development
  ...defaultLocalOrigins
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};
app.use(cors(corsOptions));
app.use(express.json()); // Allows the server to understand JSON data sent from the frontend

// 6. Define the API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);

// 7. Create a simple "health check" route to see if the server is running
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Sokha Ptaes Terk API is healthy and running!' });
});

// 8. Start the server and listen for requests
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
