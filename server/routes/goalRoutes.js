import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Goal from '../models/Goal.js';
import { 
  getGoals, 
  getAppraisalGoals, 
  getEmployeeGoals,
  createGoal, 
  updateGoal, 
  deleteGoal 
} from '../controllers/goalController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// @route   GET /api/goals
// @desc    Get all goals
// @access  Private
router.get('/', getGoals);

// @route   GET /api/goals/appraisal/:appraisalId
// @desc    Get goals by appraisal ID
// @access  Private
router.get('/appraisal/:appraisalId', getAppraisalGoals);

// @route   GET /api/goals/employee/:employeeId
// @desc    Get goals by employee ID
// @access  Private
router.get('/employee/:employeeId', getEmployeeGoals);

// @route   POST /api/goals
// @desc    Create new goal
// @access  Private
router.post('/', createGoal);

// @route   GET /api/goals/:id
// @desc    Get goal by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id)
      .populate('employeeId', 'name email')
      .populate('appraisalId', 'appraisalCycle');
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: 'Goal not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update goal
// @access  Private
router.put('/:id', updateGoal);

// @route   DELETE /api/goals/:id
// @desc    Delete goal
// @access  Private (HR, Admin)
router.delete('/:id', authorize(['hr', 'admin']), deleteGoal);

export default router; 