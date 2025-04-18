import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Set axios default headers and interceptors
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Add response interceptor to catch expired tokens (401 errors)
      const interceptor = axios.interceptors.response.use(
        response => response,
        error => {
          // Check if the error is due to an expired token
          if (error.response && error.response.status === 401) {
            console.log('Session expired or unauthorized');
            handleSessionExpired();
          }
          return Promise.reject(error);
        }
      );
      
      // Cleanup interceptor on unmount
      return () => {
        axios.interceptors.response.eject(interceptor);
      };
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Handle session expiration
  const handleSessionExpired = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSessionExpired(true);
  };

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/users/me');
          console.log('User data loaded:', res.data);
          if (res.data.data) {
            setUser(res.data.data);
            // Reset session expired flag when successfully loaded user
            setSessionExpired(false);
          } else {
            setUser(res.data);
          }
        } catch (err) {
          console.error('Error loading user:', err);
          // Check if the error is due to an expired token
          if (err.response && err.response.status === 401) {
            handleSessionExpired();
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Login user
  const login = async (email, password) => {
    try {
      console.log('Logging in with:', { email, password });
      const res = await axios.post('/api/users/login', { email, password });
      console.log('Login response:', res.data);

      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
        setSessionExpired(false);
        return { success: true };
      } else {
        return {
          success: false,
          error: res.data.error || 'Login failed'
        };
      }
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        error: err.response?.data?.error || err.response?.data?.message || 'Login failed'
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isHR = () => {
    return user && user.role === 'hr';
  };

  const isManager = () => {
    return user && user.role === 'manager';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin,
        isHR,
        isManager,
        sessionExpired,
        resetSessionExpired: () => setSessionExpired(false)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};