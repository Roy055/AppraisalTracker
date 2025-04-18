import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import axios from 'axios';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    _id: '',
    appraisalId: '',
    employeeId: '',
    goalName: '',
    goalDescription: '',
    startDate: '',
    endDate: '',
    progress: 0,
    status: 'pending'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const statusColors = {
    'pending': 'default',
    'in-progress': 'primary',
    'completed': 'success',
    'cancelled': 'error'
  };

  useEffect(() => {
    fetchUserRole();
    fetchGoals();
    fetchAppraisals();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await axios.get('/api/users/me');
      if (response.data && response.data.success) {
        setUserRole(response.data.data.role);
        setUserId(response.data.data._id);
        
        // If user is admin or HR, fetch all users (no longer including managers)
        if (['admin', 'hr'].includes(response.data.data.role)) {
          fetchUsers();
        } else {
          // For managers and employees, just set the current user
          setUsers([response.data.data]);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      showSnackbar('Error fetching user information', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      if (response.data && response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Error fetching users', 'error');
    }
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      // For employees, fetch only their goals
      const endpoint = userRole === 'employee' ? `/api/goals/employee/${userId}` : '/api/goals';
      const response = await axios.get(endpoint);
      if (response.data && response.data.success) {
        setGoals(response.data.data || []);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      showSnackbar('Error fetching goals', 'error');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppraisals = async () => {
    try {
      const response = await axios.get('/api/appraisals');
      if (response.data && response.data.success) {
        setAppraisals(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching appraisals:', error);
    }
  };

  const handleOpenForm = (goal = null) => {
    if (goal) {
      // Edit existing goal
      setFormData({
        _id: goal._id,
        appraisalId: goal.appraisalId?._id || goal.appraisalId,
        employeeId: goal.employeeId?._id || goal.employeeId,
        goalName: goal.goalName,
        goalDescription: goal.goalDescription,
        startDate: new Date(goal.startDate).toISOString().split('T')[0],
        endDate: new Date(goal.endDate).toISOString().split('T')[0],
        progress: goal.progress,
        status: goal.status
      });
      setIsEditing(true);
    } else {
      // New goal
      setFormData({
        _id: '',
        appraisalId: '',
        employeeId: userRole === 'employee' ? userId : '',
        goalName: '',
        goalDescription: '',
        startDate: '',
        endDate: '',
        progress: 0,
        status: 'pending'
      });
      setIsEditing(false);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
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
      if (isEditing) {
        // Update goal
        await axios.put(`/api/goals/${formData._id}`, formData);
        showSnackbar('Goal updated successfully');
      } else {
        // Create goal
        await axios.post('/api/goals', formData);
        showSnackbar('Goal created successfully');
      }
      handleCloseForm();
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      showSnackbar(error.response?.data?.error || 'Error saving goal', 'error');
    }
  };

  const handleProgressUpdate = async (id, newValue) => {
    try {
      let status = formData.status;
      
      // Update status based on progress
      if (newValue === 100) {
        status = 'completed';
      } else if (newValue > 0 && status === 'pending') {
        status = 'in-progress';
      }
      
      await axios.put(`/api/goals/${id}`, {
        progress: newValue,
        status
      });
      
      showSnackbar('Progress updated successfully');
      fetchGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      showSnackbar('Error updating progress', 'error');
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      await axios.put(`/api/goals/${id}`, {
        progress: 100,
        status: 'completed'
      });
      
      showSnackbar('Goal marked as completed successfully');
      fetchGoals();
    } catch (error) {
      console.error('Error completing goal:', error);
      showSnackbar('Error completing goal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await axios.delete(`/api/goals/${id}`);
        showSnackbar('Goal deleted successfully');
        fetchGoals();
      } catch (error) {
        console.error('Error deleting goal:', error);
        showSnackbar('Error deleting goal', 'error');
      }
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getEmployeeName = (employeeId) => {
    if (!employeeId) return 'Unknown';
    if (typeof employeeId === 'object' && employeeId.name) {
      return employeeId.name;
    }
    const user = users.find(u => u._id === employeeId);
    return user ? user.name : 'Unknown';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const canAddGoals = () => {
    return ['admin', 'hr'].includes(userRole);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Goals Management</Typography>
        {canAddGoals() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Add Goal
          </Button>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Goals</Typography>
              </Box>
              <Typography variant="h4">{goals.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Completed</Typography>
              </Box>
              <Typography variant="h4">
                {goals.filter(g => g.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon sx={{ mr: 1, color: '#f57c00' }} />
                <Typography variant="h6">In Progress</Typography>
              </Box>
              <Typography variant="h4">
                {goals.filter(g => g.status === 'in-progress').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? (
        <LinearProgress />
      ) : (
        <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader aria-label="goals table">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Goal</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {goals
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((goal) => {
                    const isOwnGoal = goal.employeeId === userId || goal.employeeId?._id === userId;
                    const canEdit = isOwnGoal;
                    const canManageGoal = ['admin', 'hr'].includes(userRole);
                    const isCompleted = goal.status === 'completed';
                    
                    return (
                      <TableRow hover key={goal._id}>
                        <TableCell>{getEmployeeName(goal.employeeId)}</TableCell>
                        <TableCell>{goal.goalName}</TableCell>
                        <TableCell>{goal.goalDescription}</TableCell>
                        <TableCell>{formatDate(goal.startDate)}</TableCell>
                        <TableCell>{formatDate(goal.endDate)}</TableCell>
                        <TableCell>
                          <Box sx={{ width: '100%' }}>
                            {canEdit ? (
                              <TextField
                                type="number"
                                size="small"
                                value={goal.progress}
                                inputProps={{ min: 0, max: 100 }}
                                onChange={(e) => handleProgressUpdate(goal._id, parseInt(e.target.value))}
                                sx={{ width: '70px', mb: 0.5 }}
                              />
                            ) : (
                              <Typography variant="body2">{goal.progress}%</Typography>
                            )}
                            <LinearProgress 
                              variant="determinate" 
                              value={goal.progress} 
                              sx={{ height: 8, borderRadius: 1 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={statusOptions.find(s => s.value === goal.status)?.label || goal.status}
                            color={statusColors[goal.status] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            {canManageGoal && (
                              <Tooltip title="Edit">
                                <IconButton
                                  color="primary"
                                  onClick={() => handleOpenForm(goal)}
                                  size="small"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {isOwnGoal && !isCompleted && (
                              <Tooltip title="Mark as Completed">
                                <IconButton
                                  color="success"
                                  onClick={() => handleMarkComplete(goal._id)}
                                  size="small"
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {['admin', 'hr'].includes(userRole) && (
                              <Tooltip title="Delete">
                                <IconButton
                                  color="error"
                                  onClick={() => handleDelete(goal._id)}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {goals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No goals found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={goals.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Add/Edit Goal Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {/* Employee Selection */}
            <TextField
              margin="dense"
              name="employeeId"
              select
              label="Employee"
              fullWidth
              value={formData.employeeId}
              onChange={handleChange}
              required
              disabled={userRole === 'employee' || (isEditing && !['admin', 'hr'].includes(userRole))}
            >
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name}
                </MenuItem>
              ))}
            </TextField>

            {/* Appraisal Selection (Optional) */}
            <TextField
              margin="dense"
              name="appraisalId"
              select
              label="Related Appraisal (Optional)"
              fullWidth
              value={formData.appraisalId}
              onChange={handleChange}
            >
              <MenuItem value="">None</MenuItem>
              {appraisals.map((appraisal) => (
                <MenuItem key={appraisal._id} value={appraisal._id}>
                  {appraisal.appraisalCycle} - {appraisal.employee?.name || 'Unknown'}
                </MenuItem>
              ))}
            </TextField>

            {/* Goal Details */}
            <TextField
              margin="dense"
              name="goalName"
              label="Goal Name"
              fullWidth
              value={formData.goalName}
              onChange={handleChange}
              required
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
            />
            
            {/* Timeline */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  name="startDate"
                  label="Start Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  name="endDate"
                  label="End Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>

            {/* Progress and Status */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  name="progress"
                  label="Progress (%)"
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                  value={formData.progress}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="status"
                  select
                  label="Status"
                  fullWidth
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Goals; 