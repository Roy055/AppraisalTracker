import Appraisal from '../models/Appraisal.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

// @desc    Update appraisal status
// @route   PUT /api/appraisals/:id/status
// @access  Private
export const updateAppraisalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;
    const userId = req.user._id;

    // Validate status
    const validStatuses = ['pending', 'self-review', 'pm-review', 'hr-review', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    // Get the appraisal
    const appraisal = await Appraisal.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        error: 'Appraisal not found'
      });
    }

    // Check permissions based on the current status and requested status
    const currentStatus = appraisal.status;

    // Validate workflow transition
    if (!validateWorkflowTransition(currentStatus, status, userRole, userId, appraisal.employee)) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to make this status transition'
      });
    }

    // Update appraisal status
    appraisal.status = status;
    await appraisal.save();

    return res.status(200).json({
      success: true,
      data: appraisal,
      message: `Appraisal status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating appraisal status:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Helper function to validate workflow transitions
const validateWorkflowTransition = (currentStatus, newStatus, userRole, userId, employeeId) => {
  // Valid status transitions
  const validTransitions = {
    'pending': ['self-review'],
    'self-review': ['pm-review'],
    'pm-review': ['hr-review'],
    'hr-review': ['completed']
  };

  // Check if transition is valid for the current status
  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    // Allow admin to make any transition
    if (userRole === 'admin') {
      return true;
    }
    return false;
  }

  // Role-based permissions for transitions
  switch (currentStatus) {
    case 'pending':
      // Only the employee can submit self-review (or is the employee that owns the appraisal)
      return userId.toString() === employeeId.toString() && newStatus === 'self-review';
    
    case 'self-review':
      // Only managers can move to PM review
      return (userRole === 'manager' || userRole === 'admin') && newStatus === 'pm-review';
    
    case 'pm-review':
      // Only HR can move to HR review
      return (userRole === 'hr' || userRole === 'admin') && newStatus === 'hr-review';
    
    case 'hr-review':
      // Only HR can complete the appraisal
      return (userRole === 'hr' || userRole === 'admin') && newStatus === 'completed';
    
    default:
      return false;
  }
};

// @desc    Submit self review
// @route   POST /api/appraisals/:id/self-review
// @access  Private (Employee only)
export const submitSelfReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { strengths, improvements, achievements, challenges, selfRating } = req.body;
    const userId = req.user._id;

    // Get the appraisal
    const appraisal = await Appraisal.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        error: 'Appraisal not found'
      });
    }

    // Check if this is the employee's appraisal
    if (appraisal.employee.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only submit self-review for your own appraisal'
      });
    }

    // Check if appraisal is in the correct status
    if (appraisal.status !== 'pending' && appraisal.status !== 'self-review') {
      return res.status(400).json({
        success: false,
        error: 'Appraisal must be in pending or self-review status to submit self-review'
      });
    }

    // Create or update review
    let review = await Review.findOne({ 
      appraisalId: id,
      employeeId: userId
    });

    if (review) {
      // Update existing review
      review.strengths = strengths;
      review.improvements = improvements;
      review.achievements = achievements;
      review.challenges = challenges;
      review.selfRating = selfRating;
    } else {
      // Create new review
      review = new Review({
        appraisalId: id,
        employeeId: userId,
        strengths,
        improvements,
        achievements,
        challenges,
        selfRating
      });
    }

    await review.save();

    // Update appraisal status to self-review
    appraisal.status = 'self-review';
    await appraisal.save();

    return res.status(200).json({
      success: true,
      data: review,
      message: 'Self-review submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting self-review:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Submit manager review
// @route   POST /api/appraisals/:id/manager-review
// @access  Private (Manager only)
export const submitManagerReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { managerComments, managerRating } = req.body;
    const managerId = req.user._id;

    // Check if user is a manager
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only managers can submit manager reviews'
      });
    }

    // Get the appraisal
    const appraisal = await Appraisal.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        error: 'Appraisal not found'
      });
    }

    // Check if appraisal is in the correct status
    if (appraisal.status !== 'self-review' && appraisal.status !== 'pm-review') {
      return res.status(400).json({
        success: false,
        error: 'Appraisal must be in self-review or pm-review status for manager review'
      });
    }

    // Get the employee's review
    let review = await Review.findOne({ 
      appraisalId: id,
      employeeId: appraisal.employee
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Employee self-review not found'
      });
    }

    // Update review with manager feedback
    review.managerComments = managerComments;
    review.managerRating = managerRating;
    await review.save();

    // Update appraisal status to pm-review
    appraisal.status = 'pm-review';
    await appraisal.save();

    return res.status(200).json({
      success: true,
      data: review,
      message: 'Manager review submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting manager review:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Finalize appraisal
// @route   POST /api/appraisals/:id/finalize
// @access  Private (HR only)
export const finalizeAppraisal = async (req, res) => {
  try {
    const { id } = req.params;
    const { overallRating, comments } = req.body;

    // Check if user is HR
    if (req.user.role !== 'hr' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only HR can finalize appraisals'
      });
    }

    // Get the appraisal
    const appraisal = await Appraisal.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        error: 'Appraisal not found'
      });
    }

    // Check if appraisal is in the correct status
    if (appraisal.status !== 'pm-review' && appraisal.status !== 'hr-review') {
      return res.status(400).json({
        success: false,
        error: 'Appraisal must be in pm-review or hr-review status to finalize'
      });
    }

    // Update appraisal with final rating
    appraisal.overallRating = overallRating;
    appraisal.status = 'completed';
    await appraisal.save();

    return res.status(200).json({
      success: true,
      data: appraisal,
      message: 'Appraisal finalized successfully'
    });
  } catch (error) {
    console.error('Error finalizing appraisal:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 