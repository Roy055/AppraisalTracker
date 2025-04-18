import mongoose from 'mongoose';

const appraisalSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appraisalCycle: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['pending', 'self-review', 'pm-review', 'hr-review', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.model('Appraisal', appraisalSchema); 