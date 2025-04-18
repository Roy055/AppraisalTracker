const express = require('express');
const router = express.Router();
const { 
  getTrainingRecommendations, 
  getAppraisalTrainingRecommendations, 
  createTrainingRecommendation, 
  updateTrainingRecommendation, 
  deleteTrainingRecommendation 
} = require('../controllers/trainingRecommendationController');
const { auth, authorize } = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Get all training recommendations
router.get('/', getTrainingRecommendations);

// Get training recommendations by appraisal
router.get('/appraisal/:appraisalId', getAppraisalTrainingRecommendations);

// Create training recommendation (Admin/HR/PM only)
router.post('/', authorize([1, 2, 4]), createTrainingRecommendation);

// Update training recommendation (Admin/HR/PM only)
router.put('/:id', authorize([1, 2, 4]), updateTrainingRecommendation);

// Delete training recommendation (Admin only)
router.delete('/:id', authorize([1]), deleteTrainingRecommendation);

module.exports = router;