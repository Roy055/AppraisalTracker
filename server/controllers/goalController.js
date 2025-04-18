import Goal from '../models/Goal.js';
import Appraisal from '../models/Appraisal.js';
import User from '../models/User.js';

// @desc    Get all goals
// @route   GET /api/goals
// @access  Private
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find()
      .populate('appraisalId', 'appraisalCycle status')
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// @desc    Get goals by appraisal
// @route   GET /api/goals/appraisal/:appraisalId
// @access  Private
export const getAppraisalGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ appraisalId: req.params.appraisalId })
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching appraisal goals:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// @desc    Get goals for specific employee
// @route   GET /api/goals/employee/:employeeId
// @access  Private
export const getEmployeeGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ employeeId: req.params.employeeId })
      .populate('appraisalId', 'appraisalCycle status')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching employee goals:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// @desc    Create goal
// @route   POST /api/goals
// @access  Private (Admin/HR/Manager/Employee)
export const createGoal = async (req, res) => {
  try {
    const { appraisalId, employeeId, goalName, goalDescription, startDate, endDate, progress, status } = req.body;

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        error: 'Employee not found' 
      });
    }

    // If appraisalId is provided, check if appraisal exists
    if (appraisalId) {
      const appraisal = await Appraisal.findById(appraisalId);
      if (!appraisal) {
        return res.status(404).json({ 
          success: false,
          error: 'Appraisal not found' 
        });
      }
    }

    // Check if the user has permission to create goal for this employee
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && 
        req.user.role !== 'manager' && req.user.id !== employeeId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create goals for this employee'
      });
    }

    // Create goal
    const goal = await Goal.create({
      appraisalId: appraisalId || null,
      employeeId,
      goalName,
      goalDescription,
      startDate,
      endDate,
      progress: progress || 0,
      status: status || 'pending'
    });

    await goal.populate('employeeId', 'name');
    if (appraisalId) {
      await goal.populate('appraisalId', 'appraisalCycle');
    }

    res.status(201).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private (Admin/HR/Manager/Owner)
export const updateGoal = async (req, res) => {
  try {
    const goalId = req.params.id;

    // Check if goal exists
    let goal = await Goal.findById(goalId);
    if (!goal) {
      return res.status(404).json({ 
        success: false,
        error: 'Goal not found' 
      });
    }

    // Check if user has permission to update goal
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && 
        req.user.role !== 'manager' && req.user.id !== goal.employeeId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this goal'
      });
    }

    // Update goal with provided fields
    const fields = req.body;
    
    // If employee is trying to update, only allow progress and status updates
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.role !== 'manager') {
      const allowedFields = ['progress', 'status'];
      Object.keys(fields).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete fields[key];
        }
      });
    }

    goal = await Goal.findByIdAndUpdate(
      goalId,
      fields,
      { new: true, runValidators: true }
    );

    await goal.populate('employeeId', 'name');
    if (goal.appraisalId) {
      await goal.populate('appraisalId', 'appraisalCycle');
    }

    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private (Admin/HR)
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ 
        success: false,
        error: 'Goal not found' 
      });
    }

    // Only admin and HR can delete goals
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete goals'
      });
    }

    await Goal.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
}; 