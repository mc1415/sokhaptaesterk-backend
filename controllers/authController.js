// backend/controllers/authController.js
const supabase = require('../services/supabaseService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Fetch the user from the database based on their email
    const { data: user, error } = await supabase
      .from('staff') // The name of your table in Supabase
      .select('id, full_name, email, role, password_hash, is_active')
      .eq('email', email)
      .single(); // .single() expects only one result, which is good for unique emails

    // Handle user not found or other database errors
    if (error || !user) {
      return res.status(404).json({ error: 'User not found or invalid credentials' });
    }
    
    // Check if the user's account is active
    if (!user.is_active) {
        return res.status(403).json({ error: 'This user account has been deactivated.' });
    }

    // 2. Compare the provided password with the hashed password from the database
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. If password is valid, create a JSON Web Token (JWT)
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET, // The secret key from your .env file
      { expiresIn: '8h' } // The token will be valid for 8 hours
    );

    // 4. Send a success response with the token and user info
    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        fullName: user.full_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
};

const getAllStaff = async (req, res) => {
    try {
        // We select all columns EXCEPT the password hash for security
        const { data, error } = await supabase
            .from('staff')
            .select('id, full_name, email, role, is_active')
            .order('full_name', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch staff.', details: err.message });
    }
};

// CREATE a new staff member (Register)
const createStaff = async (req, res) => {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Step 1: Manually hash the password using bcryptjs
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Step 2: Directly insert into your public 'staff' table
        const { data, error } = await supabase
            .from('staff')
            .insert([{ 
                full_name, 
                email, 
                password_hash, // Insert the hash we just created
                role, 
                is_active: true 
            }])
            .select('id, full_name, email, role, is_active')
            .single();

        // Handle database errors (like a duplicate email)
        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({ error: 'A staff member with this email already exists.' });
            }
            throw error;
        }
        
        res.status(201).json(data);

    } catch (err) {
        console.error('Error creating staff member:', err);
        res.status(500).json({ error: 'Failed to create staff member.', details: err.message });
    }
};

// UPDATE a staff member's details
const updateStaff = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, role, is_active, password } = req.body;

    // Build the update object dynamically
    const updateData = { full_name, email, role, is_active };

    // If a new password is provided, hash it and add it to the update object
    if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(password, salt);
    }

    try {
        const { data, error } = await supabase
            .from('staff')
            .update(updateData)
            .eq('id', id)
            .select('id, full_name, email, role, is_active')
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Staff member not found.' });
        
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update staff member.', details: err.message });
    }
};

// DELETE (deactivate) a staff member
const deleteStaff = async (req, res) => {
    const { id } = req.params;

    // Prevent a user from deactivating their own account
    if (id === req.user.id) {
        return res.status(403).json({ error: 'You cannot deactivate your own account.' });
    }

    try {
        const { error } = await supabase
            .from('staff')
            .update({ is_active: false }) // Soft delete
            .eq('id', id);

        if (error) throw error;
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to deactivate staff member.', details: err.message });
    }
};


// Make the login function available to be used in other files
module.exports = {
  login,
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff
};