import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const FinalReviewSection = ({ appraisal, onStatusChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    overallRating: 0,
    comments: '',
    status: ''
  });

  useEffect(() => {
    if (appraisal) {
      setFormData({
        overallRating: appraisal.overallRating || 0,
        comments: '',
        status: appraisal.status
      });
    }
  }, [appraisal]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingChange = (event, newValue) => {
    setFormData({
      ...formData,
      overallRating: newValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSubmitting(true);
    setSuccess(false);
    setError('');
    
    try {
      const response = await axios.post(
        `/api/appraisals/${appraisal._id}/finalize`, 
        {
          overallRating: formData.overallRating,
          comments: formData.comments
        }
      );
      
      if (response.data && response.data.success) {
        setSuccess(true);
        
        // Update parent component if callback exists
        if (onStatusChange) {
          onStatusChange('completed');
        }
      } else {
        setError('Failed to finalize appraisal');
      }
    } catch (error) {
      console.error('Error finalizing appraisal:', error);
      setError(error.response?.data?.error || 'An error occurred while finalizing the appraisal');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine if user can finalize the appraisal
  const canFinalize = () => {
    if (!user || !appraisal) return false;
    
    // Only HR and Admin can finalize
    if (user.role !== 'admin' && user.role !== 'hr') return false;
    
    // Can only finalize in hr-review or pm-review stages
    return ['hr-review', 'pm-review'].includes(appraisal.status);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Final Review</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // Only HR and admins can see this section
  if (user?.role !== 'admin' && user?.role !== 'hr') {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Final Review</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Appraisal finalized successfully!</Alert>}
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography component="legend">Overall Rating</Typography>
          <Rating
            name="overallRating"
            value={formData.overallRating}
            onChange={handleRatingChange}
            max={5}
            precision={0.5}
            size="large"
            disabled={!canFinalize()}
          />
        </Box>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Appraisal Status</InputLabel>
          <Select
            name="status"
            value={formData.status}
            onChange={handleChange}
            label="Appraisal Status"
            disabled={!canFinalize()}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="self-review">Self Review</MenuItem>
            <MenuItem value="pm-review">PM Review</MenuItem>
            <MenuItem value="hr-review">HR Review</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          margin="dense"
          name="comments"
          label="Final Comments"
          fullWidth
          multiline
          rows={4}
          value={formData.comments}
          onChange={handleChange}
          disabled={!canFinalize()}
          sx={{ mb: 2 }}
        />
        
        {canFinalize() && (
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={submitting || formData.overallRating === 0}
            sx={{ mt: 2 }}
          >
            {submitting ? 'Submitting...' : 'Finalize Appraisal'}
          </Button>
        )}
      </form>
    </Paper>
  );
};

export default FinalReviewSection; 