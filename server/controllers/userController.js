import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists - explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ 
        success: false,
        error: 'Account is not active' 
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin/HR)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists' 
      });
    }

    // Prevent creating admin users through the API
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Creating admin users is not allowed'
      });
    }

    // Validate role
    const allowedRoles = ['hr', 'manager', 'employee'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role selected'
      });
    }

    // Create user
    user = new User({
      name,
      email,
      password,
      role: role || 'employee',
      department
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin/HR)
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, status, department, password } = req.body;
    const userId = req.params.id;

    // Check if user exists
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Prevent changing a user's role to admin
    if (role === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Changing a user role to admin is not allowed'
      });
    }

    // Prevent changing an admin's role to something else
    if (user.role === 'admin' && role && role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Changing an admin user\'s role is not allowed'
      });
    }

    // Validate role if provided
    if (role && role !== 'admin') {
      const allowedRoles = ['hr', 'manager', 'employee'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role selected'
        });
      }
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (department) updateData.department = department;

    // If password is provided, update it
    if (password && password.length >= 6) {
      user.password = password;
      await user.save(); // This will trigger the password hashing middleware
      
      // Update other fields
      user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      // Update without password
      user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 