import React, { useEffect, useState } from 'react'
import api from '../services/api'
import UserSearch from '../components/UserSearch'

export default function TeacherClasses({ token }) {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchClasses() }, [])

  async function fetchClasses() {
    setLoading(true)
    try {
      const data = await api.get('/api/classes', token)
      setClasses(data.classes || [])
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  async function addMemberByEmail(classId) {
    // Deprecated: replaced by UserSearch typeahead in the UI.
    return
  }

  async function removeMember(classId, memberId) {
    const del = await fetch('/api/classes/' + classId + '/members/' + memberId, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } })
    const body = await del.json()
    if (del.ok) fetchClasses()
    else alert(body.message || 'Failed to remove member')
  }

  if (loading) return <div className="card">Loading your classes...</div>

  return (
    <div>
      <h3>👨‍🏫 My Classes</h3>
      {classes.length === 0 && <div className="card muted">You haven't been assigned to any classes yet.</div>}
      {classes.map(c => (
        <div key={c._id} className="card" style={{ marginBottom: '16px' }}>
          <strong>{c.name}</strong>
          <div style={{ marginTop: 8 }}>
            Subjects: {(c.subjects || []).join(', ')}
          </div>
          <div style={{ marginTop: 8 }}>
            Members:
            <ul>
              {(c.members || []).map(m => (
                <li key={m._id || m}>{m.username || m._id || m} <button onClick={() => removeMember(c._id, m._id || m)} style={{ marginLeft: 8 }}>Remove</button></li>
              ))}
            </ul>
            <div style={{ marginTop: 6 }}>
              <UserSearch token={token} placeholder="Add member by email" onSelect={(u) => { api.post(`/api/classes/${c._id}/members`, { userId: u._id }, token).then(() => fetchClasses()) }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
