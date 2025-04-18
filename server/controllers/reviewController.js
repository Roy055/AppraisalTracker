import Review from '../models/Review.js';
import Appraisal from '../models/Appraisal.js';
import User from '../models/User.js';

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Private (Admin, HR, Manager)
export const getReviews = async (req, res) => {
  try {
    let query = {};
    
    // If not admin or HR, filter reviews
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      if (req.user.role === 'manager' && req.user.department) {
        // For managers, show reviews of their team members
        const teamMembers = await User.find({ department: req.user.department }).select('_id');
        const teamMemberIds = teamMembers.map(user => user._id);
        query.employeeId = { $in: teamMemberIds };
      } else {
        // For regular employees, only show their own reviews
        query.employeeId = req.user.id;
      }
    }
    
    const reviews = await Review.find(query)
      .populate('appraisalId', 'appraisalCycle status')
      .populate('employeeId', 'name email');
      
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Private
export const getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('appraisalId', 'appraisalCycle status')
      .populate('employeeId', 'name email');
      
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Check if user has permission to view this review
    const isOwner = review.employeeId._id.toString() === req.user.id;
    const isManager = req.user.role === 'manager' && req.user.department;
    const isAdminOrHR = req.user.role === 'admin' || req.user.role === 'hr';
    
    if (!isOwner && !isAdminOrHR && !isManager) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this review'
      });
    }
    
    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get review by appraisal and employee
// @route   GET /api/reviews/appraisal/:appraisalId/employee/:employeeId
// @access  Private
export const getReviewByAppraisalAndEmployee = async (req, res) => {
  try {
    const { appraisalId, employeeId } = req.params;
    
    const review = await Review.findOne({ 
      appraisalId, 
      employeeId 
    })
    .populate('appraisalId', 'appraisalCycle status')
    .populate('employeeId', 'name email');
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Check if user has permission to view this review
    const isOwner = review.employeeId._id.toString() === req.user.id;
    const isManager = req.user.role === 'manager' && req.user.department;
    const isAdminOrHR = req.user.role === 'admin' || req.user.role === 'hr';
    
    if (!isOwner && !isAdminOrHR && !isManager) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this review'
      });
    }
    
    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get review by appraisal and employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { appraisalId, employeeId, strengths, improvements, achievements, challenges, selfRating } = req.body;
    
    // Verify appraisal exists
    const appraisal = await Appraisal.findById(appraisalId);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        error: 'Appraisal not found'
      });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({ appraisalId, employeeId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'Review already exists for this appraisal and employee'
      });
    }
    
    // Check if user is submitting their own review
    if (employeeId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create review for another employee'
      });
    }
    
    // Create review
    const review = await Review.create({
      appraisalId,
      employeeId,
      strengths,
      improvements,
      achievements,
      challenges,
      selfRating
    });
    
    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    let review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Check permissions based on fields being updated
    const isEmployeeUpdating = review.employeeId.toString() === req.user.id;
    const isManagerUpdating = req.user.role === 'manager';
    const isAdminOrHR = req.user.role === 'admin' || req.user.role === 'hr';
    
    // Get the appraisal to check its status
    const appraisal = await Appraisal.findById(review.appraisalId);
    
    // Employee can only update their own review during self-review or pending stage
    if (isEmployeeUpdating && !isAdminOrHR) {
      if (!['pending', 'self-review'].includes(appraisal.status)) {
        return res.status(403).json({
          success: false,
          error: 'Cannot update review after self-review stage'
        });
      }
      
      // Employee can only update certain fields
      const allowedFields = ['strengths', 'improvements', 'achievements', 'challenges', 'selfRating'];
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          review[key] = req.body[key];
        }
      });
    } 
    // Manager can update manager fields during PM review stage
    else if (isManagerUpdating && !isAdminOrHR) {
      if (appraisal.status !== 'pm-review') {
        return res.status(403).json({
          success: false,
          error: 'Managers can only update reviews during PM review stage'
        });
      }
      
      // Manager can only update manager-specific fields
      if (req.body.managerComments) review.managerComments = req.body.managerComments;
      if (req.body.managerRating) review.managerRating = req.body.managerRating;
    }
    // Admin and HR can update any field
    else if (isAdminOrHR) {
      Object.keys(req.body).forEach(key => {
        review[key] = req.body[key];
      });
    }
    // Otherwise, not authorized
    else {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this review'
      });
    }
    
    await review.save();
    
    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Admin only)
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    // Only admin can delete reviews
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete reviews'
      });
    }
    
    await review.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 