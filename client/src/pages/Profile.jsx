import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [department, setDepartment] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Fetch detailed user info
        const userResponse = await axios.get('/api/users/me');
        if (userResponse.data?.success) {
          setUserDetails(userResponse.data.data);
          
          // If user has a department, fetch department details
          if (userResponse.data.data?.department) {
            const deptResponse = await axios.get(`/api/departments/${userResponse.data.data.department}`);
            if (deptResponse.data?.success) {
              setDepartment(deptResponse.data.data);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile data:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  const getRoleLabel = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'hr': 'HR Manager',
      'manager': 'Project Manager',
      'employee': 'Developer'
    };
    return roleMap[role] || role;
  };

  const getAvatarColor = (role) => {
    const colorMap = {
      'admin': '#ff5252',
      'hr': '#4caf50',
      'manager': '#2196f3',
      'employee': '#ff9800'
    };
    return colorMap[role] || '#9e9e9e';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!userDetails) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No user information available</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 120, 
                height: 120, 
                fontSize: 48, 
                mb: 2,
                bgcolor: getAvatarColor(userDetails.role)
              }}
            >
              {userDetails.name ? userDetails.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Typography variant="h5" gutterBottom align="center">
              {userDetails.name}
            </Typography>
            <Chip 
              label={getRoleLabel(userDetails.role)} 
              color={userDetails.role === 'admin' ? 'error' : userDetails.role === 'hr' ? 'success' : userDetails.role === 'manager' ? 'primary' : 'warning'}
              sx={{ mb: 1 }}
            />
            {userDetails.status && (
              <Chip 
                label={userDetails.status === 'active' ? 'Active' : 'Inactive'} 
                color={userDetails.status === 'active' ? 'success' : 'default'}
                variant="outlined"
              />
            )}
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" gutterBottom>
                {userDetails.role === 'admin' ? 'Administrator Profile' : 
                 userDetails.role === 'hr' ? 'HR Manager Profile' :
                 userDetails.role === 'manager' ? 'Project Manager Profile' :
                 'Developer Profile'}
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary="Email" secondary={userDetails.email} />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BadgeIcon />
                </ListItemIcon>
                <ListItemText primary="Role" secondary={getRoleLabel(userDetails.role)} />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Department" 
                  secondary={department ? department.departmentName : 'Not Assigned'}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profile; 