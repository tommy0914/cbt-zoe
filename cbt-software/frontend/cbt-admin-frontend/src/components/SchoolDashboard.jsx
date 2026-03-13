// cbt-software/frontend/cbt-admin-frontend/src/components/SchoolDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import UserSearch from './UserSearch';

const SchoolDashboard = () => {
  const token = JSON.parse(localStorage.getItem('auth'))?.token;
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [schoolName, setSchoolName] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    // Fetch schools
    const fetchSchools = async () => {
      try {
        const schoolsRes = await api.get('/api/schools', token);
        if (schoolsRes.schools) {
          setSchools(schoolsRes.schools);
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };
    if (token) fetchSchools();
  }, [token]);

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!adminId) return alert('Please search and select an admin for the school.');
    
    try {
      const res = await api.post('/api/schools', { name: schoolName, adminId }, token);
      if (res) {
        setSchools([...schools, res]);
        setSchoolName('');
        setAdminId('');
        setAdminName('');
        alert('School created successfully!');
      }
    } catch (error) {
      console.error('Error creating school:', error);
      alert('Failed to create school');
    }
  };

  const manageSchool = (schoolId) => {
    // Navigate to admin dashboard and pass the school ID in state
    navigate('/admin', { state: { schoolId } });
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>🏫 SuperAdmin School Engine</h2>
      <hr />
      
      <form onSubmit={handleCreateSchool} className="card" style={{ background: '#f8fafc', marginBottom: '20px' }}>
        <h3>➕ Create New School</h3>
        <div style={{ marginBottom: '15px' }}>
          <label>School Name *</label>
          <input
            type="text"
            placeholder="e.g. Springfield High"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Assign Chief Administrator *</label>
          <div style={{ padding: '10px', background: 'white', border: '1px solid #ccc', borderRadius: '4px' }}>
            {adminId ? (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span>✅ Selected Admin: <strong>{adminName}</strong></span>
                 <button type="button" onClick={() => { setAdminId(''); setAdminName(''); }} style={{ padding: '4px 8px', background: '#e2e8f0', color: '#0f172a' }}>Change</button>
               </div>
            ) : (
               <UserSearch 
                 token={token} 
                 placeholder="Search user by email to make them Admin..." 
                 onSelect={(u) => { setAdminId(u._id); setAdminName(u.username || u.name || u.email); }} 
               />
            )}
          </div>
          <small style={{ color: '#64748b' }}>The selected user will be promoted to the role 'admin' and assigned natively to this new school's DB connection.</small>
        </div>

        <button type="submit" style={{ width: '100%', fontWeight: 'bold' }}>Create School Infrastructure</button>
      </form>
      
      <h3>📚 Monitored Schools</h3>
      {schools.length === 0 ? (
        <p className="muted">No schools exist yet in the global registry.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {schools.map((school) => (
            <div key={school._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f1f5f9', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
              <div>
                <strong style={{ fontSize: '1.1rem' }}>{school.name.toUpperCase()}</strong>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  School ID / DB Reference: {school._id}
                </div>
              </div>
              <button onClick={() => manageSchool(school._id)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold' }}>
                Manage School ➜
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchoolDashboard;
