import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/authService';
import YoungEmeritusLogo from '../components/YoungEmeritusLogo';

export default function SecureLogin() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email if "Remember me" was previously checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Checking authentication...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(AuthService.getPasswordStrength(pwd));
  };

  const getPasswordStrengthLabel = () => {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong', 'Excellent'];
    return labels[passwordStrength] || '';
  };

  const getPasswordStrengthColor = () => {
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#16a34a'];
    return colors[passwordStrength] || '#94a3b8';
  };

  async function handleLogin(e) {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!email.trim()) {
      setMessage('Email is required');
      return;
    }

    if (!password) {
      setMessage('Password is required');
      return;
    }

    setLoading(true);

    try {
      // Call auth service
      const result = await AuthService.login(email.trim(), password);

      if (result.success) {
        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email.trim());
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Login via context
        login(result);
      }
    } catch (error) {
      setMessage(error.message || 'Login failed. Please try again.');
      // Clear password on error for security
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingTop: '20px' }}>
      <div
        style={{
          textAlign: 'center',
          marginBottom: '32px',
          background:
            'linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(124, 58, 237, 0.1) 50%, rgba(6, 182, 212, 0.1) 100%)',
          padding: '32px 20px',
          borderRadius: '16px',
        }}
      >
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <YoungEmeritusLogo size={80} />
        </div>
        <h1
          style={{
            background: 'linear-gradient(135deg, #d946ef 0%, #7c3aed 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0 0 8px 0',
            fontSize: '36px',
            fontWeight: '700',
          }}
        >
          YoungEmeritus
        </h1>
        <p style={{ color: '#64748b', margin: '8px 0 0 0', fontSize: '13px', fontWeight: '600' }}>
          Learn. Build. Explore Tech.
        </p>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '12px' }}>
          Comprehensive Assessment Platform
        </p>
        <p style={{ color: '#9ca3af', margin: '12px 0 0 0', fontSize: '11px', fontStyle: 'italic' }}>
          🔐 Secure Login
        </p>
      </div>

      <form onSubmit={handleLogin} className="card" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {/* Email Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontWeight: '600', fontSize: '14px' }}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            style={{
              marginTop: '6px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '14px'
            }}
            disabled={loading}
          />
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontWeight: '600', fontSize: '14px' }}>Password</label>
          <div style={{ position: 'relative', marginTop: '6px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '10px 40px 10px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#94a3b8'
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  height: '4px',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  background: '#e2e8f0'
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: i <= passwordStrength ? getPasswordStrengthColor() : '#e2e8f0',
                      transition: 'background 0.2s'
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: '12px', color: getPasswordStrengthColor(), marginTop: '4px' }}>
                Strength: {getPasswordStrengthLabel()}
              </div>
            </div>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: '6px', cursor: 'pointer' }}
              disabled={loading}
            />
            Remember me
          </label>
          <a href="#forgot-password" style={{ fontSize: '13px', color: '#7c3aed', textDecoration: 'none' }}>
            Forgot password?
          </a>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          style={{
            width: '100%',
            marginBottom: '12px',
            padding: '12px',
            background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #d946ef 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {loading ? '🔄 Signing in...' : '🔒 Sign In Securely'}
        </button>

        {/* Sign Up Link */}
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          Don't have an account?{' '}
          <a href="/signup" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: '600' }}>
            Sign Up
          </a>
        </div>
      </form>

      {/* Error/Success Message */}
      {message && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: message.includes('failed') || message.includes('required') || message.includes('attempts') ? '#fee2e2' : '#d1fae5',
            color: message.includes('failed') || message.includes('required') || message.includes('attempts') ? '#991b1b' : '#065f46',
            borderRadius: '8px',
            fontSize: '13px',
            border: `1px solid ${message.includes('failed') || message.includes('required') || message.includes('attempts') ? '#fecaca' : '#a7f3d0'}`
          }}
        >
          {message.includes('failed') || message.includes('required') || message.includes('attempts') ? '❌ ' : '✅ '}
          {message}
        </div>
      )}

      {/* Security Info */}
      <div style={{ marginTop: '20px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '8px', fontSize: '12px', color: '#0369a1', borderLeft: '4px solid #0284c7' }}>
        🔒 <strong>Security:</strong> Your credentials are encrypted in transit. Never share your password.
      </div>
    </div>
  );
}
