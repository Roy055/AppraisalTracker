import Appraisal from '../models/Appraisal.js';
import Review from '../models/Review.js';
import User from '../models/User.js';

// @desc    Test the appraisal workflow by checking user permissions and model fields
// @route   GET /api/appraisals/test/:id
// @access  Private
export const testAppraisalWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    
    // Fetch the appraisal with all details
    const appraisal = await Appraisal.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        error: 'Appraisal not found'
      });
    }
    
    // Get reviews if any
    const review = await Review.findOne({ 
      appraisalId: id,
      employeeId: appraisal.employee
    });
    
    // Fetch the employee's details
    const employee = await User.findById(appraisal.employee).select('-password');
    
    // Check permission status
    const isOwner = appraisal.employee.toString() === userId.toString();
    const isManager = userRole === 'manager';
    const isHR = userRole === 'hr';
    const isAdmin = userRole === 'admin';
    
    // Get next possible status
    const currentStatus = appraisal.status;
    const nextStatus = getNextStatus(currentStatus);
    
    // Check if user can transition to next status
    const canTransition = checkTransitionPermission(currentStatus, nextStatus, userRole, userId, appraisal.employee);
    
    // Prepare test data
    const testData = {
      appraisal: {
        _id: appraisal._id,
        employee: appraisal.employee,
        status: appraisal.status,
        nextStatus: nextStatus,
      },
      employee: employee ? {
        _id: employee._id,
        name: employee.name,
        role: employee.role
      } : null,
      user: {
        _id: userId,
        role: userRole,
        isOwner,
        isManager,
        isHR,
        isAdmin
      },
      permissions: {
        canTransition,
        reason: canTransition ? 'User can transition to next status' : getReasonForNoTransition(currentStatus, userRole, isOwner)
      },
      review: review ? {
        _id: review._id,
        hasManagerReview: !!review.managerComments,
        hasSelfReview: !!(review.strengths || review.improvements)
      } : null
    };
    
    return res.status(200).json({
      success: true,
      data: testData
    });
  } catch (error) {
    console.error('Error in test appraisal workflow:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Helper function to get next status
const getNextStatus = (currentStatus) => {
  const statusFlow = {
    'pending': 'self-review',
    'self-review': 'pm-review',
    'pm-review': 'hr-review',
    'hr-review': 'completed'
  };
  
  return statusFlow[currentStatus] || currentStatus;
};

// Helper function to check transition permission
const checkTransitionPermission = (currentStatus, nextStatus, userRole, userId, employeeId) => {
  // Valid status transitions
  const validTransitions = {
    'pending': ['self-review'],
    'self-review': ['pm-review'],
    'pm-review': ['hr-review'],
    'hr-review': ['completed']
  };

  // Allow admin to make any transition
  if (userRole === 'admin') {
    return true;
  }

  // Check if transition is valid for the current status
  if (!validTransitions[currentStatus]?.includes(nextStatus)) {
    return false;
  }

  // Role-based permissions for transitions
  switch (currentStatus) {
    case 'pending':
      // Only the employee can submit self-review
      return userId.toString() === employeeId.toString();
    
    case 'self-review':
      // Only managers can move to PM review
      return userRole === 'manager';
    
    case 'pm-review':
      // Only HR can move to HR review
      return userRole === 'hr';
    
    case 'hr-review':
      // Only HR can complete the appraisal
      return userRole === 'hr';
    
    default:
      return false;
  }
};

// Get reason for why a user can't transition
const getReasonForNoTransition = (currentStatus, userRole, isOwner) => {
  switch (currentStatus) {
    case 'pending':
      return isOwner ? 'Employee can submit self-review' : 'Only the employee can submit self-review';
    
    case 'self-review':
      return userRole === 'manager' ? 'Manager can review' : 'Only managers can provide PM review';
    
    case 'pm-review':
      return userRole === 'hr' ? 'HR can review' : 'Only HR can approve and finalize';
    
    case 'hr-review':
      return userRole === 'hr' ? 'HR can complete' : 'Only HR can complete the appraisal';
    
    case 'completed':
      return 'Appraisal is already completed';
    
    default:
      return 'Unknown status';
  }
}; 