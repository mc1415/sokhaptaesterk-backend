// backend/services/supabaseService.js
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Check if the variables are loaded correctly
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Key is not defined. Make sure you have a .env file in your /backend directory.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;