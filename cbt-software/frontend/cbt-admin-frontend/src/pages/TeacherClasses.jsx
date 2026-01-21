import React, { useEffect, useState } from 'react'
import api from '../services/api'
import UserSearch from '../components/UserSearch'
import Announcements from '../components/Announcements'
import Leaderboard from '../components/Leaderboard'
import ExportResults from '../components/ExportResults'

export default function TeacherClasses() {
  const token = JSON.parse(localStorage.getItem('auth'))?.token;
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [enrollmentRequests, setEnrollmentRequests] = useState([])
  const [showRequests, setShowRequests] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)

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

  if (loading) return <div className="card">Loading your classes...</div>

  return (
    <div>
      <h3>👨‍🏫 My Classes</h3>
      
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
                    {(c.members || []).map(m => (
                      <li key={m._id || m}>{m.username || m._id || m} <button onClick={() => removeMember(c._id, m._id || m)} style={{ marginLeft: 8 }}>Remove</button></li>
                    ))}
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
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <ExportResults classId={c._id} type="leaderboard" />
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
