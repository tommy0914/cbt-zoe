import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function JoinSchool() {
  const { user, login } = useAuth();
  const [schools, setSchools] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [view, setView] = useState('schools'); // 'schools' or 'classes'
  const token = JSON.parse(localStorage.getItem('auth'))?.token;

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    setLoading(true);
    try {
      const data = await api.get('/api/schools', token);
      setSchools(data.schools || []);
    } catch (err) {
      setMsg(err.message || 'Failed to fetch schools');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailableClasses() {
    setLoading(true);
    try {
      const data = await api.get('/api/enrollment/available-classes', token);
      setAvailableClasses(data.availableClasses || []);
      setView('classes');
    } catch (err) {
      setMsg(err.message || 'Failed to fetch available classes');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinSchool(schoolId) {
    setMsg(null);
    try {
      const updatedUser = await api.post(`/api/schools/${schoolId}/join`, {}, token);
      login(updatedUser);
      setMsg('Successfully joined school!');
      setTimeout(() => {
        setMsg(null);
        fetchAvailableClasses();
      }, 1500);
    } catch (err) {
      setMsg(err.message || 'Failed to join school.');
    }
  }

  async function handleRequestEnrollment(classId) {
    setMsg(null);
    try {
      await api.post('/api/enrollment/request', { classId }, token);
      setMsg('Enrollment request submitted! Awaiting approval.');
      setTimeout(() => {
        fetchAvailableClasses();
      }, 1500);
    } catch (err) {
      setMsg(err.message || 'Failed to request enrollment.');
    }
  }

  const userSchoolIds = user?.schools?.map(s => s.schoolId) || [];

  return (
    <div>
      {msg && (
        <div
          style={{
            color: msg.includes('Successfully') || msg.includes('submitted') ? 'green' : 'red',
            marginBottom: '1rem',
            padding: '12px',
            background: msg.includes('Successfully') || msg.includes('submitted') ? '#dcfce7' : '#fee2e2',
            borderRadius: '8px',
          }}
        >
          {msg}
        </div>
      )}

      {view === 'schools' ? (
        <div className="card">
          <h2>Join a School</h2>
          <p>Select a school from the list below to become a member.</p>
          {loading && <p>Loading schools...</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {schools.map(school => (
              <li
                key={school._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span>{school.name}</span>
                {userSchoolIds.includes(school._id) ? (
                  <button disabled>Already a member</button>
                ) : (
                  <button onClick={() => handleJoinSchool(school._id)}>Join</button>
                )}
              </li>
            ))}
          </ul>
          {userSchoolIds.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <button onClick={fetchAvailableClasses} style={{ background: '#7c3aed' }}>
                View Available Classes
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h2>Available Classes</h2>
          <button onClick={() => setView('schools')} style={{ marginBottom: '12px', background: '#666' }}>
            ← Back to Schools
          </button>
          {loading && <p>Loading classes...</p>}
          {availableClasses.length === 0 ? (
            <p>No available classes at this time.</p>
          ) : (
            <div>
              <p style={{ color: '#666', fontSize: '12px' }}>Click on a class to request enrollment:</p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {availableClasses.map(cls => (
                  <li
                    key={cls._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      marginBottom: '8px',
                      background: '#f5f3ff',
                      borderRadius: '8px',
                      border: '1px solid #e0d5ff',
                    }}
                  >
                    <div>
                      <strong>{cls.name}</strong>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Subjects: {cls.subjects.join(', ') || 'None'}
                      </div>
                    </div>
                    <button onClick={() => handleRequestEnrollment(cls._id)} style={{ background: '#06b6d4' }}>
                      Request
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
