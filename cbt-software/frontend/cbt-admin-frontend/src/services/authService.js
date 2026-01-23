/**
 * Secure Authentication Service
 * Frontend API wrapper with:
 * - Token management
 * - Automatic token refresh
 * - Error handling
 * - Request retry logic
 */

import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 10000,
  withCredentials: true // Include cookies
});

class AuthService {
  /**
   * Set authorization header
   */
  static setAuthHeader(token) {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('accessToken', token);
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      localStorage.removeItem('accessToken');
    }
  }

  /**
   * Get current access token
   */
  static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Login with email and password
   */
  static async login(email, password) {
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (email.trim().length === 0) {
        throw new Error('Email cannot be empty');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Make login request
      const response = await apiClient.post('/api/auth/login', {
        email: email.toLowerCase(),
        password
      });

      // Handle successful login
      if (response.data.success && response.data.accessToken) {
        this.setAuthHeader(response.data.accessToken);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('tokenExpiry', Date.now() + (response.data.expiresIn * 1000));

        // Setup token refresh
        this.setupTokenRefresh(response.data.expiresIn);

        return {
          success: true,
          user: response.data.user,
          accessToken: response.data.accessToken
        };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      // Handle specific error types
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || error.response.statusText;
        
        if (error.response.status === 429) {
          throw new Error('Too many login attempts. Please try again later.');
        }
        
        throw new Error(message);
      } else if (error.request) {
        // Request made but no response
        throw new Error('Network error. Please check your connection.');
      } else {
        // Error in request setup
        throw error;
      }
    }
  }

  /**
   * Register new user
   */
  static async register(name, email, password, confirmPassword) {
    try {
      // Validate input
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('All fields are required');
      }

      if (name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Check password strength
      if (!this.isPasswordStrong(password)) {
        throw new Error('Password must include uppercase, lowercase, number, and special character');
      }

      // Make registration request
      const response = await apiClient.post('/api/auth/register', {
        name: name.trim(),
        email: email.toLowerCase(),
        password
      });

      if (response.data.success && response.data.accessToken) {
        this.setAuthHeader(response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('tokenExpiry', Date.now() + (response.data.expiresIn * 1000));

        this.setupTokenRefresh(response.data.expiresIn);

        return {
          success: true,
          user: response.data.user
        };
      }
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken() {
    try {
      const response = await apiClient.post('/api/auth/refresh', {
        // Refresh token is automatically sent in cookies
      });

      if (response.data.success && response.data.accessToken) {
        this.setAuthHeader(response.data.accessToken);
        localStorage.setItem('tokenExpiry', Date.now() + (response.data.expiresIn * 1000));

        this.setupTokenRefresh(response.data.expiresIn);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Setup automatic token refresh
   */
  static setupTokenRefresh(expiresInSeconds) {
    // Clear any existing timers
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token 1 minute before expiry (or after 13 minutes for 15-min tokens)
    const refreshTimeMs = Math.max((expiresInSeconds - 60) * 1000, 0);

    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshTimeMs);
  }

  /**
   * Logout
   */
  static async logout() {
    try {
      // Clear timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
      }

      // Call logout endpoint
      try {
        await apiClient.post('/api/auth/logout');
      } catch (error) {
        // Continue with logout even if request fails
        console.error('Logout request failed:', error);
      }

      // Clear storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');

      // Clear auth header
      delete apiClient.defaults.headers.common['Authorization'];

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      return { success: false };
    }
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('All password fields are required');
      }

      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (currentPassword === newPassword) {
        throw new Error('New password must be different');
      }

      const response = await apiClient.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  /**
   * Verify token validity
   */
  static async verifyToken(token) {
    try {
      const response = await apiClient.post('/api/auth/verify-token', { token });
      return response.data.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated() {
    const token = this.getAccessToken();
    return !!token;
  }

  /**
   * Get stored user
   */
  static getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired() {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return true;
    return Date.now() >= parseInt(expiry);
  }

  /**
   * Validate password strength
   * Requirements: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
   */
  static isPasswordStrong(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }

  /**
   * Get password strength score
   */
  static getPasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    return score;
  }
}

// Interceptor for handling token expiry
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const success = await AuthService.refreshToken();

        if (success) {
          // Retry original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        AuthService.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default AuthService;
