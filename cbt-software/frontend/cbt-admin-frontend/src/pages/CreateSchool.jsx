import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CreateSchool() {
  const { user, login } = useAuth();
  const [name, setName] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!name.trim()) {
      setMsg('School name is required');
      return;
    }

    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('auth'))?.token;
      const res = await api.post('/api/schools/create-direct', { name: name.trim() }, token);
      if (res.school) {
        // update auth context with the new user info returned from server
        login({ user: res.user, token });
        setMsg('School created successfully!');
      } else {
        setMsg(res.message || 'Failed to create school');
      }
    } catch (err) {
      setMsg(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '480px', margin: '40px auto' }}>
      <h3>Create Your School</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginTop: 8 }}>
          <label>School Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter school name"
            required
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating...' : 'Create School'}
          </button>
        </div>
        {msg && <div style={{ marginTop: 8, color: msg.includes('success') ? 'green' : 'red' }}>{msg}</div>}
      </form>
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <p>Once your school is created, you'll automatically be its admin.</p>
      </div>
    </div>
  );
}
