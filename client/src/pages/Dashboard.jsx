import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1,
            mr: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      // Clear previous errors
      setError('');
      setLoading(true);
      
      try {
        // Make sure we have auth token before proceeding
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }
        
        // Set up request with authorization header
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        // Fetch dashboard stats from the dedicated endpoint
        const response = await axios.get('/api/dashboard/stats', config);
        
        if (response.data && response.data.success) {
          const dashboardData = response.data.data || {};
          setStats(dashboardData);
          
          // If admin or HR, set departments
          if (user.role === 'admin' || user.role === 'hr') {
            setDepartments(dashboardData.departments || []);
          }
        } else {
          // Handle unexpected response format
          setError('Invalid data format received from server');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Handle specific error types
        if (error.response) {
          // Server responded with an error status
          if (error.response.status === 401) {
            setError('Session expired. Please log in again.');
          } else if (error.response.status === 403) {
            setError('You do not have permission to access this data.');
          } else {
            setError(`Server error: ${error.response.data?.error || 'Unknown error'}`);
          }
        } else if (error.request) {
          // Request was made but no response received
          setError('Unable to connect to server. Please check your internet connection.');
        } else {
          // Other errors
          setError('An unexpected error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if user is logged in
    if (user && user._id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Render different dashboards based on user role
  const renderRoleBasedDashboard = () => {
    if (!user) return null;
    
    // Admin or HR Dashboard
    if (user.role === 'admin' || user.role === 'hr') {
      return (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>Organization Overview</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Users"
                value={stats.totalUsers || 0}
                icon={<PeopleIcon color="primary" />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Departments"
                value={stats.totalDepartments || 0}
                icon={<BusinessIcon color="info" />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Appraisals"
                value={stats.totalAppraisals || 0}
                icon={<AssessmentIcon color="secondary" />}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Trainings"
                value={stats.activeTrainings || 0}
                icon={<SchoolIcon color="success" />}
                color="success"
              />
            </Grid>
          </Grid>
        </>
      );
    }
    
    // Manager Dashboard
    if (user.role === 'manager') {
      return (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>Team Overview</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Team Members"
                value={stats.teamMembers || 0}
                icon={<PeopleIcon color="primary" />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Appraisals"
                value={stats.pendingAppraisals || 0}
                icon={<ScheduleIcon color="warning" />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completed Appraisals"
                value={stats.completedAppraisals || 0}
                icon={<CheckCircleIcon color="success" />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Trainings"
                value={stats.activeTrainings || 0}
                icon={<SchoolIcon color="info" />}
                color="info"
              />
            </Grid>
          </Grid>
        </>
      );
    }
    
    // Employee Dashboard
    return (
      <>
        <Typography variant="h6" sx={{ mb: 2 }}>My Performance</Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="My Appraisals"
              value={stats.myAppraisals || 0}
              icon={<AssessmentIcon color="primary" />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Training Assigned"
              value={stats.activeTrainings || 0}
              icon={<SchoolIcon color="info" />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="My Goals"
              value={stats.myGoals || 0}
              icon={<AssignmentIcon color="warning" />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completed Goals"
              value={stats.completedGoals || 0}
              icon={<CheckCircleIcon color="success" />}
              color="success"
            />
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        renderRoleBasedDashboard()
      )}
    </Box>
  );
};

export default Dashboard; 