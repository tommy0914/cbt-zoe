import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimer = useRef(null);

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

  // Inactivity tracking logic
  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        console.warn('Auto-logging out due to inactivity');
        logout();
      }, INACTIVITY_LIMIT);
    };

    // Events to watch
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Initialize timer
    resetTimer();

    // Add listeners
    events.forEach(event => document.addEventListener(event, resetTimer));

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated]);

  const login = (authData) => {
    localStorage.setItem('auth', JSON.stringify(authData));
    setUser(authData.user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Still call the backend logout for any server-side session cleanup
      const auth = JSON.parse(localStorage.getItem('auth'));
      if (auth?.token) {
        await api.post('/api/auth/logout', {}, auth.token); 
      }
    } catch (error) {
      console.error('Server logout failed:', error);
    } finally {
      // Always clear client-side auth state
      localStorage.removeItem('auth');
      setUser(null);
      setIsAuthenticated(false);
      // Redirect to landing page
      window.location.href = '/';
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