import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function SchoolCalendar({ token }) {
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [token]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const sessData = await api.get('/api/calendar/sessions', token);
      setSessions(sessData || []);
      const currData = await api.get('/api/calendar/current', token);
      setCurrent(currData);
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!newSessionName) return alert('Enter session name (e.g. 2025/2026)');
    try {
      await api.post('/api/calendar/session', { name: newSessionName }, token);
      setNewSessionName('');
      setMessage('New session created with 3 terms.');
      fetchCalendarData();
    } catch (err) {
      alert(err.message || 'Failed to create session');
    }
  };

  const openTerm = async (termId) => {
    try {
      await api.put(`/api/calendar/term/${termId}/open`, {}, token);
      setMessage('Term opened and set as current.');
      fetchCalendarData();
    } catch (err) {
      alert(err.message || 'Failed to open term');
    }
  };

  const closeTerm = async (termId) => {
    try {
      await api.put(`/api/calendar/term/${termId}/close`, {}, token);
      setMessage('Term closed successfully.');
      fetchCalendarData();
    } catch (err) {
      alert(err.message || 'Failed to close term');
    }
  };

  const activateSession = async (sessionId) => {
    try {
      await api.put(`/api/calendar/session/${sessionId}/activate`, {}, token);
      setMessage('Session activated.');
      fetchCalendarData();
    } catch (err) {
      alert(err.message || 'Failed to activate session');
    }
  };

  if (loading && sessions.length === 0) return <div>Loading calendar...</div>;

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h3>📅 School Academic Calendar (Nigerian Schedule)</h3>
      
      {current ? (
        <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bae6fd' }}>
          <strong>Current Active Period:</strong>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0369a1', marginTop: '5px' }}>
            {current.session.name} - {current.currentTerm?.name} TERM
          </div>
          <div style={{ marginTop: '5px' }}>
            Status: <span style={{ color: current.currentTerm?.isOpen ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
              {current.currentTerm?.isOpen ? '🟢 OPEN (Active)' : '🔴 CLOSED'}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ padding: '15px', background: '#fef2f2', borderRadius: '8px', marginBottom: '20px' }}>
          No active session found. Please create or activate a session.
        </div>
      )}

      {message && <div style={{ padding: '10px', background: '#f0fdf4', color: '#16a34a', borderRadius: '4px', marginBottom: '15px' }}>{message}</div>}

      <div style={{ marginBottom: '25px', display: 'flex', gap: '10px' }}>
        <input 
          placeholder="New Session (e.g. 2026/2027)" 
          value={newSessionName} 
          onChange={e => setNewSessionName(e.target.value)}
          style={{ flex: 1, padding: '10px' }}
        />
        <button onClick={createSession} style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
          Create Session
        </button>
      </div>

      <h4>All Sessions</h4>
      {sessions.map(sess => (
        <div key={sess.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h5 style={{ margin: 0, fontSize: '18px' }}>Session: {sess.name}</h5>
            {!sess.isActive && (
              <button onClick={() => activateSession(sess.id)} style={{ fontSize: '12px', background: '#f3f4f6', padding: '4px 10px', borderRadius: '4px' }}>
                Activate This Session
              </button>
            )}
            {sess.isActive && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold' }}>ACTIVE SESSION</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {sess.terms.map(term => (
              <div key={term.id} style={{ padding: '10px', background: term.isCurrent ? '#f8fafc' : 'white', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{term.name} TERM</div>
                <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                  {term.isOpen ? '🟢 Open' : '🔴 Closed'}
                </div>
                {term.isOpen ? (
                  <button onClick={() => closeTerm(term.id)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', width: '100%' }}>
                    Close Term
                  </button>
                ) : (
                  <button onClick={() => openTerm(term.id)} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', width: '100%' }}>
                    Open Term
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
