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
      const user = await api.post('/api/auth/login', { email, password });
      login(user);
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
          </div>

          <div className="card" style={{paddingTop: '0'}}>
            <a href="http://localhost:5000/api/auth/google" style={{ textDecoration: 'none' }}>
                <button type="button" style={{
                    width: '100%',
                    background: '#fff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '16px'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
                    <span>Sign in with Google</span>
                </button>
            </a>
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase' }}>
                Or with email
            </div>
          </div>
          <form onSubmit={handleLogin} className="card" style={{marginTop: '0'}}>
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
