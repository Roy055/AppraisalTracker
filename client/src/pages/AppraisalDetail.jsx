import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Star as StarIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AppraisalStepper from '../components/appraisal/AppraisalStepper';
import SelfReviewSection from '../components/appraisal/SelfReviewSection';
import FeedbackSection from '../components/appraisal/FeedbackSection';
import FinalReviewSection from '../components/appraisal/FinalReviewSection';

const statusColors = {
  'pending': 'default',
  'self-review': 'info',
  'pm-review': 'warning',
  'hr-review': 'secondary',
  'completed': 'success'
};

const AppraisalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appraisal, setAppraisal] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Create a flag to prevent duplicate API calls
    let isMounted = true;
    
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setEmployee(null); // Reset employee data
      try {
        // First try to get the appraisal with populated employee data
        const response = await axios.get(`/api/appraisals/${id}?populate=employee`);
        
        // Check if component is still mounted
        if (!isMounted) return;
        
        if (response.data && response.data.success) {
          const appraisalData = response.data.data;
          setAppraisal(appraisalData);
          
          // Check if employee data is already populated in the response
          if (appraisalData.employee && typeof appraisalData.employee === 'object' && appraisalData.employee.name) {
            console.log('Employee data found in populated response:', appraisalData.employee);
            setEmployee(appraisalData.employee);
          } 
          // Otherwise fetch employee details separately
          else if (appraisalData.employee) {
            try {
              // Try to get user data from context first if it matches
              if (user && appraisalData.employee.toString() === user._id.toString()) {
                console.log('Using current user data for employee');
                setEmployee({
                  _id: user._id,
                  name: user.name
                });
              } else {
                // Try to get employee name from appraisals list API which might have names
                try {
                  const appraisalsResponse = await axios.get('/api/appraisals');
                  if (appraisalsResponse.data && appraisalsResponse.data.success) {
                    const appraisals = appraisalsResponse.data.data;
                    // Look for any appraisal with the same employee ID that might have employee name
                    const matchingAppraisal = appraisals.find(a => 
                      a.employee && 
                      a.employee._id === appraisalData.employee &&
                      typeof a.employee === 'object' && 
                      a.employee.name
                    );
                    
                    if (matchingAppraisal && matchingAppraisal.employee.name) {
                      console.log('Found employee name in appraisals list:', matchingAppraisal.employee.name);
                      setEmployee(matchingAppraisal.employee);
                      return;
                    }
                  }
                } catch (err) {
                  console.log('Could not get employee name from appraisals list');
                }
                
                // Last resort, try to get user directly
                const userResponse = await axios.get(`/api/users/${appraisalData.employee}`, {
                  timeout: 5000,
                  validateStatus: function (status) {
                    return status < 500;
                  }
                });
                
                // Check if component is still mounted
                if (!isMounted) return;
                
                if (userResponse.data && userResponse.data.success && userResponse.data.data) {
                  console.log('Employee data fetched successfully');
                  setEmployee(userResponse.data.data);
                } else {
                  console.log('Employee data not available:', appraisalData.employee);
                  // Last resort, try to get employee name from anywhere in the appraisal data
                  const employeeName = extractEmployeeNameFromAppraisal(appraisalData);
                  if (employeeName) {
                    setEmployee({ 
                      _id: appraisalData.employee,
                      name: employeeName
                    });
                  } else {
                    // If all else fails, use a generic placeholder with the ID
                    setEmployee({ 
                      _id: appraisalData.employee,
                      name: `Employee ID: ${appraisalData.employee.substring(0, 8)}...` 
                    });
                  }
                }
              }
            } catch (err) {
              // Check if component is still mounted
              if (!isMounted) return;
              
              console.error('Error fetching employee details:', err);
              
              // Last resort, check for employee name in the appraisal object
              const employeeName = extractEmployeeNameFromAppraisal(appraisalData);
              if (employeeName) {
                setEmployee({ 
                  _id: appraisalData.employee,
                  name: employeeName
                });
              } else {
                // If all else fails, use a generic placeholder with the ID
                setEmployee({ 
                  _id: appraisalData.employee,
                  name: `Employee ID: ${appraisalData.employee.substring(0, 8)}...` 
                });
              }
            }
          } else {
            console.warn('No employee ID found in appraisal data:', appraisalData);
          }
        } else {
          setError('Failed to load appraisal data');
        }
      } catch (err) {
        // Check if component is still mounted
        if (!isMounted) return;
        
        console.error('Error fetching appraisal:', err);
        setError('An error occurred while loading the appraisal');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [id]); // Only re-run if ID changes

  const handleStatusChange = async (newStatus) => {
    try {
      // Refresh the appraisal data to get the updated status
      const response = await axios.get(`/api/appraisals/${id}`);
      if (response.data && response.data.success) {
        setAppraisal(response.data.data);
      }
    } catch (err) {
      console.error('Error refreshing appraisal after status change:', err);
    }
  };

  // Helper function to extract employee name from appraisal data if available
  const extractEmployeeNameFromAppraisal = (appraisalData) => {
    // Check all possible places where employee name might be stored
    if (appraisalData.employeeName) return appraisalData.employeeName;
    if (appraisalData.employee_name) return appraisalData.employee_name;
    if (appraisalData.user && appraisalData.user.name) return appraisalData.user.name;
    if (appraisalData.employee_data && appraisalData.employee_data.name) return appraisalData.employee_data.name;
    if (appraisalData.employeeData && appraisalData.employeeData.name) return appraisalData.employeeData.name;
    
    // No name found
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/appraisals')}
          sx={{ mt: 2 }}
        >
          Back to Appraisals
        </Button>
      </Box>
    );
  }

  if (!appraisal) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Appraisal not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/appraisals')}
          sx={{ mt: 2 }}
        >
          Back to Appraisals
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink underline="hover" color="inherit" onClick={() => navigate('/dashboard')} sx={{ cursor: 'pointer' }}>
          Dashboard
        </MuiLink>
        <MuiLink underline="hover" color="inherit" onClick={() => navigate('/appraisals')} sx={{ cursor: 'pointer' }}>
          Appraisals
        </MuiLink>
        <Typography color="text.primary">Appraisal Details</Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/appraisals')}
        sx={{ mb: 3 }}
      >
        Back to Appraisals
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {appraisal.appraisalCycle} Appraisal
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">
                Employee: {loading ? 'Loading...' : (
                  employee?.name || 
                  (appraisal?.employee?.name ? appraisal.employee.name : 
                  (user && appraisal?.employee?.toString() === user._id?.toString() ? user.name : 'Loading...'))
                )}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">
                Period: {new Date(appraisal.startDate).toLocaleDateString()} - {new Date(appraisal.endDate).toLocaleDateString()}
              </Typography>
            </Box>
            {appraisal.overallRating > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">
                  Overall Rating: {appraisal.overallRating}/5
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Chip 
              label={appraisal.status.replace('-', ' ').toUpperCase()}
              color={statusColors[appraisal.status] || 'default'}
              sx={{ textTransform: 'uppercase' }}
            />
          </Grid>
        </Grid>
      </Paper>

      <AppraisalStepper 
        appraisal={appraisal} 
        onStatusChange={handleStatusChange} 
      />

      {/* Self Review Section - Show for employee when status is pending/self-review
          or show to all users once it's submitted */}
      {(appraisal.status === 'pending' && appraisal.employee?.toString() === user?._id?.toString()) || 
       appraisal.status !== 'pending' ? (
        <SelfReviewSection 
          appraisal={appraisal} 
          onStatusChange={handleStatusChange} 
        />
      ) : null}

      {/* Feedback & Manager Review Section - Show when status is at or beyond self-review */}
      {['self-review', 'pm-review', 'hr-review', 'completed'].includes(appraisal.status) ? (
        <FeedbackSection 
          appraisal={appraisal} 
          onStatusChange={handleStatusChange} 
        />
      ) : null}

      {/* HR Final Review Section - Show when status is at or beyond pm-review
          but only for HR and admins */}
      {['pm-review', 'hr-review', 'completed'].includes(appraisal.status) && 
       (user?.role === 'hr' || user?.role === 'admin') ? (
        <FinalReviewSection 
          appraisal={appraisal} 
          onStatusChange={handleStatusChange} 
        />
      ) : null}
    </Box>
  );
};

export default AppraisalDetail; 