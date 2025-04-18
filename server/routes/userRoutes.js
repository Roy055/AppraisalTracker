import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { login, getMe, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST /api/users/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Validate role - only allow hr, manager, employee
    const allowedRoles = ['hr', 'manager', 'employee'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role selected'
      });
    }

    // Create user with the specified role (or default to employee)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// @route   GET /api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin, HR)
router.get('/', protect, authorize(['admin', 'hr']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin, HR)
router.post('/', protect, authorize(['admin', 'hr']), createUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin, HR)
router.put('/:id', protect, authorize(['admin', 'hr']), updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', protect, authorize(['admin']), deleteUser);

// @route   GET /api/users/debug
// @desc    Debug user authentication and roles
// @access  Private
router.get('/debug', protect, async (req, res) => {
  try {
    // Return user information and role details
    const userInfo = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      isAuthenticated: true,
      timestamp: new Date(),
      canManageAppraisals: req.user.role === 'admin' || req.user.role === 'hr' || req.user.role === 'manager',
      canReviewAppraisals: req.user.role === 'manager',
      canFinalizeAppraisals: req.user.role === 'hr' || req.user.role === 'admin'
    };
    
    res.status(200).json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    console.error('Debug user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 