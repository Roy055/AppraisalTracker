import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import TrainingRecommendation from '../models/TrainingRecommendation.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// @route   GET /api/training
// @desc    Get all training recommendations
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // If user is not admin or HR, only show their own training
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      if (req.user.role === 'manager') {
        // Managers can see training for their team (simplified for now)
      } else {
        // Regular employees only see their own training
        query.employeeId = req.user.id;
      }
    }
    
    const trainings = await TrainingRecommendation.find(query)
      .populate('employeeId', 'name')
      .populate('recommendedBy', 'name')
      .sort({ createdAt: -1 });
      
    res.status(200).json({
      success: true,
      data: trainings
    });
  } catch (error) {
    console.error('Get trainings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// @route   POST /api/training
// @desc    Create new training recommendation
// @access  Private (HR, Manager)
router.post('/', authorize(['hr', 'manager', 'admin']), async (req, res) => {
  try {
    // Add the current user as the recommender
    const trainingData = {
      ...req.body,
      recommendedBy: req.user.id
    };
    
    const training = await TrainingRecommendation.create(trainingData);
    res.status(201).json({
      success: true,
      data: training
    });
  } catch (error) {
    console.error('Create training error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error'
    });
  }
});

// @route   GET /api/training/:id
// @desc    Get training recommendation by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const training = await TrainingRecommendation.findById(req.params.id);
    
    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: training
    });
  } catch (error) {
    console.error('Get training error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/training/:id/status
// @desc    Update training status by employee
// @access  Private (Employees only)
router.put('/:id/status', async (req, res) => {
  try {
    // Get the training
    const training = await TrainingRecommendation.findById(req.params.id);
    
    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found'
      });
    }
    
    // Check if this training belongs to the current user
    if (training.employeeId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this training'
      });
    }
    
    // Only allow status update
    if (!req.body.status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    // Only allow specific status transitions
    // Employees can only mark trainings as 'completed'
    if (req.body.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Employees can only mark trainings as completed'
      });
    }
    
    // Update only the status field
    training.status = req.body.status;
    await training.save();
    
    res.status(200).json({
      success: true,
      data: training
    });
  } catch (error) {
    console.error('Update training status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/training/:id
// @desc    Update training recommendation
// @access  Private (HR, Manager)
router.put('/:id', authorize(['hr', 'manager', 'admin']), async (req, res) => {
  try {
    const training = await TrainingRecommendation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: training
    });
  } catch (error) {
    console.error('Update training error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/training/:id
// @desc    Delete training recommendation
// @access  Private (HR, Manager)
router.delete('/:id', authorize(['hr', 'manager', 'admin']), async (req, res) => {
  try {
    const training = await TrainingRecommendation.findByIdAndDelete(req.params.id);
    
    if (!training) {
      return res.status(404).json({
        success: false,
        error: 'Training not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete training error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router; 