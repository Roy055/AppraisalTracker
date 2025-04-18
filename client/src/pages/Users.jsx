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
  Alert,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
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
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import axios from 'axios';

// Role options for the dropdown in Add/Edit User form
// Admin option removed as there should only be one admin
const roleOptions = [
  { value: 'hr', label: 'HR' },
  { value: 'manager', label: 'Project Manager' },
  { value: 'employee', label: 'Developer' }
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    status: 'active',
    department: ''
  });

  const getRoleLabel = (role) => {
    const foundRole = roleOptions.find(r => r.value === role);
    // Special case for admin that isn't in dropdown but might exist in data
    if (role === 'admin') return 'Admin';
    return foundRole ? foundRole.label : 'Unknown';
  };

  const getStatusLabel = (status) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Active';
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'error';
  };

  const getDepartmentName = (departmentId) => {
    const department = departments.find(d => d._id === departmentId);
    return department ? department.departmentName : 'Not Assigned';
  };

  const columns = [
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'email', headerName: 'Email', width: 220 },
    {
      field: 'department',
      headerName: 'Department',
      width: 160,
      valueGetter: (params) => {
        return getDepartmentName(params.row.department);
      }
    },
    { 
      field: 'role', 
      headerName: 'Role', 
      width: 150,
      renderCell: (params) => (
        <Typography>
          {getRoleLabel(params.row.role)}
        </Typography>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={getStatusLabel(params.row.status)} 
          color={getStatusColor(params.row.status)} 
          variant="outlined" 
          size="small"
        />
      )
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
            disabled={params.row.role === 'admin'} // Disable editing for admin users
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            color="error" 
            size="small" 
            onClick={() => handleDelete(params.row._id)}
            disabled={params.row.role === 'admin'} // Disable deletion for admin users
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      console.log('User data:', response.data);
      setUsers(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      console.log('Departments response:', response.data);
      if (response.data && response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setEditMode(false);
    setError('');
    setSuccess('');
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      status: 'active',
      department: ''
    });
  };

  const handleEdit = (user) => {
    setEditMode(true);
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status || 'active',
      department: user.department || ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setSelectedUser(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      if (editMode && selectedUser) {
        // Update existing user
        const data = { ...formData };
        // Don't send empty password in update request
        if (!data.password) delete data.password;
        
        console.log('Updating user:', data);
        const response = await axios.put(`/api/users/${selectedUser._id}`, data);
        
        if (response.data.success) {
          setSuccess('User updated successfully');
          fetchUsers();
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          setError(response.data.error || 'Failed to update user');
        }
      } else {
        // Create new user
        console.log('Creating user:', formData);
        const response = await axios.post('/api/users', formData);
        
        if (response.data.success) {
          setSuccess('User created successfully');
          fetchUsers();
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          setError(response.data.error || 'Failed to create user');
        }
      }
    } catch (error) {
      console.error('Error managing user:', error);
      setError(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        const response = await axios.delete(`/api/users/${userId}`);
        
        if (response.data.success) {
          fetchUsers();
          setSuccess('User deleted successfully');
          setTimeout(() => {
            setSuccess('');
          }, 3000);
        } else {
          setError(response.data.error || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setError(error.response?.data?.error || 'Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Users</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpen}
          disabled={loading}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        {loading && users.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
              <Table stickyHeader aria-label="users table">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow hover key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getDepartmentName(user.department)}</TableCell>
                        <TableCell>
                          <Typography>
                            {getRoleLabel(user.role)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getStatusLabel(user.status)} 
                            color={getStatusColor(user.status)} 
                            variant="outlined" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <IconButton 
                              color="primary" 
                              size="small" 
                              onClick={() => handleEdit(user)}
                              disabled={user.role === 'admin'} // Disable editing for admin users
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              size="small" 
                              onClick={() => handleDelete(user._id)}
                              disabled={user.role === 'admin'} // Disable deletion for admin users
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={users.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? 'Edit User' : 'Add New User'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Name"
              type="text"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="email"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="password"
              label={editMode ? "Password (leave blank to keep current)" : "Password"}
              type="password"
              fullWidth
              value={formData.password}
              onChange={handleChange}
              required={!editMode}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
              >
                {roleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel id="department-label">Department</InputLabel>
              <Select
                labelId="department-label"
                name="department"
                value={formData.department}
                onChange={handleChange}
                label="Department"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department._id} value={department._id}>
                    {department.departmentName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {editMode && (
              <FormControl fullWidth margin="dense">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status || 'active'}
                  onChange={handleChange}
                  label="Status"
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
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
    </Box>
  );
};

export default Users; 