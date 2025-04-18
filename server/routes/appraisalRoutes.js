import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Appraisal from '../models/Appraisal.js';
import mongoose from 'mongoose';
import { 
  updateAppraisalStatus, 
  submitSelfReview, 
  submitManagerReview, 
  finalizeAppraisal 
} from '../controllers/appraisalWorkflowController.js';
import { testAppraisalWorkflow } from '../controllers/appraisalTestController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// @route   GET /api/appraisals
// @desc    Get all appraisals
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Apply department filter if provided
    if (req.query.departmentId) {
      // We'll need to join with User collection to filter by department
      const User = mongoose.model('User');
      const usersInDepartment = await User.find({ department: req.query.departmentId }).select('_id');
      const userIds = usersInDepartment.map(user => user._id);
      
      // Add the user IDs to the query
      query.employee = { $in: userIds };
    }
    
    // If user is not admin or HR, only show their own appraisals
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      if (req.user.role === 'manager') {
        // For managers, show all appraisals if no department filter
        // Otherwise show department-specific appraisals
        if (req.user.department) {
          // For managers, show appraisals of their team members
          const User = mongoose.model('User');
          const teamMembers = await User.find({ department: req.user.department }).select('_id');
          const teamMemberIds = teamMembers.map(user => user._id);
          
          // If we already have employee in query from department filter, we need to find the intersection
          if (query.employee && query.employee.$in) {
            const filteredIds = query.employee.$in.filter(id => 
              teamMemberIds.some(teamId => teamId.toString() === id.toString())
            );
            query.employee = { $in: filteredIds };
          } else {
            query.employee = { $in: teamMemberIds };
          }
        }
        // If no department set for manager, don't restrict by employee
        // This ensures managers can see all appraisals they should have access to
      } else {
        // For regular employees, only show their own appraisals
        query.employee = req.user.id;
      }
    }
    
    //const appraisals = await Appraisal.find(query);

    const appraisals = await Appraisal.find(query).populate('employee','name');


    res.status(200).json({
      success: true,
      count: appraisals.length,
      data: appraisals
    });
  } catch (error) {
    console.error('Get appraisals error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/appraisals/:id
// @desc    Get appraisal by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const appraisal = await Appraisal.findById(req.params.id);
    
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        error: 'Appraisal not found'
      });
    }
    
    // Check if user has permission to view this appraisal
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && 
        appraisal.employee.toString() !== req.user.id && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this appraisal'
      });
    }
    
    res.status(200).json({
      success: true,
      data: appraisal
    });
  } catch (error) {
    console.error('Get appraisal error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/appraisals
// @desc    Create new appraisal
// @access  Private (HR, Manager, Admin)
router.post('/', authorize(['admin', 'hr', 'manager']), async (req, res) => {
  try {
    const appraisal = await Appraisal.create(req.body);
    res.status(201).json({
      success: true,
      data: appraisal
    });
  } catch (error) {
    console.error('Create appraisal error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/appraisals/:id
// @desc    Update appraisal
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let appraisal = await Appraisal.findById(req.params.id);
    
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        error: 'Appraisal not found'
      });
    }
    
    // Check permissions based on appraisal status and user role
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      if (req.user.role === 'manager') {
        // Managers can only update if status is 'self-review'
        if (appraisal.status !== 'self-review') {
          return res.status(403).json({
            success: false,
            error: 'Managers can only update appraisals in self-review status'
          });
        }
      } else {
        // Employees can only update their own appraisals and only if status is 'pending'
        if (appraisal.employee.toString() !== req.user.id || appraisal.status !== 'pending') {
          return res.status(403).json({
            success: false,
            error: 'Not authorized to update this appraisal'
          });
        }
      }
    }
    
    appraisal = await Appraisal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: appraisal
    });
  } catch (error) {
    console.error('Update appraisal error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/appraisals/:id
// @desc    Delete appraisal
// @access  Private (Admin only)
router.delete('/:id', authorize(['admin']), async (req, res) => {
  try {
    const appraisal = await Appraisal.findByIdAndDelete(req.params.id);
    
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        error: 'Appraisal not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete appraisal error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/appraisals/:id/status
// @desc    Update appraisal status
// @access  Private
router.put('/:id/status', updateAppraisalStatus);

// @route   POST /api/appraisals/:id/self-review
// @desc    Submit self review
// @access  Private (Employee only)
router.post('/:id/self-review', submitSelfReview);

// @route   POST /api/appraisals/:id/manager-review
// @desc    Submit manager review
// @access  Private (Manager only)
router.post('/:id/manager-review', authorize(['manager', 'admin']), submitManagerReview);

// @route   POST /api/appraisals/:id/finalize
// @desc    Finalize appraisal
// @access  Private (HR only)
router.post('/:id/finalize', authorize(['hr', 'admin']), finalizeAppraisal);

// @route   GET /api/appraisals/test/:id
// @desc    Test the appraisal workflow
// @access  Private
router.get('/test/:id', testAppraisalWorkflow);

// Export the router
export default router; 