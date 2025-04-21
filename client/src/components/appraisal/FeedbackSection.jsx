import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Rating,
  Alert
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const FeedbackSection = ({ appraisal, onStatusChange }) => {
  const { user } = useAuth();
  const [review, setReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [managerReviewData, setManagerReviewData] = useState({
    managerComments: '',
    managerRating: 0
  });

  useEffect(() => {
    if (appraisal && appraisal._id) {
      fetchReview();
    }
  }, [appraisal]);

  const fetchReview = async () => {
    if (!appraisal || !appraisal._id || !appraisal.employee) return;
    
    try {
      const response = await axios.get(`/api/reviews/appraisal/${appraisal._id}/employee/${appraisal.employee}`);
      if (response.data && response.data.success) {
        setReview(response.data.data);
        
        if (response.data.data.managerComments) {
          setManagerReviewData({
            managerComments: response.data.data.managerComments,
            managerRating: response.data.data.managerRating || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching review:', error);
    }
  };

  const handleManagerReviewChange = (e) => {
    setManagerReviewData({
      ...managerReviewData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingChange = (event, newValue) => {
    setManagerReviewData({
      ...managerReviewData,
      managerRating: newValue
    });
  };

  const handleManagerReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!review) return;
    
    setSubmitting(true);
    setSuccess(false);
    setError('');
    
    try {
      const response = await axios.post(
        `/api/appraisals/${appraisal._id}/manager-review`, 
        managerReviewData
      );
      
      if (response.data && response.data.success) {
        setSuccess(true);
        setReview(response.data.data);
        
        if (onStatusChange) {
          onStatusChange('pm-review');
        }
      } else {
        setError('Failed to submit manager review');
      }
    } catch (error) {
      console.error('Error submitting manager review:', error);
      setError(error.response?.data?.error || 'An error occurred while submitting your review');
    } finally {
      setSubmitting(false);
    }
  };

  const canProvideManagerReview = () => {
    if (!user || !appraisal) return false;
    
    const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';
    return isManagerOrAdmin && ['self-review', 'pm-review'].includes(appraisal.status);
  };

  const canViewManagerReview = () => {
    if (!appraisal) return false;
    return ['self-review', 'pm-review', 'hr-review', 'completed'].includes(appraisal.status);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Manager Review</Typography>
      
      {canViewManagerReview() && review ? (
        <Box sx={{ mb: 4 }}>
          <>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Manager Assessment</Typography>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>Manager review submitted successfully!</Alert>}
            
            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography component="legend">Manager Rating</Typography>
              <Rating
                name="managerRating"
                value={managerReviewData.managerRating}
                onChange={handleRatingChange}
                precision={0.5}
                size="large"
                readOnly={!canProvideManagerReview()}
              />
            </Box>
            
            <TextField
              margin="dense"
              name="managerComments"
              label="Manager Comments"
              fullWidth
              multiline
              rows={4}
              value={managerReviewData.managerComments}
              onChange={handleManagerReviewChange}
              sx={{ 
                mb: 2,
                '& .MuiInputBase-root': {
                  backgroundColor: !canProvideManagerReview() ? 'rgba(0, 0, 0, 0.06)' : 'transparent'
                }
              }}
              disabled={!canProvideManagerReview()}
            />
            
            {canProvideManagerReview() && (
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={submitting || managerReviewData.managerRating === 0}
                startIcon={<StarIcon />}
                sx={{ mt: 1 }}
                onClick={handleManagerReviewSubmit}
              >
                {submitting ? 'Submitting...' : 'Submit Manager Review'}
              </Button>
            )}
          </>
        </Box>
      ) : (
        <Typography>
          {appraisal && appraisal.status === 'self-review' && !review 
            ? "Loading employee's self-review data..." 
            : appraisal && appraisal.status === 'pending'
              ? "Manager review will be available after self-review is completed."
              : "No self-review data available yet."}
        </Typography>
      )}
    </Paper>
  );
};

export default FeedbackSection;