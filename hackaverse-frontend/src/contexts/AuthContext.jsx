/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AUTH_TOKEN_KEY, USER_DATA_KEY } from '../constants/appConstants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiService.auth.login({ email, password });
      
      // Backend wraps responses in APIResponse envelope: {success, message, data: {...}, trace_id}
      // The actual payload (access_token, refresh_token, user) is inside response.data.data
      const payload = response.data?.data || response.data;
      const { access_token, refresh_token, user } = payload;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }

      // Store tokens and user data
      localStorage.setItem(AUTH_TOKEN_KEY, access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      // Add avatar if not present
      const userData = {
        ...user,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`
      };
      
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.detail || error.message || 'Login failed');
    }
  };

  const signup = async (name, email, password, role = 'participant') => {
    try {
      const response = await apiService.auth.register({ 
        name, 
        email, 
        password,
        role
      });
      
      // Backend wraps responses in APIResponse envelope: {success, message, data: {...}, trace_id}
      const payload = response.data?.data || response.data;
      const { access_token, refresh_token, user } = payload;
      
      if (!access_token) {
        throw new Error('No access token received from server');
      }

      // Store tokens and user data
      localStorage.setItem(AUTH_TOKEN_KEY, access_token);
      localStorage.setItem('refreshToken', refresh_token);
      
      // Add avatar if not present
      const userData = {
        ...user,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`
      };
      
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.detail || error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiService.auth.logout();
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    }
    
    // Clear local storage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(USER_DATA_KEY);
    
    setUser(null);
    setIsAuthenticated(false);
    
    // Navigate to home page after logout
    window.location.href = '/';
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Note: use named exports to keep the module shape predictable.