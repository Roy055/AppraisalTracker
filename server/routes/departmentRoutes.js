import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Department from '../models/Department.js';
import mongoose from 'mongoose';

const router = express.Router();

// Protect all routes
router.use(protect);

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/departments/:id
// @desc    Get department by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/departments
// @desc    Create new department
// @access  Private (Admin only)
router.post('/', authorize(['admin']), async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private (Admin only)
router.put('/:id', authorize(['admin']), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete department
// @access  Private (Admin only)
router.delete('/:id', authorize(['admin']), async (req, res) => {
  try {
    // Check if department exists
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    // Check if there are users assigned to this department
    const User = mongoose.model('User');
    const assignedUsers = await User.countDocuments({ department: req.params.id });
    
    if (assignedUsers > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete department with assigned users'
      });
    }
    
    // If no users assigned, proceed with deletion
    await Department.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 