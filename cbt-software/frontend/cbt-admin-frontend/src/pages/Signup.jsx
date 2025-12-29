import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Signup() {
  const { isAuthenticated, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await api.post('/api/auth/register', { name, email, password });
      login(user); // Update the auth context
    } catch (err) {
      setError(err.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="card" style={{ maxWidth: '480px', margin: '40px auto' }}>
      <h3>Create an Account</h3>
      <form onSubmit={handleSignup}>
        <div style={{ marginTop: 8 }}>
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </div>
        {error && <div style={{ marginTop: 8, color: 'red' }}>{error}</div>}
      </form>
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
