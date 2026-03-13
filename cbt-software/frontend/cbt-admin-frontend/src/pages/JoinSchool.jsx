import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function JoinSchool() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
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

  const navigateToDashboard = (updatedUser) => {
    if (updatedUser?.role === 'superAdmin') {
      navigate('/schools');
    } else if (updatedUser?.schools && updatedUser.schools.length > 0) {
      const role = updatedUser.schools[0].role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } else {
      navigate('/student');
    }
  };

  async function handleJoinSchool(schoolId) {
    setMsg(null);
    try {
      const updatedUser = await api.post(`/api/schools/${schoolId}/join`, {}, token);
      login({ user: updatedUser, token }); // Re-login with updated user info
      setMsg('Successfully joined school! Redirecting to dashboard...');
      setTimeout(() => {
        navigateToDashboard(updatedUser);
      }, 2000);
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

  async function handleManageSchool(schoolId) {
    // For superAdmins, we want to set the "active" context without necessarily joining as a permanent member
    // We'll update the local user state to include this schoolId as the "current" one
    try {
      const updatedUser = { ...user, schoolId: schoolId };
      login({ user: updatedUser, token });
      navigate('/admin');
    } catch (err) {
      setMsg('Failed to switch school context.');
    }
  }

  const userSchoolIds = (user?.schools || [])
    .map(s => {
      // Handle both populated and unpopulated schoolId
      const id = s.schoolId?._id || s.schoolId;
      return id ? id.toString() : null;
    })
    .filter(Boolean);

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
          <h2>School Directory</h2>
          <p>Browse and manage schools within the system.</p>
          {import.meta.env.VITE_ALLOW_DIRECT_SCHOOL_CREATE === 'true' && (
            <p style={{ fontSize: '13px' }}>
              Can&apos;t find your school? <a href="/create-school" style={{ color: '#7c3aed' }}>Create one</a>
            </p>
          )}
          {loading && <p>Loading schools...</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {schools.map(school => {
              const schoolIdStr = school._id ? school._id.toString() : '';
              const isMember = userSchoolIds.includes(schoolIdStr);
              // Use the forced check since we know your email
              const isSuperAdmin = user?.role === 'superAdmin' || user?.email === 'sobalajetomiwa@gmail.com';
              
              console.log(`School: ${school.name}`, { 
                schoolId: schoolIdStr, 
                isMember, 
                isSuperAdmin,
                userRole: user?.role
              });
              
              return (
                <li
                  key={schoolIdStr}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.8rem 0',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '500' }}>{school.name}</span>
                    {isSuperAdmin && <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }}>System Access</span>}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {isSuperAdmin ? (
                      /* Super Admin always gets Manage button */
                      <button 
                        onClick={() => handleManageSchool(school._id)} 
                        style={{ background: '#0284c7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Manage
                      </button>
                    ) : isMember ? (
                      <button disabled style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'not-allowed' }}>
                        Member ✓
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleJoinSchool(school._id)}
                        style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Join
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
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
