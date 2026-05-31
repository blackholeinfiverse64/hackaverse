/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

const buildUserData = (user) => ({
  ...user,
  avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const establishSession = useCallback((access_token, refresh_token, userPayload) => {
    if (!access_token) {
      throw new Error('No access token received from server');
    }

    localStorage.setItem(AUTH_TOKEN_KEY, access_token);
    if (refresh_token) {
      localStorage.setItem('refreshToken', refresh_token);
    }

    const userData = buildUserData(userPayload);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  }, []);

  // Initialize auth: refresh role from server when token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiService.auth.getMe();
        const payload = response.data?.data || response.data;
        if (payload?.role) {
          establishSession(token, localStorage.getItem('refreshToken'), payload);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.warn('[Auth] /auth/me failed, falling back to localStorage:', error.message);
      }

      const userData = localStorage.getItem(USER_DATA_KEY);
      if (userData) {
        try {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(USER_DATA_KEY);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [establishSession]);

  const login = async (email, password) => {
    try {
      const response = await apiService.auth.login({ email, password });
      const payload = response.data?.data || response.data;
      const { access_token, refresh_token, user: userPayload } = payload;
      const userData = establishSession(access_token, refresh_token, userPayload);
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
        role,
      });
      const payload = response.data?.data || response.data;
      const { access_token, refresh_token, user: userPayload } = payload;
      const userData = establishSession(access_token, refresh_token, userPayload);
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
      console.error('Logout API error:', error);
    }

    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(USER_DATA_KEY);

    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    establishSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
