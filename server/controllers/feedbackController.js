const Feedback = require('../models/Feedback');
const Appraisal = require('../models/Appraisal');
const User = require('../models/User');

// @desc    Get all feedbacks
// @route   GET /api/feedbacks
// @access  Private
exports.getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('appraisalId', 'appraisalCycle status')
      .populate('employeeId', 'name email')
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get feedbacks by appraisal
// @route   GET /api/feedbacks/appraisal/:appraisalId
// @access  Private
exports.getAppraisalFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ appraisalId: req.params.appraisalId })
      .populate('employeeId', 'name email')
      .populate('managerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create feedback
// @route   POST /api/feedbacks
// @access  Private (Admin/HR/PM)
exports.createFeedback = async (req, res) => {
  try {
    const { appraisalId, employeeId, managerId, feedbackText, type } = req.body;

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

    // Check if manager exists
    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    // Create feedback
    const feedback = new Feedback({
      appraisalId,
      employeeId,
      managerId,
      feedbackText,
      type
    });

    await feedback.save();

    res.status(201).json({
      message: 'Feedback created successfully',
      feedback
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update feedback
// @route   PUT /api/feedbacks/:id
// @access  Private (Admin/HR/PM)
exports.updateFeedback = async (req, res) => {
  try {
    const { feedbackText } = req.body;
    const feedbackId = req.params.id;

    // Check if feedback exists
    let feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Update feedback
    feedback.feedbackText = feedbackText || feedback.feedbackText;

    await feedback.save();

    res.json({
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedbacks/:id
// @access  Private (Admin)
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    await feedback.remove();
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 