import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appraisalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appraisal'
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['positive', 'constructive', 'general'],
    default: 'general'
  }
}, {
  timestamps: true
});

export default mongoose.model('Feedback', feedbackSchema); 