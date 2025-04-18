const PerformanceReview = require('../models/PerformanceReview');
const Appraisal = require('../models/Appraisal');
const User = require('../models/User');

// @desc    Get all performance reviews
// @route   GET /api/performance-reviews
// @access  Private
exports.getPerformanceReviews = async (req, res) => {
  try {
    const reviews = await PerformanceReview.find()
      .populate('appraisalId', 'appraisalCycle status')
      .populate('employeeId', 'name email')
      .populate('reviewerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get performance reviews by appraisal
// @route   GET /api/performance-reviews/appraisal/:appraisalId
// @access  Private
exports.getAppraisalPerformanceReviews = async (req, res) => {
  try {
    const reviews = await PerformanceReview.find({ appraisalId: req.params.appraisalId })
      .populate('employeeId', 'name email')
      .populate('reviewerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create performance review
// @route   POST /api/performance-reviews
// @access  Private (Admin/HR/PM)
exports.createPerformanceReview = async (req, res) => {
  try {
    const { 
      appraisalId, 
      employeeId, 
      reviewerId, 
      strengths, 
      improvementAreas, 
      finalRating, 
      comments 
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

    // Check if reviewer exists
    const reviewer = await User.findById(reviewerId);
    if (!reviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }

    // Create performance review
    const review = new PerformanceReview({
      appraisalId,
      employeeId,
      reviewerId,
      strengths,
      improvementAreas,
      finalRating,
      comments
    });

    await review.save();

    res.status(201).json({
      message: 'Performance review created successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update performance review
// @route   PUT /api/performance-reviews/:id
// @access  Private (Admin/HR/PM)
exports.updatePerformanceReview = async (req, res) => {
  try {
    const { 
      strengths, 
      improvementAreas, 
      finalRating, 
      comments 
    } = req.body;
    const reviewId = req.params.id;

    // Check if review exists
    let review = await PerformanceReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Performance review not found' });
    }

    // Update review
    review.strengths = strengths || review.strengths;
    review.improvementAreas = improvementAreas || review.improvementAreas;
    review.finalRating = finalRating || review.finalRating;
    review.comments = comments || review.comments;

    await review.save();

    res.json({
      message: 'Performance review updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete performance review
// @route   DELETE /api/performance-reviews/:id
// @access  Private (Admin)
exports.deletePerformanceReview = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Performance review not found' });
    }

    await review.remove();
    res.json({ message: 'Performance review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 