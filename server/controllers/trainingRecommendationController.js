const TrainingRecommendation = require('../models/TrainingRecommendation');
const Appraisal = require('../models/Appraisal');
const User = require('../models/User');

// @desc    Get all training recommendations
// @route   GET /api/training-recommendations
// @access  Private
exports.getTrainingRecommendations = async (req, res) => {
  try {
    const recommendations = await TrainingRecommendation.find()
      .populate('appraisalId', 'appraisalCycle status')
      .populate('employeeId', 'name email')
      .populate('recommendedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get training recommendations by appraisal
// @route   GET /api/training-recommendations/appraisal/:appraisalId
// @access  Private
exports.getAppraisalTrainingRecommendations = async (req, res) => {
  try {
    const recommendations = await TrainingRecommendation.find({ appraisalId: req.params.appraisalId })
      .populate('employeeId', 'name email')
      .populate('recommendedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create training recommendation
// @route   POST /api/training-recommendations
// @access  Private (Admin/HR/PM)
exports.createTrainingRecommendation = async (req, res) => {
  try {
    const { 
      appraisalId, 
      employeeId, 
      trainingName, 
      trainingDescription, 
      recommendedBy 
    } = req.body;

    // Check if appraisal exists
    const appraisal = await Appraisal.findById(appraisalId);
    if (!appraisal) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if recommender exists
    const recommender = await User.findById(recommendedBy);
    if (!recommender) {
      return res.status(404).json({ message: 'Recommender not found' });
    }

    // Create training recommendation
    const recommendation = new TrainingRecommendation({
      appraisalId,
      employeeId,
      trainingName,
      trainingDescription,
      recommendedBy,
      status: 'pending'
    });

    await recommendation.save();

    res.status(201).json({
      message: 'Training recommendation created successfully',
      recommendation
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update training recommendation
// @route   PUT /api/training-recommendations/:id
// @access  Private (Admin/HR/PM)
exports.updateTrainingRecommendation = async (req, res) => {
  try {
    const { status } = req.body;
    const recommendationId = req.params.id;

    // Check if recommendation exists
    let recommendation = await TrainingRecommendation.findById(recommendationId);
    if (!recommendation) {
      return res.status(404).json({ message: 'Training recommendation not found' });
    }

    // Update recommendation
    recommendation.status = status || recommendation.status;

    await recommendation.save();

    res.json({
      message: 'Training recommendation updated successfully',
      recommendation
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete training recommendation
// @route   DELETE /api/training-recommendations/:id
// @access  Private (Admin)
exports.deleteTrainingRecommendation = async (req, res) => {
  try {
    const recommendation = await TrainingRecommendation.findById(req.params.id);
    if (!recommendation) {
      return res.status(404).json({ message: 'Training recommendation not found' });
    }

    await recommendation.remove();
    res.json({ message: 'Training recommendation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 