import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
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
  strengths: {
    type: String,
    required: true,
    trim: true
  },
  improvements: {
    type: String,
    required: true,
    trim: true
  },
  achievements: {
    type: String,
    required: true,
    trim: true
  },
  challenges: {
    type: String,
    required: true,
    trim: true
  },
  selfRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  // Manager can add comments to the review
  managerComments: {
    type: String,
    trim: true
  },
  managerRating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

export default mongoose.model('Review', reviewSchema); 