// cbt-software/frontend/cbt-admin-frontend/src/components/SchoolDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const SchoolDashboard = () => {
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [schoolName, setSchoolName] = useState('');
  const [adminId, setAdminId] = useState('');

  useEffect(() => {
    // Fetch schools
    const fetchSchools = async () => {
      try {
        const schoolsRes = await api.get('/schools');
        setSchools(schoolsRes);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    // Fetch users
    const fetchUsers = async () => {
      try {
        const usersRes = await api.get('/users');
        setUsers(usersRes);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/schools', { name: schoolName, adminId });
      setSchools([...schools, res]);
      setSchoolName('');
      setAdminId('');
    } catch (error) {
      console.error('Error creating school:', error);
    }
  };

  return (
    <div>
      <h2>School Dashboard</h2>
      <form onSubmit={handleCreateSchool}>
        <h3>Create New School</h3>
        <input
          type="text"
          placeholder="School Name"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          required
        />
        <select value={adminId} onChange={(e) => setAdminId(e.target.value)} required>
          <option value="">Select Admin</option>
          {users
            .filter((user) => user.role === 'admin')
            .map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
        </select>
        <button type="submit">Create School</button>
      </form>
      <hr />
      <h3>Existing Schools</h3>
      <ul>
        {schools.map((school) => (
          <li key={school._id}>
            {school.name} (Admin: {school.admin.name})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SchoolDashboard;
