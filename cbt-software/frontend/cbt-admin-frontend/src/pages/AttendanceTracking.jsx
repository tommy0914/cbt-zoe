import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AttendanceTracking({ classId }) {
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchClassDetails();
    fetchAttendance();
  }, [classId, date]);

  const fetchClassDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/classrooms/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.members || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching class details:', err);
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/attendance/${classId}?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        const existingRecords = {};
        res.data.records.forEach(r => {
          existingRecords[r.studentId] = r.status;
        });
        setRecords(existingRecords);
      } else {
        setRecords({});
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const attendanceData = {
        date,
        records: students.map(s => ({
          studentId: s.id,
          status: records[s.id] || 'present'
        }))
      };
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/attendance/${classId}`, attendanceData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Attendance saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving attendance:', err);
      setMessage('Failed to save attendance.');
    }
  };

  if (loading) return <div>Loading class data...</div>;

  return (
    <div className="attendance-tracking-page">
      <h2>Attendance Tracking</h2>
      <div className="controls" style={{ marginBottom: '20px' }}>
        <label>Date: </label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={saveAttendance} style={{ marginLeft: '10px' }}>Save Attendance</button>
      </div>

      {message && <div style={{ color: 'green', marginBottom: '10px' }}>{message}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Student Name</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Present</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Absent</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Late</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>{student.name}</td>
              <td style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>
                <input 
                  type="radio" 
                  name={`status-${student.id}`} 
                  checked={records[student.id] === 'present' || !records[student.id]} 
                  onChange={() => handleStatusChange(student.id, 'present')} 
                />
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>
                <input 
                  type="radio" 
                  name={`status-${student.id}`} 
                  checked={records[student.id] === 'absent'} 
                  onChange={() => handleStatusChange(student.id, 'absent')} 
                />
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>
                <input 
                  type="radio" 
                  name={`status-${student.id}`} 
                  checked={records[student.id] === 'late'} 
                  onChange={() => handleStatusChange(student.id, 'late')} 
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
