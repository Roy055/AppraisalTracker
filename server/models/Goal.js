import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  appraisalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appraisal',
    required: false
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goalName: {
    type: String,
    required: true,
    trim: true
  },
  goalDescription: {
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
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.model('Goal', goalSchema); 