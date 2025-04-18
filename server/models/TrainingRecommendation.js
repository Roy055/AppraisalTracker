import mongoose from 'mongoose';

const trainingRecommendationSchema = new mongoose.Schema({
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
  trainingName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'rejected'],
    default: 'pending'
  },
  recommendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('TrainingRecommendation', trainingRecommendationSchema); 