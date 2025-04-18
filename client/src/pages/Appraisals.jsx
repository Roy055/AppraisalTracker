import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  IconButton,
  Tooltip,
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
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Status options for appraisals
const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'default' },
  { value: 'self-review', label: 'Self Review', color: 'info' },
  { value: 'pm-review', label: 'PM Review', color: 'warning' },
  { value: 'hr-review', label: 'HR Review', color: 'secondary' },
  { value: 'completed', label: 'Completed', color: 'success' }
];

const Appraisals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appraisals, setAppraisals] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee: '',
    appraisalCycle: '',
    startDate: '',
    endDate: '',
    status: 'pending'
  });
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appraisalToDelete, setAppraisalToDelete] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns = [
    { 
      field: 'userName', 
      headerName: 'Employee', 
      width: 200,
      valueGetter: (params) => {
        // Skip excess logging to keep console cleaner
        // console.log('Row data for employee column:', params.row);
        
        // For employees, if this is their own appraisal, show "You"
        if (user.role === 'employee' && params.row.employee && 
            params.row.employee.toString() === user._id.toString()) {
          return 'You';
        }
        
        // Case 1: If the employee field is an object (populated reference)
        if (params.row.employee && typeof params.row.employee === 'object') {
          const empObject = params.row.employee;
          return empObject.name || empObject.fullName || `${empObject.firstName || ''} ${empObject.lastName || ''}`.trim();
        }
        
        // Case 2: If we have an employee ID, try to find the user in our users array
        const employeeId = params.row.employee && params.row.employee.toString();
        if (employeeId) {
          // Find the user by ID
          const foundUser = users.find(u => u._id && u._id.toString() === employeeId);
          if (foundUser) {
            return foundUser.name || foundUser.fullName || 'User';
          }
        }
        
        // Case 3: Check other possible locations for employee data
        const employeeData = 
          params.row.employee_data || 
          params.row.employeeData || 
          params.row.user;
        
        if (employeeData) {
          return employeeData.name || 
                 employeeData.fullName || 
                 employeeData.userName || 
                 `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim() ||
                 'Employee';
        }
        
        // Case 4: Direct properties in the row
        if (params.row.employeeName) {
          return params.row.employeeName;
        }
        
        if (params.row.userName) {
          return params.row.userName;
        }
        
        // Final fallback - use ID if available
        return employeeId ? `Employee ${employeeId.substring(0, 8)}` : 'Unknown';
      }
    },
    { field: 'appraisalCycle', headerName: 'Cycle', width: 150 },
    { 
      field: 'startDate', 
      headerName: 'Start Date', 
      width: 150,
      valueGetter: (params) => new Date(params.row.startDate).toLocaleDateString()
    },
    { 
      field: 'endDate', 
      headerName: 'End Date', 
      width: 150,
      valueGetter: (params) => new Date(params.row.endDate).toLocaleDateString()
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => {
        const statusOption = statusOptions.find(s => s.value === params.row.status);
        return (
          <Chip 
            label={statusOption ? statusOption.label : params.row.status}
            color={statusOption ? statusOption.color : 'default'}
            size="small"
          />
        );
      }
    },
    { 
      field: 'overallRating', 
      headerName: 'Rating', 
      width: 100,
      valueGetter: (params) => params.row.overallRating || '-'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="View Details">
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/appraisals/${params.row._id}`);
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          
          {user && user.role === 'admin' && (
            <Tooltip title="Delete Appraisal">
              <IconButton 
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  setAppraisalToDelete(params.row);
                  setDeleteDialogOpen(true);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </>
      )
    }
  ];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Improve the tryExtractUserDataFromAppraisals function to better extract names
  const tryExtractUserDataFromAppraisals = (appraisalData) => {
    if (!appraisalData || appraisalData.length === 0) return;
    
    try {
      // Extract basic user info from appraisals if available
      const extractedUsers = [];
      const seenIds = new Set();
      
      appraisalData.forEach(appraisal => {
        if (appraisal.employee && !seenIds.has(appraisal.employee.toString())) {
          const userId = appraisal.employee.toString();
          seenIds.add(userId);
          
          // Check for employee data in different possible locations
          const employeeData = 
            appraisal.employee_data || 
            appraisal.employeeData || 
            appraisal.user ||
            {};
          
          // Check for name in different possible properties
          const name = 
            employeeData.name || 
            employeeData.fullName || 
            employeeData.userName ||
            appraisal.employeeName ||
            appraisal.userName;
          
          if (name) {
            // If we found a name, use it
            extractedUsers.push({
              _id: userId,
              name: name,
              email: employeeData.email || 'N/A'
            });
          } else {
            // If no name found, use "Employee" with formatted ID (no ellipsis)
            extractedUsers.push({
              _id: userId,
              name: `Employee ${userId.substring(0, 8)}`,
              email: 'N/A'
            });
          }
        }
      });
      
      if (extractedUsers.length > 0) {
        setUsers(extractedUsers);
      }
    } catch (err) {
      console.error('Failed to extract user data from appraisals:', err);
    }
  };

  // Update fetchData function to handle employee role better
  const fetchData = async () => {
    if (!user) return; // Don't fetch if no user is logged in
    
    setLoading(true);
    try {
      // Get authorization token
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Users and departments arrays to be populated
      let userData = [];
      let departmentData = [];
      
      // Fetch appraisals first
      let appraisalData = [];
      try {
        let apiUrl = '/api/appraisals';
        
        // Apply appropriate filters based on role
        if (user.role === 'manager' && user.department) {
          apiUrl += `?departmentId=${user.department}`;
        }
        
        const appraisalResponse = await axios.get(apiUrl, config);
        if (appraisalResponse.data && appraisalResponse.data.success) {
          appraisalData = appraisalResponse.data.data || [];
          setAppraisals(appraisalData);
          
          // Debug - Log a sample appraisal to see its structure
          if (appraisalData.length > 0) {
            console.log('Sample appraisal structure:', appraisalData[0]);
          }
        } else {
          setAppraisals([]);
        }
      } catch (error) {
        console.error('Error fetching appraisals:', error);
        setAppraisals([]);
      }
      
      // Now get departments if needed
      if (user.role === 'admin' || user.role === 'hr' || user.role === 'manager') {
        try {
          const deptResponse = await axios.get('/api/departments', config);
          if (deptResponse.data && deptResponse.data.success) {
            departmentData = deptResponse.data.data || [];
            setDepartments(departmentData);
          }
        } catch (error) {
          console.error('Error fetching departments:', error);
        }
      }
      
      // Get user data
      try {
        if (user.role === 'admin' || user.role === 'hr') {
          // Admin and HR can get all users
          const userResponse = await axios.get('/api/users', config);
          if (userResponse.data && userResponse.data.success) {
            userData = userResponse.data.data || [];
            console.log('Retrieved users data:', userData.length, 'users');
            setUsers(userData);
          }
        } else if (user.role === 'employee') {
          // SPECIAL HANDLING FOR EMPLOYEE ROLE
          console.log('Employee role - setting up user data');
          
          // For employee role, they are only seeing their own appraisals
          // So we can directly include their own user data
          const currentUserData = [{
            _id: user._id,
            name: user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'You',
            email: user.email || 'N/A'
          }];
          
          // If there are any other users mentioned in appraisals, add them too
          if (appraisalData.length > 0) {
            const otherUserIds = appraisalData
              .filter(a => a.employee && a.employee.toString() !== user._id.toString())
              .map(a => a.employee.toString());
              
            if (otherUserIds.length > 0) {
              console.log('Found other users in appraisals:', otherUserIds);
              // Add placeholder entries for other users
              otherUserIds.forEach(id => {
                currentUserData.push({
                  _id: id,
                  name: `Other Employee (${id.substring(0, 6)})`,
                  email: 'N/A'
                });
              });
            }
          }
          
          console.log('Setting user data for employee:', currentUserData);
          setUsers(currentUserData);
        } else {
          // For managers and other roles
          console.log('Manager/other role - extracting user data');
          
          let extractedUsers = [];
          let foundUserData = false;
          
          // First check if the appraisals have a 'populated' employee field with user data
          if (appraisalData.length > 0) {
            if (typeof appraisalData[0].employee === 'object' && appraisalData[0].employee !== null) {
              // The employee field contains the user object - great!
              console.log('Found populated employee objects in appraisals');
              extractedUsers = appraisalData
                .filter(a => a.employee && typeof a.employee === 'object')
                .map(a => a.employee);
              foundUserData = true;
            }
            // Otherwise check if there's user data in the other fields
            else if (
              appraisalData[0].employee_data || 
              appraisalData[0].employeeData || 
              appraisalData[0].user
            ) {
              console.log('Found employee data in alternative fields');
              extractedUsers = appraisalData.map(a => {
                const empData = a.employee_data || a.employeeData || a.user || {};
                return {
                  _id: a.employee,
                  name: empData.name || empData.fullName || a.employeeName || `Employee ${a.employee.toString().substring(0, 8)}`,
                  email: empData.email || 'N/A'
                };
              });
              foundUserData = true;
            }
          }
          
          if (foundUserData && extractedUsers.length > 0) {
            console.log('Using extracted users:', extractedUsers.length);
            setUsers(extractedUsers);
          } else {
            console.log('Creating placeholder users from IDs');
            const placeholderUsers = appraisalData
              .filter(a => a.employee)
              .map(a => ({
                _id: a.employee,
                name: `Employee ${a.employee.toString().substring(0, 8)}`,
                email: 'N/A'
              }));
            
            if (placeholderUsers.length > 0) {
              setUsers(placeholderUsers);
            }
          }
        }
      } catch (error) {
        console.error('Error handling user data:', error);
        // Final fallback
        tryExtractUserDataFromAppraisals(appraisalData);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      setAppraisals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      employee: '',
      appraisalCycle: '',
      startDate: '',
      endDate: '',
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
      await axios.post('/api/appraisals', formData);
      fetchData();
      handleClose();
    } catch (error) {
      console.error('Error creating appraisal:', error);
    }
  };

  // Only HR and Admin can create new appraisals
  const canCreateAppraisal = user && (user.role === 'hr' || user.role === 'admin');

  // Role-based stats
  const getStatistics = () => {
    const pending = appraisals.filter(a => a.status === 'pending').length;
    const selfReview = appraisals.filter(a => a.status === 'self-review').length;
    const pmReview = appraisals.filter(a => a.status === 'pm-review').length;
    const hrReview = appraisals.filter(a => a.status === 'hr-review').length;
    const completed = appraisals.filter(a => a.status === 'completed').length;
    
    return { pending, selfReview, pmReview, hrReview, completed, total: appraisals.length };
  };

  const stats = getStatistics();

  const handleDeleteAppraisal = async () => {
    if (!appraisalToDelete) return;
    
    try {
      await axios.delete(`/api/appraisals/${appraisalToDelete._id}`);
      fetchData();
      setDeleteDialogOpen(false);
      setAppraisalToDelete(null);
    } catch (error) {
      console.error('Error deleting appraisal:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getEmployeeName = (employeeData) => {
    // For employees, if this is their own appraisal, show "You"
    if (user.role === 'employee' && employeeData && 
        employeeData.toString() === user._id.toString()) {
      return 'You';
    }
    
    // Case 1: If the employee field is an object (populated reference)
    if (employeeData && typeof employeeData === 'object') {
      const empObject = employeeData;
      return empObject.name || empObject.fullName || `${empObject.firstName || ''} ${empObject.lastName || ''}`.trim();
    }
    
    // Case 2: If we have an employee ID, try to find the user in our users array
    const employeeId = employeeData && employeeData.toString();
    if (employeeId) {
      // Find the user by ID
      const foundUser = users.find(u => u._id && u._id.toString() === employeeId);
      if (foundUser) {
        return foundUser.name || foundUser.fullName || 'User';
      }
    }
    
    // Final fallback - use ID if available
    return employeeId ? `Employee ${employeeId.substring(0, 8)}` : 'Unknown';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Appraisals</Typography>
        {canCreateAppraisal && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleOpen}
            startIcon={<AddIcon />}
          >
            New Appraisal
          </Button>
        )}
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={user?.role === 'admin' || user?.role === 'hr' ? 4 : 6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total</Typography>
              </Box>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={user?.role === 'admin' || user?.role === 'hr' ? 4 : 6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Pending</Typography>
              </Box>
              <Typography variant="h4">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
          <>
            <Grid item xs={12} sm={6} md={user?.role === 'admin' || user?.role === 'hr' ? 4 : 6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">Self Review</Typography>
                  </Box>
                  <Typography variant="h4">{stats.selfReview}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={user?.role === 'admin' || user?.role === 'hr' ? 4 : 6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">PM Review</Typography>
                  </Box>
                  <Typography variant="h4">{stats.pmReview}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
        
        {(user?.role === 'admin' || user?.role === 'hr') && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">HR Review</Typography>
                  </Box>
                  <Typography variant="h4">{stats.hrReview}</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" noWrap={false}>Completed</Typography>
                  </Box>
                  <Typography variant="h4">{stats.completed}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Replace DataGrid with MUI Table */}
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 380px)' }}>
              <Table stickyHeader aria-label="appraisals table">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Cycle</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appraisals
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((appraisal) => {
                      const statusOption = statusOptions.find(s => s.value === appraisal.status);
                      
                      return (
                        <TableRow 
                          hover 
                          key={appraisal._id}
                          onClick={() => navigate(`/appraisals/${appraisal._id}`)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{getEmployeeName(appraisal.employee)}</TableCell>
                          <TableCell>{appraisal.appraisalCycle}</TableCell>
                          <TableCell>{formatDate(appraisal.startDate)}</TableCell>
                          <TableCell>{formatDate(appraisal.endDate)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={statusOption ? statusOption.label : appraisal.status}
                              color={statusOption ? statusOption.color : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{appraisal.overallRating || '-'}</TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/appraisals/${appraisal._id}`);
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            
                            {user && user.role === 'admin' && (
                              <Tooltip title="Delete Appraisal">
                                <IconButton 
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAppraisalToDelete(appraisal);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {appraisals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No appraisals found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={appraisals.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Create Appraisal Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Appraisal</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              name="employee"
              select
              label="Employee"
              fullWidth
              value={formData.employee}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            >
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name} - {user.email}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="dense"
              name="appraisalCycle"
              label="Appraisal Cycle"
              fullWidth
              value={formData.appraisalCycle}
              onChange={handleChange}
              required
              placeholder="e.g. 2023-Q1"
              sx={{ mb: 2 }}
            />
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
              sx={{ mb: 2 }}
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
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this appraisal? This action cannot be undone.
          </Typography>
          {appraisalToDelete && (
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Employee: {users.find(u => u._id === appraisalToDelete.employee)?.name || 'Unknown'}
              <br />
              Cycle: {appraisalToDelete.appraisalCycle}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteAppraisal}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Appraisals; 