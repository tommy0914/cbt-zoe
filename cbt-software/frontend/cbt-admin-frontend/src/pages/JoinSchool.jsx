import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function JoinSchool() {
  const { user, login } = useAuth(); // Assuming login updates the user context
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    setLoading(true);
    try {
      const data = await api.get('/api/schools');
      setSchools(data.schools || []);
    } catch (err) {
      setMsg(err.message || 'Failed to fetch schools');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinSchool(schoolId) {
    setMsg(null);
    try {
      const updatedUser = await api.post(`/api/schools/${schoolId}/join`);
      login(updatedUser); // Update the user in the context
      setMsg(`Successfully joined school!`);
    } catch (err) {
      setMsg(err.message || 'Failed to join school.');
    }
  }

  const userSchoolIds = user.schools.map(s => s.schoolId);

  return (
    <div className="card">
      <h2>Join a School</h2>
      <p>Select a school from the list below to become a member.</p>
      {loading && <p>Loading schools...</p>}
      {msg && <div style={{ color: msg.includes('Successfully') ? 'green' : 'red', marginBottom: '1rem' }}>{msg}</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {schools.map(school => (
          <li key={school._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            <span>{school.name}</span>
            {userSchoolIds.includes(school._id) ? (
              <button disabled>Already a member</button>
            ) : (
              <button onClick={() => handleJoinSchool(school._id)}>Join</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
