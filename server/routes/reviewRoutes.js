import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getReviews,
  getReview,
  getReviewByAppraisalAndEmployee,
  createReview,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (still protected with JWT)
router.get('/appraisal/:appraisalId/employee/:employeeId', getReviewByAppraisalAndEmployee);
router.get('/:id', getReview);
router.post('/', createReview);
router.put('/:id', updateReview);

// Admin/HR/Manager only routes
router.get('/', authorize(['admin', 'hr', 'manager']), getReviews);

// Admin only routes
router.delete('/:id', authorize(['admin']), deleteReview);

export default router; 