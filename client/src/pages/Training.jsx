import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  Tooltip,
  IconButton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import axios from 'axios';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' }
];

const Training = () => {
  const [trainings, setTrainings] = useState([]);
  const [users, setUsers] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    employeeId: '',
    appraisalId: '',
    trainingName: '',
    description: '',
    status: 'pending'
  });
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);

  const columns = [
    { 
      field: 'employeeName', 
      headerName: 'Employee', 
      width: 200,
      valueGetter: (params) => {
        // First try to get the name from the populated field
        if (params.row.employeeId?.name) {
          return params.row.employeeId.name;
        }
        // If not found, try to find the employee in the users list
        const user = users.find(u => u._id === params.row.employeeId);
        return user ? user.name : 'Unknown';
      }
    },
    { field: 'trainingName', headerName: 'Training', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      valueGetter: (params) => {
        const status = statusOptions.find(s => s.value === params.row.status);
        return status ? status.label : 'Unknown';
      }
    },
    { 
      field: 'recommendedBy', 
      headerName: 'Recommended By', 
      width: 200,
      valueGetter: (params) => {
        // First try to get the name from the populated field
        if (params.row.recommendedBy?.name) {
          return params.row.recommendedBy.name;
        }
        // If not found, try to find the recommender in the users list
        const recommender = users.find(u => u._id === params.row.recommendedBy);
        return recommender ? recommender.name : 'Unknown';
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => {
        // Only show update button for employee's own pending/approved trainings
        const isOwnTraining = params.row.employeeId === userId || params.row.employeeId?._id === userId;
        const canUpdate = isOwnTraining && params.row.status !== 'completed' && params.row.status !== 'rejected';
        
        if (canUpdate) {
          return (
            <Tooltip title="Mark as Completed">
              <IconButton 
                color="primary"
                onClick={() => handleStatusUpdate(params.row._id)}
              >
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
          );
        }
        return null;
      }
    }
  ];

  useEffect(() => {
    fetchUserRole();
    fetchTrainings();
    fetchAppraisals();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await axios.get('/api/users/me');
      if (response.data && response.data.success) {
        setUserRole(response.data.data.role);
        setUserId(response.data.data._id);
        // If user is admin or HR, fetch all users
        if (['admin', 'hr'].includes(response.data.data.role)) {
          fetchUsers();
        } else {
          // For other roles, just set the current user
          setUsers([response.data.data]);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setError('Error fetching user information');
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
      setError('Error fetching users');
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await axios.get('/api/training');
      console.log('Trainings response:', response.data);
      // Handle the correct data format with success and data properties
      if (response.data && response.data.success) {
        setTrainings(response.data.data || []);
      } else {
        setTrainings([]);
      }
    } catch (error) {
      console.error('Error fetching trainings:', error);
      setTrainings([]);
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

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      employeeId: '',
      appraisalId: '',
      trainingName: '',
      description: '',
      status: 'pending'
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
      await axios.post('/api/training', formData);
      fetchTrainings();
      handleClose();
    } catch (error) {
      console.error('Error creating training:', error);
    }
  };

  const handleStatusUpdate = async (id) => {
    try {
      const response = await axios.put(`/api/training/${id}/status`, {
        status: 'completed'
      });
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Training marked as completed successfully',
          severity: 'success'
        });
        fetchTrainings();
      }
    } catch (error) {
      console.error('Error updating training status:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error updating training status',
        severity: 'error'
      });
    }
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
    // First try to get the name from the populated field
    if (employeeId?.name) {
      return employeeId.name;
    }
    // If not found, try to find the employee in the users list
    const user = users.find(u => u._id === employeeId);
    return user ? user.name : 'Unknown';
  };

  const getRecommenderName = (recommendedBy) => {
    // First try to get the name from the populated field
    if (recommendedBy?.name) {
      return recommendedBy.name;
    }
    // If not found, try to find the recommender in the users list
    const recommender = users.find(u => u._id === recommendedBy);
    return recommender ? recommender.name : 'Unknown';
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.label : 'Unknown';
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Training</Typography>
        {userRole && ['admin', 'hr', 'manager'].includes(userRole) && (
          <Button variant="contained" color="primary" onClick={handleOpen}>
            New Training
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Trainings</Typography>
              </Box>
              <Typography variant="h4">{trainings.length}</Typography>
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
                {trainings.filter(t => t.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader aria-label="trainings table">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Training</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Recommended By</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainings
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((training) => {
                      const isOwnTraining = training.employeeId === userId || training.employeeId?._id === userId;
                      const canUpdate = isOwnTraining && training.status !== 'completed' && training.status !== 'rejected';
                      
                      return (
                        <TableRow hover key={training._id}>
                          <TableCell>{getEmployeeName(training.employeeId)}</TableCell>
                          <TableCell>{training.trainingName}</TableCell>
                          <TableCell>{training.description}</TableCell>
                          <TableCell>{getStatusLabel(training.status)}</TableCell>
                          <TableCell>{getRecommenderName(training.recommendedBy)}</TableCell>
                          <TableCell>
                            {canUpdate && (
                              <Tooltip title="Mark as Completed">
                                <IconButton 
                                  color="primary"
                                  onClick={() => handleStatusUpdate(training._id)}
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {trainings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No trainings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={trainings.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {userRole && ['admin', 'hr', 'manager'].includes(userRole) && (
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Create New Training Recommendation</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                margin="dense"
                name="employeeId"
                select
                label="Employee"
                fullWidth
                value={formData.employeeId}
                onChange={handleChange}
                required
              >
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                margin="dense"
                name="appraisalId"
                select
                label="Appraisal"
                fullWidth
                value={formData.appraisalId}
                onChange={handleChange}
                required
              >
                {appraisals.map((appraisal) => (
                  <MenuItem key={appraisal._id} value={appraisal._id}>
                    {appraisal.appraisalCycle} - {appraisal.employee?.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                margin="dense"
                name="trainingName"
                label="Training Name"
                fullWidth
                value={formData.trainingName}
                onChange={handleChange}
                required
              />
              <TextField
                margin="dense"
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
                required
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                Create
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

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

export default Training; 