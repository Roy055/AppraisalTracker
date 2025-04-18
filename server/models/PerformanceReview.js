import mongoose from 'mongoose';

const performanceReviewSchema = new mongoose.Schema({
  appraisalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appraisal',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewDate: {
    type: Date,
    default: Date.now
  },
  strengths: {
    type: [String],
    required: true
  },
  improvementAreas: {
    type: [String],
    required: true
  },
  finalRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comments: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('PerformanceReview', performanceReviewSchema); 