import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Appraisals from './pages/Appraisals';
import AppraisalDetail from './pages/AppraisalDetail';
import Training from './pages/Training';
import Goals from './pages/Goals';
import Departments from './pages/Departments';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import { Snackbar, Alert } from '@mui/material';
import { useState, useEffect } from 'react';

// Protected Route component with role-based access control
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If there are required roles and the user's role is not in the list
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Session expiration handler component
const SessionHandler = () => {
  const { sessionExpired, resetSessionExpired } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionExpired) {
      setOpen(true);
      // Redirect to login after showing the message
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionExpired, navigate]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    resetSessionExpired();
  };

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={3000} 
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
        Your session has expired. Please login again.
      </Alert>
    </Snackbar>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <SessionHandler />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes with role-based access */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRoles={['admin', 'hr']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appraisals"
            element={
              <ProtectedRoute>
                <Appraisals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appraisals/:id"
            element={
              <ProtectedRoute>
                <AppraisalDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training"
            element={
              <ProtectedRoute>
                <Training />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <Goals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
