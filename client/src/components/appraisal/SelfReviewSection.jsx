import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Rating,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SelfReviewSection = ({ appraisal, onStatusChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState(null);
  const [formData, setFormData] = useState({
    strengths: '',
    improvements: '',
    achievements: '',
    challenges: '',
    selfRating: 3,
    appraisalId: '',
    employeeId: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appraisal && appraisal._id) {
      setFormData({
        ...formData,
        appraisalId: appraisal._id,
        employeeId: user?._id || ''
      });
      fetchReview();
    }
  }, [appraisal, user]);

  const fetchReview = async () => {
    if (!appraisal || !appraisal._id || !user?._id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/reviews/appraisal/${appraisal._id}/employee/${appraisal.employee || user?._id}`);
      if (response.data && response.data.data) {
        setReview(response.data.data);
        setFormData({
          strengths: response.data.data.strengths || '',
          improvements: response.data.data.improvements || '',
          achievements: response.data.data.achievements || '',
          challenges: response.data.data.challenges || '',
          selfRating: response.data.data.selfRating || 3,
          appraisalId: appraisal._id,
          employeeId: appraisal.employee || user?._id || ''
        });
      }
    } catch (error) {
      console.error('Error fetching review:', error);
      // If 404, it means no review exists yet, which is fine
      if (error.response && error.response.status !== 404) {
        setError('Failed to load review data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingChange = (event, newValue) => {
    setFormData({
      ...formData,
      selfRating: newValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);
    setSuccess(false);
    setError('');
    
    try {
      const response = await axios.post(
        `/api/appraisals/${appraisal._id}/self-review`, 
        formData
      );
      
      if (response.data && response.data.success) {
        setSuccess(true);
        setReview(response.data.data);
        
        // Update parent component
        if (onStatusChange) {
          onStatusChange('self-review');
        }
      } else {
        setError('Failed to submit self-review');
      }
    } catch (error) {
      console.error('Error submitting self-review:', error);
      setError(error.response?.data?.error || 'An error occurred while submitting your review');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine if user can submit or edit self-review
  const canSubmitReview = () => {
    if (!user || !appraisal) return false;
    
    // Only the employee who owns the appraisal can submit
    const isAppraisalOwner = appraisal.employee?.toString() === user._id?.toString();
    
    // Can submit or edit only in pending or self-review stages
    return isAppraisalOwner && ['pending', 'self-review'].includes(appraisal.status);
  };

  // If in read-only mode (for managers/HR viewing an employee's self-review)
  const isReadOnly = () => {
    if (!user || !appraisal) return true;
    return appraisal.employee?.toString() !== user._id?.toString() || !['pending', 'self-review'].includes(appraisal.status);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Self Review</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Self Review</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Self review submitted successfully!</Alert>}
      
      <form onSubmit={handleSubmit}>
        <TextField
          margin="dense"
          name="achievements"
          label="Key Achievements"
          fullWidth
          multiline
          rows={3}
          value={formData.achievements}
          onChange={handleChange}
          required
          disabled={isReadOnly()}
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          name="strengths"
          label="Strengths"
          fullWidth
          multiline
          rows={3}
          value={formData.strengths}
          onChange={handleChange}
          required
          disabled={isReadOnly()}
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          name="improvements"
          label="Areas for Improvement"
          fullWidth
          multiline
          rows={3}
          value={formData.improvements}
          onChange={handleChange}
          required
          disabled={isReadOnly()}
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          name="challenges"
          label="Challenges Faced"
          fullWidth
          multiline
          rows={3}
          value={formData.challenges}
          onChange={handleChange}
          required
          disabled={isReadOnly()}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography component="legend">Self Rating</Typography>
          <Rating
            name="selfRating"
            value={formData.selfRating}
            onChange={handleRatingChange}
            disabled={isReadOnly()}
            max={5}
            precision={0.5}
            size="large"
          />
        </Box>
        
        {canSubmitReview() && (
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={submitting}
            sx={{ mt: 2 }}
          >
            {submitting ? 'Submitting...' : review ? 'Update Self Review' : 'Submit Self Review'}
          </Button>
        )}
      </form>
    </Paper>
  );
};

export default SelfReviewSection; 