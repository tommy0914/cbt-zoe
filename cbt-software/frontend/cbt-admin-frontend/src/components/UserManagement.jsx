import React, { useState } from 'react';
import api from '../services/api';

export default function UserManagement({ token }) {
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherDepartment, setTeacherDepartment] = useState('');
  const [teacherStaffId, setTeacherStaffId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentMatricNumber, setStudentMatricNumber] = useState('');
  const [studentLevel, setStudentLevel] = useState('');
  const [message, setMessage] = useState('');

  async function createTeacher(e) {
    e.preventDefault();
    try {
      const res = await api.post('/api/admin/teachers', {
        name: teacherName,
        email: teacherEmail,
        department: teacherDepartment,
        staffId: teacherStaffId,
      }, token);
      setMessage(res.message || 'Teacher created successfully');
      setTeacherName('');
      setTeacherEmail('');
      setTeacherDepartment('');
      setTeacherStaffId('');
    } catch (err) {
      setMessage(err.message || 'Failed to create teacher');
    }
  }

  async function createStudent(e) {
    e.preventDefault();
    try {
      const res = await api.post('/api/admin/students', {
        name: studentName,
        email: studentEmail,
        matricNumber: studentMatricNumber,
        level: studentLevel,
      }, token);
      setMessage(res.message || 'Student created successfully');
      setStudentName('');
      setStudentEmail('');
      setStudentMatricNumber('');
      setStudentLevel('');
    } catch (err) {
      setMessage(err.message || 'Failed to create student');
    }
  }

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h4>User Management</h4>
      {message && <div style={{ color: 'green', marginBottom: 10 }}>{message}</div>}
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h5>Create Teacher</h5>
          <form onSubmit={createTeacher}>
            <div>
              <label>Name</label>
              <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} required />
            </div>
            <div>
              <label>Department</label>
              <input type="text" value={teacherDepartment} onChange={(e) => setTeacherDepartment(e.target.value)} required />
            </div>
            <div>
              <label>Staff ID</label>
              <input type="text" value={teacherStaffId} onChange={(e) => setTeacherStaffId(e.target.value)} required />
            </div>
            <button type="submit">Create Teacher</button>
          </form>
        </div>
        <div style={{ flex: 1 }}>
          <h5>Create Student</h5>
          <form onSubmit={createStudent}>
            <div>
              <label>Name</label>
              <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
            </div>
            <div>
              <label>Matric Number</label>
              <input type="text" value={studentMatricNumber} onChange={(e) => setStudentMatricNumber(e.target.value)} required />
            </div>
            <div>
              <label>Level</label>
              <input type="text" value={studentLevel} onChange={(e) => setStudentLevel(e.target.value)} required />
            </div>
            <button type="submit">Create Student</button>
          </form>
        </div>
      </div>
    </div>
  );
}
