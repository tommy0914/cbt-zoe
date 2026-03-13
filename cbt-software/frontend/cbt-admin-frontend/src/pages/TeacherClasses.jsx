import React, { useEffect, useState, lazy, Suspense } from 'react'
import api from '../services/api'
import UserSearch from '../components/UserSearch'
import Announcements from '../components/Announcements'
import Leaderboard from '../components/Leaderboard'
import ExportResults from '../components/ExportResults'
import AnalyticsDashboard from '../components/AnalyticsDashboard'

import StudentResults from '../components/StudentResults'
import TestBuilder from '../components/TestBuilder'
import AttendanceTracker from '../components/AttendanceTracker'

// Lazy load
const QuestionForm = lazy(() => import('../components/QuestionForm'));

export default function TeacherClasses() {
  const token = JSON.parse(localStorage.getItem('auth'))?.token;
  const user = JSON.parse(localStorage.getItem('auth'))?.user;
  
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [enrollmentRequests, setEnrollmentRequests] = useState([])
  const [showRequests, setShowRequests] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [showStudentResults, setShowStudentResults] = useState(null)
  const [editingStudent, setEditingStudent] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', matricNumber: '', level: '' })
  const [newClassName, setNewClassName] = useState('')
  const [newClassSubjects, setNewClassSubjects] = useState('')

  // Teacher Student Creation State
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentMatricNumber, setStudentMatricNumber] = useState('');
  const [studentLevel, setStudentLevel] = useState('');
  const [studentMsg, setStudentMsg] = useState('');

  // Question Bank
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  useEffect(() => { 
    fetchClasses()
    fetchEnrollmentRequests()
  }, [])

  async function fetchClasses() {
    setLoading(true)
    try {
      const data = await api.get('/api/classes', token)
      setClasses(data.classes || [])
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  async function createClass() {
    if (!newClassName) return alert('Enter class name');
    const subjects = newClassSubjects.split(',').map((s) => s.trim()).filter(Boolean);
    const payload = { name: newClassName, subjects };
    
    try {
      const res = await api.post('/api/classes', payload, token);
      if (res.class) {
        setNewClassName('');
        setNewClassSubjects('');
        fetchClasses(); // Refresh list to show newly created class
      } else {
        alert(res.message || 'Failed to create class');
      }
    } catch (err) {
      alert(err.message || 'Error executing request.');
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
        schoolId: user?.schoolId, // Auto-associate to teacher's school if applicable
      }, token);
      setStudentMsg(res.message || 'Student created successfully!');
      setStudentName('');
      setStudentEmail('');
      setStudentMatricNumber('');
      setStudentLevel('');
    } catch (err) {
      setStudentMsg(err.message || 'Failed to create student');
    }
  }

  async function fetchEnrollmentRequests() {
    setRequestsLoading(true)
    try {
      const data = await api.get('/api/enrollment/requests?status=pending', token)
      setEnrollmentRequests(data || [])
    } catch (err) {
      console.error('Failed to fetch enrollment requests:', err)
    } finally { setRequestsLoading(false) }
  }

  async function removeMember(classId, memberId) {
    const del = await fetch('/api/classes/' + classId + '/members/' + memberId, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } })
    const body = await del.json()
    if (del.ok) fetchClasses()
    else alert(body.message || 'Failed to remove member')
  }

  async function approveRequest(requestId) {
    try {
      await api.post(`/api/enrollment/approve/${requestId}`, {}, token)
      fetchEnrollmentRequests()
      fetchClasses()
    } catch (err) {
      alert(err.message || 'Failed to approve request')
    }
  }

  async function rejectRequest(requestId) {
    try {
      await api.post(`/api/enrollment/reject/${requestId}`, { reason: 'Rejected by teacher' }, token)
      fetchEnrollmentRequests()
    } catch (err) {
      alert(err.message || 'Failed to reject request')
    }
  }

  async function handleEditStudentSubmit(e) {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await api.put(`/api/users/${editingStudent._id || editingStudent}`, editForm, token);
      setEditingStudent(null);
      fetchClasses(); // Refresh member data
    } catch (err) {
      alert(err.message || 'Failed to update student');
    }
  }

  const openEditModal = (member) => {
    // member could be an object or a string ID
    const memberObj = typeof member === 'object' ? member : { _id: member, name: member, matricNumber: '', level: '' };
    setEditingStudent(memberObj);
    setEditForm({ 
      name: memberObj.name || memberObj.username || '', 
      matricNumber: memberObj.matricNumber || '', 
      level: memberObj.level || '' 
    });
  };

  if (loading) return <div className="card">Loading your classes...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>👨‍🏫 My Classes</h3>
        <button 
          onClick={() => setShowAnalytics(!showAnalytics)} 
          style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
        >
          {showAnalytics ? 'Hide Analytics' : '📊 View Analytics Dashboard'}
        </button>
      </div>

      {showAnalytics && (
        <div style={{ marginBottom: '24px' }}>
          <AnalyticsDashboard token={token} />
        </div>
      )}

      {/* Teacher Class Creation Section */}
      <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginTop: 0 }}>➕ Create New Class</h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Class Name</label><br />
            <input 
              value={newClassName} 
              onChange={e => setNewClassName(e.target.value)} 
              placeholder="e.g. Physics 101" 
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Initial Subjects (comma-separated)</label><br />
            <input 
              value={newClassSubjects} 
              onChange={e => setNewClassSubjects(e.target.value)} 
              placeholder="e.g. Science, Term 1" 
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginTop: '4px' }}
            />
          </div>
          <button 
            onClick={createClass}
            style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', height: 'fit-content' }}
          >
            Create Class
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setShowStudentForm(!showStudentForm)} style={{ flex: 1, padding: '10px', background: '#ecfdf5', color: '#065f46', border: '1px solid #34d399', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          {showStudentForm ? 'Hide Student Creation' : '🎓 Create New Student'}
        </button>
        <button onClick={() => setShowQuestionForm(!showQuestionForm)} style={{ flex: 1, padding: '10px', background: '#fffbeb', color: '#b45309', border: '1px solid #fbbf24', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          {showQuestionForm ? 'Hide Question Bank' : '📚 Question Bank & Upload'}
        </button>
      </div>

      {showStudentForm && (
        <div className="card" style={{ marginBottom: '20px', borderTop: '4px solid #10b981' }}>
          <h4 style={{ marginTop: 0 }}>Create Student Account</h4>
          {studentMsg && <div style={{ color: studentMsg.includes('success') ? 'green' : 'red', marginBottom: '10px' }}>{studentMsg}</div>}
          <form onSubmit={createStudent} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Name</label>
              <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} required style={{ width: '100%', padding: '6px' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Email (Optional)</label>
              <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} style={{ width: '100%', padding: '6px' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Matric Number</label>
              <input type="text" value={studentMatricNumber} onChange={(e) => setStudentMatricNumber(e.target.value)} required style={{ width: '100%', padding: '6px' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Level</label>
              <input type="text" value={studentLevel} onChange={(e) => setStudentLevel(e.target.value)} required style={{ width: '100%', padding: '6px' }} />
            </div>
            <div style={{ width: '100%' }}>
              <button type="submit" style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Student</button>
            </div>
          </form>
        </div>
      )}

      <Suspense fallback={<div className="card">Loading Question Bank...</div>}>
        {showQuestionForm && <QuestionForm token={token} />}
      </Suspense>
      
      {/* Enrollment Requests Section */}
      {enrollmentRequests.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', background: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0' }}>📋 Student Enrollment Requests</h4>
              <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>{enrollmentRequests.length} pending request{enrollmentRequests.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setShowRequests(!showRequests)}>
              {showRequests ? 'Hide' : 'View'}
            </button>
          </div>

          {showRequests && (
            <div style={{ marginTop: '12px' }}>
              {requestsLoading ? (
                <p>Loading requests...</p>
              ) : (
                enrollmentRequests.map(req => (
                  <div key={req._id} className="card" style={{ marginTop: '8px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>
                          {req.studentId?.name || req.studentId?._id || 'Student'} ({req.studentId?.email})
                        </p>
                        <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
                          Requested to join: <strong>{req.classId?.name || 'Unknown Class'}</strong>
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
                          Requested: {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => approveRequest(req._id)}
                          style={{ background: '#22c55e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ✓ Approve
                        </button>
                        <button 
                          onClick={() => rejectRequest(req._id)}
                          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Classes Section */}
      {classes.length === 0 ? (
        <div className="card muted">
          <p>You haven't been assigned to any classes yet.</p>
          <p style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
            Once an admin assigns you to classes, they will appear here.
          </p>
        </div>
      ) : (
        classes.map(c => (
          <div key={c._id}>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{c.name}</strong>
                  <div style={{ marginTop: 8, fontSize: '13px', color: '#666' }}>
                    Subjects: {(c.subjects || []).join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClass(selectedClass === c._id ? null : c._id)}
                  style={{
                    background: selectedClass === c._id ? '#667eea' : '#f3f4f6',
                    color: selectedClass === c._id ? 'white' : '#1f2937',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {selectedClass === c._id ? 'Hide Details' : 'View Details'}
                </button>
              </div>

              {selectedClass !== c._id && (
                <div style={{ marginTop: 8 }}>
                  <strong>Members ({(c.members || []).length}):</strong>
                  <ul>
                    {(c.members || []).map(m => {
                      const mObj = typeof m === 'object' ? m : { _id: m, username: m };
                      return (
                        <li key={mObj._id} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div 
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              backgroundColor: '#e2e8f0',
                              backgroundImage: mObj.profilePicture ? `url(${mObj.profilePicture})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {!mObj.profilePicture && <span style={{ fontSize: '14px', color: '#94a3b8' }}>👤</span>}
                          </div>
                          <span style={{ minWidth: '160px', fontWeight: '500' }}>{mObj.name || mObj.username || mObj._id}</span>
                          <button onClick={() => openEditModal(mObj)} style={{ padding: '4px 8px', fontSize: '12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>✏️ Edit</button>
                          <button onClick={() => removeMember(c._id, mObj._id)} style={{ padding: '4px 8px', fontSize: '12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                        </li>
                      );
                    })}
                  </ul>
                  <div style={{ marginTop: 6 }}>
                    <UserSearch token={token} placeholder="Add member by email" onSelect={(u) => { api.post(`/api/classes/${c._id}/members`, { userId: u._id }, token).then(() => fetchClasses()) }} />
                  </div>
                </div>
              )}
            </div>

            {selectedClass === c._id && (
              <div>
                <Announcements classId={c._id} isTeacher={true} />
                <Leaderboard classId={c._id} />
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <ExportResults classId={c._id} type="leaderboard" />
                  <ExportResults classId={c._id} type="class-report" />
                  <button
                    onClick={() => setShowStudentResults(c._id)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    📊 Generate Student Results
                  </button>
                  <button
                    onClick={() => setShowStudentResults(showStudentResults === `test-${c._id}` ? null : `test-${c._id}`)}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    📝 Build Test
                  </button>
                </div>
                
                {showStudentResults === `test-${c._id}` && (
                  <div className="card" style={{ marginTop: '20px', border: '2px solid #f59e0b' }}>
                    <TestBuilder initialClassId={c._id} />
                  </div>
                )}
                
                {/* Attendance Tracker */}
                <AttendanceTracker classId={c._id} token={token} />
              </div>
            )}
          </div>
        ))
      )}

      {showStudentResults && (
        <StudentResults
          classId={showStudentResults}
          className={classes.find(c => c._id === showStudentResults)?.name || 'Class'}
          onClose={() => setShowStudentResults(null)}
        />
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', background: 'white', padding: '24px' }}>
            <h3 style={{ marginTop: 0 }}>Edit Student Details</h3>
            <form onSubmit={handleEditStudentSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label>Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label>Matric Number</label>
                <input type="text" value={editForm.matricNumber} onChange={e => setEditForm({...editForm, matricNumber: e.target.value})} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>Level</label>
                <input type="text" value={editForm.level} onChange={e => setEditForm({...editForm, level: e.target.value})} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditingStudent(null)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
