import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const GoalsSection = ({ appraisal, onGoalsChange }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    appraisalId: '',
    employeeId: '',
    goalName: '',
    goalDescription: '',
    startDate: '',
    endDate: '',
    progress: 0
  });

  // Status configuration
  const statusColors = {
    'pending': 'default',
    'in-progress': 'primary',
    'completed': 'success',
    'cancelled': 'error'
  };

  useEffect(() => {
    if (appraisal && appraisal._id) {
      fetchGoals();
      
      // Pre-fill form data
      setFormData({
        ...formData,
        appraisalId: appraisal._id,
        employeeId: appraisal.userId,
        startDate: new Date(appraisal.startDate).toISOString().split('T')[0],
        endDate: new Date(appraisal.endDate).toISOString().split('T')[0]
      });
    }
  }, [appraisal]);

  const fetchGoals = async () => {
    if (!appraisal || !appraisal._id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/goals/appraisal/${appraisal._id}`);
      if (response.data) {
        setGoals(Array.isArray(response.data) ? response.data : []);
        
        // Notify parent component if needed
        if (onGoalsChange) {
          onGoalsChange(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setOpen(false);
    // Reset form fields except pre-filled ones
    setFormData({
      ...formData,
      goalName: '',
      goalDescription: '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/goals', formData);
      handleClose();
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleProgressUpdate = async (goalId, newProgress) => {
    try {
      const goal = goals.find(g => g._id === goalId);
      if (!goal) return;
      
      let status = goal.status;
      
      // Update status based on progress
      if (newProgress === 100) {
        status = 'completed';
      } else if (newProgress > 0 && status === 'pending') {
        status = 'in-progress';
      }
      
      await axios.put(`/api/goals/${goalId}`, {
        progress: newProgress,
        status
      });
      
      fetchGoals();
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  // Determine if user can add goals based on role and appraisal status
  const canAddGoals = () => {
    if (!user || !appraisal) return false;
    
    // Admin and HR can always add goals
    if (user.role === 'admin' || user.role === 'hr') return true;
    
    // Manager can add goals in early stages
    if (user.role === 'manager' && ['pending', 'self-review'].includes(appraisal.status)) {
      return true;
    }
    
    // Employee can add goals only if they're the appraisal owner and it's in pending status
    if (appraisal.userId === user._id && appraisal.status === 'pending') {
      return true;
    }
    
    return false;
  };
  
  // Determine if user can update goal progress
  const canUpdateProgress = (goalEmployeeId) => {
    if (!user || !appraisal) return false;
    
    // Admin and HR can always update
    if (user.role === 'admin' || user.role === 'hr') return true;
    
    // Employee can update their own goals before HR review
    if (goalEmployeeId === user._id && ['pending', 'self-review', 'pm-review'].includes(appraisal.status)) {
      return true;
    }
    
    return false;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Goals</Typography>
        {canAddGoals() && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleOpen}
          >
            Add Goal
          </Button>
        )}
      </Box>

      {loading ? (
        <LinearProgress />
      ) : goals.length === 0 ? (
        <Typography sx={{ py: 2 }}>No goals added yet.</Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Goal</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Timeline</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {goals.map((goal) => (
                <TableRow key={goal._id}>
                  <TableCell>{goal.goalName}</TableCell>
                  <TableCell>{goal.goalDescription}</TableCell>
                  <TableCell>
                    {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {canUpdateProgress(goal.employeeId) ? (
                      <TextField
                        type="number"
                        size="small"
                        value={goal.progress}
                        inputProps={{ min: 0, max: 100 }}
                        onChange={(e) => handleProgressUpdate(goal._id, parseInt(e.target.value))}
                        sx={{ width: '80px' }}
                      />
                    ) : (
                      `${goal.progress}%`
                    )}
                    <LinearProgress 
                      variant="determinate" 
                      value={goal.progress} 
                      sx={{ mt: 1, height: 8, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={goal.status} 
                      color={statusColors[goal.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New Goal</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              name="goalName"
              label="Goal Name"
              fullWidth
              value={formData.goalName}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="goalDescription"
              label="Goal Description"
              fullWidth
              multiline
              rows={3}
              value={formData.goalDescription}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                margin="dense"
                name="startDate"
                label="Start Date"
                type="date"
                fullWidth
                value={formData.startDate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                margin="dense"
                name="endDate"
                label="End Date"
                type="date"
                fullWidth
                value={formData.endDate}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
};

export default GoalsSection; 