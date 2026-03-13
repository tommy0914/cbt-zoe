import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AttendanceTracker({ classId, token }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (classId) {
      fetchClassMembers();
    }
  }, [classId]);

  useEffect(() => {
    if (classId && members.length > 0) {
      fetchAttendance();
    }
  }, [classId, date, members]);

  async function fetchClassMembers() {
    try {
      setLoading(true);
      const res = await api.get(`/api/classes/${classId}`, token);
      if (res.class && res.class.members) {
        setMembers(res.class.members);
      }
    } catch (err) {
      console.error('Failed to fetch class members', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAttendance() {
    try {
      setLoading(true);
      setMessage('');
      const res = await api.get(`/api/attendance/${classId}/${date}`, token);
      
      // Initialize state with fetched records or defaults to present
      const newAttendance = {};
      
      if (res.attendance && res.attendance.records && res.attendance.records.length > 0) {
        res.attendance.records.forEach(r => {
          newAttendance[r.studentId] = r.status;
        });
      }
      
      // If a student doesn't have a record yet, default them to 'present'
      members.forEach(memberId => {
        const idStr = typeof memberId === 'object' ? memberId._id : memberId;
        if (!newAttendance[idStr]) {
          newAttendance[idStr] = 'present';
        }
      });
      
      setAttendance(newAttendance);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = (studentId, status) => {
    setAttendance({ ...attendance, [studentId]: status });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      const records = Object.keys(attendance).map(studentId => ({
        studentId,
        status: attendance[studentId]
      }));

      await api.post(`/api/attendance/${classId}`, { date, records }, token);
      setMessage('Attendance saved successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && members.length === 0) return <div style={{ padding: '20px' }}>Loading students...</div>;

  return (
    <div className="card" style={{ marginTop: '20px', borderLeft: '4px solid #3b82f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: 0 }}>📅 Class Attendance</h4>
        <div>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Date:</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '15px', 
          backgroundColor: message.includes('Failed') ? '#fee2e2' : '#dcfce7',
          color: message.includes('Failed') ? '#ef4444' : '#16a34a',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {members.length === 0 ? (
        <p>No students are enrolled in this class yet.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>Student ID / Username</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Present</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Absent</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Late</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                const memberObj = typeof member === 'object' ? member : { _id: member, username: member };
                return (
                  <tr key={memberObj._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>{memberObj.username || memberObj._id}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input 
                        type="radio" 
                        name={`attendance-${memberObj._id}`} 
                        checked={attendance[memberObj._id] === 'present'} 
                        onChange={() => handleStatusChange(memberObj._id, 'present')}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer', accentColor: '#16a34a' }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input 
                        type="radio" 
                        name={`attendance-${memberObj._id}`} 
                        checked={attendance[memberObj._id] === 'absent'} 
                        onChange={() => handleStatusChange(memberObj._id, 'absent')}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer', accentColor: '#ef4444' }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input 
                        type="radio" 
                        name={`attendance-${memberObj._id}`} 
                        checked={attendance[memberObj._id] === 'late'} 
                        onChange={() => handleStatusChange(memberObj._id, 'late')}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer', accentColor: '#f59e0b' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={handleSave} 
              disabled={saving}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
