const Appraisal = require('../models/Appraisal');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Feedback = require('../models/Feedback');
const PerformanceReview = require('../models/PerformanceReview');

// @desc    Get all appraisals
// @route   GET /api/appraisals
// @access  Private
exports.getAppraisals = async (req, res) => {
  try {
    const appraisals = await Appraisal.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(appraisals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get appraisal by ID
// @route   GET /api/appraisals/:id
// @access  Private
exports.getAppraisal = async (req, res) => {
  try {
    const appraisal = await Appraisal.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate({
        path: 'goals',
        populate: {
          path: 'employeeId',
          select: 'name email'
        }
      })
      .populate({
        path: 'feedbacks',
        populate: [
          { path: 'employeeId', select: 'name email' },
          { path: 'managerId', select: 'name email' }
        ]
      })
      .populate({
        path: 'performanceReviews',
        populate: [
          { path: 'employeeId', select: 'name email' },
          { path: 'reviewerId', select: 'name email' }
        ]
      });

    if (!appraisal) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }

    res.json(appraisal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create appraisal
// @route   POST /api/appraisals
// @access  Private (Admin/HR/PM)
exports.createAppraisal = async (req, res) => {
  try {
    const { userId, appraisalCycle, startDate, endDate } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create appraisal
    const appraisal = new Appraisal({
      userId,
      appraisalCycle,
      startDate,
      endDate,
      status: 'pending'
    });

    await appraisal.save();

    res.status(201).json({
      message: 'Appraisal created successfully',
      appraisal
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update appraisal
// @route   PUT /api/appraisals/:id
// @access  Private (Admin/HR/PM)
exports.updateAppraisal = async (req, res) => {
  try {
    const { status, overallRating } = req.body;
    const appraisalId = req.params.id;

    // Check if appraisal exists
    let appraisal = await Appraisal.findById(appraisalId);
    if (!appraisal) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }

    // Update appraisal
    appraisal.status = status || appraisal.status;
    appraisal.overallRating = overallRating || appraisal.overallRating;

    await appraisal.save();

    res.json({
      message: 'Appraisal updated successfully',
      appraisal
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete appraisal
// @route   DELETE /api/appraisals/:id
// @access  Private (Admin)
exports.deleteAppraisal = async (req, res) => {
  try {
    const appraisal = await Appraisal.findById(req.params.id);
    if (!appraisal) {
      return res.status(404).json({ message: 'Appraisal not found' });
    }

    // Delete related goals, feedbacks, and performance reviews
    await Goal.deleteMany({ appraisalId: appraisal._id });
    await Feedback.deleteMany({ appraisalId: appraisal._id });
    await PerformanceReview.deleteMany({ appraisalId: appraisal._id });

    await appraisal.remove();
    res.json({ message: 'Appraisal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get appraisals by user
// @route   GET /api/appraisals/user/:userId
// @access  Private
exports.getUserAppraisals = async (req, res) => {
  try {
    const appraisals = await Appraisal.find({ userId: req.params.userId })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(appraisals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 