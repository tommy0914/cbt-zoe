import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import YoungEmeritusLogo from '../components/YoungEmeritusLogo';

export default function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return <div className="card">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMsg(null);
    if (!email || !password) return setMsg('Email and password are required');
    setLoading(true);
    try {
      const authData = await api.post('/api/auth/login', { email, password });
      if (authData.token) {
        login(authData);
      } else {
        setMsg(authData.message || 'Login failed: no token received');
      }
    } catch (err) {
      setMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <>
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
              👥 For Students, Teachers & Admins
            </p>
          </div>

          <form onSubmit={handleLogin} className="card">
            <div style={{ marginBottom: '16px' }}>
              <label>Email Address</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginBottom: '12px',
                background: 'linear-gradient(135deg, #d946ef 0%, #7c3aed 100%)',
                border: 'none',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '13px' }}>
                Don't have an account? <Link to="/signup">Sign Up</Link>
            </div>
          </form>
          {msg ? (
            <div
              style={{
                color: '#ef4444',
                marginTop: '12px',
                padding: '12px',
                background: '#fee2e2',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              {msg}
            </div>
          ) : null}
        </>
    </div>
  );
}
