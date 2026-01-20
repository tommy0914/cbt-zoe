import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const auth = localStorage.getItem('auth');
      if (auth) {
        const { user, token } = JSON.parse(auth);
        if (user && token) {
          setUser(user);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Failed to parse auth from localStorage', error);
      localStorage.removeItem('auth');
    }
    setIsLoading(false);
  }, []);

  const login = (authData) => {
    localStorage.setItem('auth', JSON.stringify(authData));
    setUser(authData.user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Still call the backend logout for any server-side session cleanup
      await api.post('/api/auth/logout'); 
    } catch (error) {
      console.error('Server logout failed:', error);
    } finally {
      // Always clear client-side auth state
      localStorage.removeItem('auth');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};