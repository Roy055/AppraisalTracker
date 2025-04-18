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
  IconButton,
  Alert,
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
  Business as BusinessIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    departmentName: '',
    departmentManager: ''
  });

  const columns = [
    { field: 'departmentName', headerName: 'Department', width: 200 },
    { 
      field: 'managerName', 
      headerName: 'Manager', 
      width: 200,
      valueGetter: (params) => {
        const manager = users.find(u => u._id === params.row.departmentManager);
        return manager ? manager.name : 'Not assigned';
      }
    },
    { 
      field: 'employeeCount', 
      headerName: 'Employees', 
      width: 150,
      valueGetter: (params) => {
        return users.filter(u => u.department === params.row._id).length;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton 
            color="primary" 
            size="small" 
            onClick={() => handleEdit(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            color="error" 
            size="small" 
            onClick={() => handleDelete(params.row._id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/departments');
      console.log('Departments response:', response.data);
      // Handle the correct data format with success and data properties
      if (response.data && response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setDepartments([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      console.log('Users response:', response.data);
      // Handle the correct data format with success and data properties
      if (response.data && response.data.success) {
        setUsers(response.data.data || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setEditMode(false);
    setSelectedDepartment(null);
    setFormData({
      departmentName: '',
      departmentManager: ''
    });
  };

  const handleEdit = (department) => {
    setEditMode(true);
    setSelectedDepartment(department);
    setFormData({
      departmentName: department.departmentName,
      departmentManager: department.departmentManager || ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedDepartment(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editMode && selectedDepartment) {
        // Update existing department
        const response = await axios.put(`/api/departments/${selectedDepartment._id}`, formData);
        
        if (response.data && response.data.success) {
          setSnackbar({
            open: true,
            message: 'Department updated successfully',
            severity: 'success'
          });
          fetchDepartments();
          handleClose();
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to update department',
            severity: 'error'
          });
        }
      } else {
        // Create new department
        const response = await axios.post('/api/departments', formData);
        
        if (response.data && response.data.success) {
          setSnackbar({
            open: true,
            message: 'Department created successfully',
            severity: 'success'
          });
          fetchDepartments();
          handleClose();
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to create department',
            severity: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error managing department:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Operation failed',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (departmentId) => {
    if (window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      setLoading(true);
      try {
        const response = await axios.delete(`/api/departments/${departmentId}`);
        
        if (response.data && response.data.success) {
          setSnackbar({
            open: true,
            message: 'Department deleted successfully',
            severity: 'success'
          });
          fetchDepartments();
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to delete department',
            severity: 'error'
          });
        }
      } catch (error) {
        console.error('Error deleting department:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'Failed to delete department',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get eligible managers (only HR and Project Managers)
  const getEligibleManagers = () => {
    return users.filter(user => 
      user.role === 'hr' || user.role === 'manager'
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getManagerName = (managerId) => {
    const manager = users.find(u => u._id === managerId);
    return manager ? manager.name : 'Not assigned';
  };

  const getEmployeeCount = (departmentId) => {
    return users.filter(u => u.department === departmentId).length;
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Departments</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpen}
          disabled={loading}
        >
          Add Department
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Departments</Typography>
              </Box>
              <Typography variant="h4">{departments.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Employees</Typography>
              </Box>
              <Typography variant="h4">{users.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        {loading && departments.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader aria-label="departments table">
                <TableHead>
                  <TableRow>
                    <TableCell>Department</TableCell>
                    <TableCell>Manager</TableCell>
                    <TableCell>Employees</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((department) => (
                      <TableRow hover key={department._id}>
                        <TableCell>{department.departmentName}</TableCell>
                        <TableCell>{getManagerName(department.departmentManager)}</TableCell>
                        <TableCell>{getEmployeeCount(department._id)}</TableCell>
                        <TableCell>
                          <Box>
                            <IconButton 
                              color="primary" 
                              size="small" 
                              onClick={() => handleEdit(department)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              size="small" 
                              onClick={() => handleDelete(department._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  {departments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No departments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={departments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? 'Edit Department' : 'Add New Department'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="departmentName"
              label="Department Name"
              type="text"
              fullWidth
              value={formData.departmentName}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="departmentManager"
              select
              label="Department Manager"
              fullWidth
              value={formData.departmentManager}
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {getEligibleManagers().map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name} ({user.role === 'hr' ? 'HR' : 'Project Manager'})
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
            >
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Departments; 