import React, { useState, useEffect } from 'react';
import api from '../services/api';
import UserSearch from '../components/UserSearch';
import QuestionForm from '../components/QuestionForm';
import GradingDashboard from '../components/GradingDashboard';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import TestForm from '../components/TestForm';

export default function AdminDashboard({ token }) {
  const role = localStorage.getItem('role') || null;
  const [overall, setOverall] = useState(null);
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubjects, setNewClassSubjects] = useState(''); // comma-separated
  const [userHistory, setUserHistory] = useState(null);
  const [userId, setUserId] = useState('');
  const [difficulty, setDifficulty] = useState(null);
  const [seedInfo, setSeedInfo] = useState(null);
  const [classSubjectInputs, setClassSubjectInputs] = useState({});
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showGradingDashboard, setShowGradingDashboard] = useState(false);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [tests, setTests] = useState([]);
  const [editingTest, setEditingTest] = useState(null);

  async function fetchTests() {
    try {
      const data = await api.get('/api/tests/list', token);
      if (data.tests) setTests(data.tests);
    } catch (err) {
      console.error('Failed to fetch tests', err);
    }
  }

  useEffect(() => {
    fetchClasses();
    fetchTests();
  }, [token]);

  async function fetchOverall() {
    const data = await api.get('/api/reports/overall-performance', token);
    setOverall(data);
  }

  async function fetchUser() {
    if (!userId) return alert('Enter userId');
    const data = await api.get(`/api/reports/user-history/${userId}`, token);
    setUserHistory(data);
  }

  async function fetchDifficulty() {
    const data = await api.get('/api/reports/question-difficulty', token);
    setDifficulty(data);
  }

  async function fetchSeedInfo() {
    const data = await api.get('/api/tests/seed-info/latest');
    setSeedInfo(data);
  }

  async function fetchClasses() {
    try {
      const data = await api.get('/api/classes', token);
      if (data.classes) setClasses(data.classes);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  }

  async function createClass() {
    if (!newClassName) return alert('Enter class name');
    const subjects = newClassSubjects.split(',').map((s) => s.trim()).filter(Boolean);
    const res = await api.post('/api/classes', { name: newClassName, subjects }, token);
    if (res.class) {
      setNewClassName('');
      setNewClassSubjects('');
      fetchClasses();
    } else {
      alert(res.message || 'Failed to create class');
    }
  }

  async function addSubjectToClass(classId, subject) {
    if (!subject) return;
    const res = await api.post(`/api/classes/${classId}/subjects`, { subject }, token);
    if (res.class) fetchClasses();
    else alert(res.message || 'Failed to add subject');
  }

  async function removeSubjectFromClass(classId, subject) {
    const res = await api.get(`/api/classes/${classId}`); // ensure exists
    const del = await fetch('/api/classes/' + classId + '/subjects/' + encodeURIComponent(subject), {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    const body = await del.json();
    if (del.ok) fetchClasses();
    else alert(body.message || 'Failed to remove subject');
  }

  async function deleteClass(classId) {
    const del = await fetch('/api/classes/' + classId, {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    const body = await del.json();
    if (del.ok) fetchClasses();
    else alert(body.message || 'Failed to delete class');
  }

  async function assignTeacher(classId, teacherId) {
    if (!teacherId) return alert('Enter teacher identifier');
    // if teacherId looks like an ObjectId (24 hex chars), use directly; otherwise lookup by email
    let finalId = teacherId;
    if (!/^[0-9a-fA-F]{24}$/.test(teacherId)) {
      const lookup = await api.get(`/api/users/search?email=${encodeURIComponent(teacherId)}`, token);
      const found = lookup.users && lookup.users[0];
      if (!found) return alert('Teacher not found');
      finalId = found._id;
    }
    const res = await api.post(`/api/classes/${classId}/teacher`, { teacherId: finalId }, token);
    if (res.class) fetchClasses();
    else alert(res.message || 'Failed to assign teacher');
  }

  async function addMember(classId, userId) {
    if (!userId) return alert('Enter user identifier');
    let finalId = userId;
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      const lookup = await api.get(`/api/users/search?email=${encodeURIComponent(userId)}`, token);
      const found = lookup.users && lookup.users[0];
      if (!found) return alert('User not found');
      finalId = found._id;
    }
    const res = await api.post(`/api/classes/${classId}/members`, { userId: finalId }, token);
    if (res.class) fetchClasses();
    else alert(res.message || 'Failed to add member');
  }

  async function removeMember(classId, memberId) {
    const del = await fetch('/api/classes/' + classId + '/members/' + memberId, {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    const body = await del.json();
    if (del.ok) fetchClasses();
    else alert(body.message || 'Failed to remove member');
  }

  // Upload questions Excel
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState(null);

  async function uploadFile() {
    if (!file) return alert('Select a file first');
    if (!token) return alert('Admin login required');
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.postForm('/api/questions/upload', fd, token);
    setUploadMsg(res.message || JSON.stringify(res));
  }

  return (
    <div>
      <h3>🔧 Admin Dashboard</h3>
      <div className="card" style={{ marginBottom: '20px' }}>
        <h4>Analytics & Reports</h4>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchOverall} style={{ flex: 1, background: 'var(--ye-success)' }}>Overall Performance</button>
          <button onClick={fetchDifficulty} style={{ flex: 1, background: 'var(--ye-accent)' }}>Question Difficulty</button>
        </div>
      </div>
      

      {overall && <pre>{JSON.stringify(overall, null, 2)}</pre>}
      {difficulty && <pre>{JSON.stringify(difficulty, null, 2)}</pre>}
      {userHistory && <pre>{JSON.stringify(userHistory, null, 2)}</pre>}
      {seedInfo && <div style={{ marginTop: 12 }} className="card">Latest seed test: <strong>{seedInfo.testName}</strong><br/>ID: <code>{seedInfo.testId}</code></div>}
      <div style={{ marginTop: 12 }} className="card">
        <h4>📤 Upload Questions</h4>
        <input type="file" accept=".xls,.xlsx,.csv" onChange={e => setFile(e.target.files[0])} />
        <div style={{ marginTop: 8 }}>
          <button onClick={uploadFile}>Upload File</button>
        </div>
        {uploadMsg && <div style={{ marginTop: 8, color: 'green' }}>{uploadMsg}</div>}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setShowQuestionForm(!showQuestionForm)}>
          {showQuestionForm ? 'Hide Question Form' : 'Create New Question Manually'}
        </button>
        {showQuestionForm && <QuestionForm token={token} />}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setShowGradingDashboard(!showGradingDashboard)}>
          {showGradingDashboard ? 'Hide Grading Dashboard' : 'View Essays for Grading'}
        </button>
        {showGradingDashboard && <GradingDashboard token={token} />}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setShowAnalyticsDashboard(!showAnalyticsDashboard)}>
          {showAnalyticsDashboard ? 'Hide Analytics' : 'Show Analytics Dashboard'}
        </button>
        {showAnalyticsDashboard && <AnalyticsDashboard token={token} />}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => { setShowTestForm(!showTestForm); setEditingTest(null); }}>
          {showTestForm ? 'Hide Test Form' : 'Create New Test'}
        </button>
        {showTestForm && <TestForm token={token} test={editingTest} onTestCreated={() => { fetchTests(); setShowTestForm(false); }} onTestUpdated={() => { fetchTests(); setEditingTest(null); setShowTestForm(false); }} />}
      </div>
      <div style={{ marginTop: 12 }} className="card">
        <h4>📝 Tests Management</h4>
        {tests.map(test => (
          <div key={test._id} className="card" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><strong>{test.testName}</strong></div>
              <div>
                <button onClick={() => { setEditingTest(test); setShowTestForm(true); }} style={{ marginLeft: 8 }}>Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }} className="card">
        <h4>📁 Classes & Subjects Management</h4>
        <div>
          <label>Class name</label><br />
          <input value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="e.g. Grade 10" />
        </div>
        <div>
          <label>Initial subjects (comma-separated)</label><br />
          <input value={newClassSubjects} onChange={e => setNewClassSubjects(e.target.value)} placeholder="Mathematics, English" />
        </div>
        <div style={{ marginTop: 8 }}>
          <button onClick={createClass}>Create Class</button>
          <button onClick={fetchClasses} style={{ marginLeft: 8 }}>Refresh Classes</button>
        </div>

        <div style={{ marginTop: 12 }}>
          {classes.map(c => (
            <div key={c._id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><strong>{c.name}</strong></div>
                <div>
                  <button onClick={() => deleteClass(c._id)} style={{ color: 'red' }}>Delete Class</button>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                Subjects:
                <ul>
                  {(c.subjects || []).map(s => (
                    <li key={s}>{s} <button onClick={() => removeSubjectFromClass(c._id, s)} style={{ marginLeft: 8 }}>Remove</button></li>
                  ))}
                </ul>
                <div>
                  <input placeholder="New subject" value={classSubjectInputs[c._id] || ''} onChange={e => setClassSubjectInputs(prev => ({ ...prev, [c._id]: e.target.value }))} />
                  <button onClick={() => { addSubjectToClass(c._id, classSubjectInputs[c._id]); setClassSubjectInputs(prev => ({ ...prev, [c._id]: '' })); }}>Add Subject</button>
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Teacher / Members</strong>
                  <div style={{ marginTop: 6 }}>
                    <div>Teacher: {c.teacher ? (c.teacher.username || c.teacher._id || c.teacher) : '—'}</div>
                    <div style={{ marginTop: 6 }}>
                      <UserSearch token={token} placeholder="Assign teacher by email" onSelect={(u) => assignTeacher(c._id, u._id)} />
                    </div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    Members:
                    <ul>
                      {(c.members || []).map(m => (
                        <li key={m._id || m}>{m.username || m._id || m} <button onClick={() => removeMember(c._id, m._id || m)} style={{ marginLeft: 8 }}>Remove</button></li>
                      ))}
                    </ul>
                    <UserSearch token={token} placeholder="Search student by email" onSelect={(u) => addMember(c._id, u._id)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
