import User from '../models/User.js';
import Appraisal from '../models/Appraisal.js';
import TrainingRecommendation from '../models/TrainingRecommendation.js';
import Department from '../models/Department.js';
import Goal from '../models/Goal.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const { role, department, _id } = req.user;
    
    // Fetch base data
    const [users, appraisals, trainings, departments, goals] = await Promise.all([
      User.find().select('-password'),
      Appraisal.find(),
      TrainingRecommendation.find(),
      Department.find(),
      Goal.find()
    ]);
    
    // Base statistics common to all roles
    const stats = {
      totalUsers: users.length,
      totalAppraisals: appraisals.length,
      totalTrainings: trainings.length,
      activeTrainings: trainings.filter(t => t.status !== 'completed').length,
      completedAppraisals: appraisals.filter(a => a.status === 'completed').length,
      pendingAppraisals: appraisals.filter(a => a.status !== 'completed').length,
      totalDepartments: departments.length,
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      inProgressGoals: goals.filter(g => g.status === 'in-progress').length
    };
    
    // Role-specific statistics
    if (role === 'admin' || role === 'hr') {
      // Admin and HR see all statistics
      return res.status(200).json({
        success: true,
        data: {
          ...stats,
          departments,
          recentAppraisals: appraisals.slice(0, 5) // Return 5 most recent appraisals
        }
      });
    } 
    
    if (role === 'manager') {
      // Managers see department-specific statistics
      const departmentUsers = users.filter(user => user.department?.toString() === department?.toString());
      const departmentAppraisals = appraisals.filter(
        appraisal => departmentUsers.some(user => user._id.toString() === appraisal.employee?.toString())
      );
      const departmentTrainings = trainings.filter(
        training => departmentUsers.some(user => user._id.toString() === training.employeeId?.toString())
      );
      const departmentGoals = goals.filter(
        goal => departmentUsers.some(user => user._id.toString() === goal.employeeId?.toString())
      );
      
      return res.status(200).json({
        success: true,
        data: {
          teamMembers: departmentUsers.length,
          pendingAppraisals: departmentAppraisals.filter(a => a.status !== 'completed').length,
          completedAppraisals: departmentAppraisals.filter(a => a.status === 'completed').length,
          activeTrainings: departmentTrainings.filter(t => t.status !== 'completed').length,
          totalGoals: departmentGoals.length,
          completedGoals: departmentGoals.filter(g => g.status === 'completed').length,
          department: departments.find(d => d._id.toString() === department?.toString())
        }
      });
    }
    
    // Employee statistics
    const employeeAppraisals = appraisals.filter(appraisal => 
      appraisal.employee?.toString() === _id.toString()
    );
    const employeeTrainings = trainings.filter(training => 
      training.employeeId?.toString() === _id.toString()
    );
    const employeeGoals = goals.filter(goal => 
      goal.employeeId?.toString() === _id.toString()
    );
    
    return res.status(200).json({
      success: true,
      data: {
        myAppraisals: employeeAppraisals.length,
        pendingAppraisals: employeeAppraisals.filter(a => a.status !== 'completed').length,
        completedAppraisals: employeeAppraisals.filter(a => a.status === 'completed').length,
        activeTrainings: employeeTrainings.filter(t => t.status !== 'completed').length,
        completedTrainings: employeeTrainings.filter(t => t.status === 'completed').length,
        myGoals: employeeGoals.length,
        completedGoals: employeeGoals.filter(g => g.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 