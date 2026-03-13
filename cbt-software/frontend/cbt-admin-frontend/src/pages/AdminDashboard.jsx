import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import UserSearch from '../components/UserSearch';
import ExportResults from '../components/ExportResults';

// Lazy load heavy components
const QuestionForm = lazy(() => import('../components/QuestionForm'));
const GradingDashboard = lazy(() => import('../components/GradingDashboard'));
const AnalyticsDashboard = lazy(() => import('../components/AnalyticsDashboard'));
const TestForm = lazy(() => import('../components/TestForm'));
const UserManagement = lazy(() => import('../components/UserManagement')); 
const EnrollmentManagement = lazy(() => import('../components/EnrollmentManagement'));

function AdminDashboard() {
  const auth = JSON.parse(localStorage.getItem('auth'));
  const token = auth?.token;
  const user = auth?.user;
  const isSuperAdmin = user?.role === 'superAdmin';

  const location = useLocation();
  const passedSchoolId = location.state?.schoolId;

  const [overall, setOverall] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassForExport, setSelectedClassForExport] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubjects, setNewClassSubjects] = useState('');
  const [difficulty, setDifficulty] = useState(null);
  const [classSubjectInputs, setClassSubjectInputs] = useState({});        
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showGradingDashboard, setShowGradingDashboard] = useState(false); 
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [showEnrollmentManagement, setShowEnrollmentManagement] = useState(false);
  const [tests, setTests] = useState([]);
  const [editingTest, setEditingTest] = useState(null);

  // School selection for Super Admins
  const [allSchools, setAllSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(passedSchoolId || '');

  async function fetchAllSchools() {
    try {
      const data = await api.get('/api/schools', token);
      if (data.schools) {
        setAllSchools(data.schools);
        // Default to first school if none selected or passed
        if (data.schools.length > 0 && !selectedSchoolId && !passedSchoolId) {
          setSelectedSchoolId(data.schools[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch schools', err);
    }
  }

  async function fetchTests() {
    try {
      const params = new URLSearchParams();
      if (isSuperAdmin && selectedSchoolId) params.append('schoolId', selectedSchoolId);
      const url = `/api/tests/list${params.toString() ? '?' + params.toString() : ''}`;
      const data = await api.get(url);
      if (data.tests) setTests(data.tests);
    } catch (err) {
      console.error('Failed to fetch tests', err);
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllSchools();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin || selectedSchoolId) {
      fetchClasses();
      fetchTests();
    }
  }, [token, selectedSchoolId]);

  async function fetchOverall() {
    const params = new URLSearchParams();
    if (isSuperAdmin && selectedSchoolId) params.append('schoolId', selectedSchoolId);
    const url = `/api/reports/overall-performance${params.toString() ? '?' + params.toString() : ''}`;
    const data = await api.get(url); 
    setOverall(data);
  }

  async function fetchDifficulty() {
    const params = new URLSearchParams();
    if (isSuperAdmin && selectedSchoolId) params.append('schoolId', selectedSchoolId);
    const url = `/api/reports/question-difficulty${params.toString() ? '?' + params.toString() : ''}`;
    const data = await api.get(url); 
    setDifficulty(data);
  }

  async function fetchClasses() {
    try {
      const params = new URLSearchParams();
      if (isSuperAdmin && selectedSchoolId) params.append('schoolId', selectedSchoolId);
      const url = `/api/classes${params.toString() ? '?' + params.toString() : ''}`;
      const data = await api.get(url);
      if (data.classes) setClasses(data.classes);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  }

  async function createClass() {
    if (!newClassName) return alert('Enter class name');
    const subjects = newClassSubjects.split(',').map((s) => s.trim()).filter(Boolean);
    const payload = { name: newClassName, subjects };
    if (isSuperAdmin) payload.schoolId = selectedSchoolId;

    const res = await api.post('/api/classes', payload, token);
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
    const url = `/api/classes/${classId}/subjects`;
    const res = await api.post(url, { subject, schoolId: isSuperAdmin ? selectedSchoolId : undefined }, token);
    if (res.class) fetchClasses();
    else alert(res.message || 'Failed to add subject');
  }

  async function removeSubjectFromClass(classId, subject) {
    const schoolParam = isSuperAdmin ? `?schoolId=${selectedSchoolId}` : '';
    const del = await fetch(`/api/classes/${classId}/subjects/${encodeURIComponent(subject)}${schoolParam}`, {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    const body = await del.json();
    if (del.ok) fetchClasses();
    else alert(body.message || 'Failed to remove subject');
  }

  async function deleteClass(classId) {
    const schoolParam = isSuperAdmin ? `?schoolId=${selectedSchoolId}` : '';
    const del = await fetch(`/api/classes/${classId}${schoolParam}`, {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    const body = await del.json();
    if (del.ok) fetchClasses();
    else alert(body.message || 'Failed to delete class');
  }

  async function assignTeacher(classId, teacherId) {
    if (!teacherId) return alert('Enter teacher identifier');
    let finalId = teacherId;
    if (!/^[0-9a-fA-F]{24}$/.test(teacherId)) {
      const schoolParam = isSuperAdmin ? `&schoolId=${selectedSchoolId}` : '';
      const lookup = await api.get(`/api/users/search?email=${encodeURIComponent(teacherId)}${schoolParam}`, token);
      const found = lookup.users && lookup.users[0];
      if (!found) return alert('Teacher not found');
      finalId = found._id;
    }
    const res = await api.post(`/api/classes/${classId}/teacher`, { 
      teacherId: finalId,
      schoolId: isSuperAdmin ? selectedSchoolId : undefined 
    }, token);
    if (res.class) fetchClasses();
    else alert(res.message || 'Failed to assign teacher');
  }

  async function addMember(classId, userId) {
    if (!userId) return alert('Enter user identifier');
    let finalId = userId;
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      const schoolParam = isSuperAdmin ? `&schoolId=${selectedSchoolId}` : '';
      const lookup = await api.get(`/api/users/search?email=${encodeURIComponent(userId)}${schoolParam}`, token);
      const found = lookup.users && lookup.users[0];
      if (!found) return alert('User not found');
      finalId = found._id;
    }
    const res = await api.post(`/api/classes/${classId}/members`, { 
      userId: finalId,
      schoolId: isSuperAdmin ? selectedSchoolId : undefined 
    }, token);
    if (res.class) fetchClasses();
    else alert(res.message || 'Failed to add member');
  }

  async function removeMember(classId, memberId) {
    const schoolParam = isSuperAdmin ? `?schoolId=${selectedSchoolId}` : '';
    const del = await fetch(`/api/classes/${classId}/members/${memberId}${schoolParam}`, {
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
    if (isSuperAdmin && !selectedSchoolId) return alert('Select a school first');

    const fd = new FormData();
    fd.append('file', file);
    if (isSuperAdmin) {
      fd.append('schoolId', selectedSchoolId);
    }

    // Pass schoolId in query too so auth middleware can resolve role/school
    // before multipart/form-data body is parsed.
    const uploadUrl = isSuperAdmin
      ? `/api/questions/upload?schoolId=${encodeURIComponent(selectedSchoolId)}`
      : '/api/questions/upload';
    const res = await api.postForm(uploadUrl, fd, token);
    setUploadMsg(res.message || JSON.stringify(res));
  }

  const loadingSuspense = <div className="card">Loading component...</div>;

  return (
    <div>
      <h3>🔧 Admin Dashboard</h3>

      {isSuperAdmin && (
        <div className="card" style={{ 
          marginBottom: '30px', 
          border: '3px solid #0284c7', 
          background: '#f0f9ff',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          <h4 style={{ color: '#0369a1', marginTop: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem' }}>🏫</span> Managing School (Super Admin)
          </h4>
          <p style={{ fontSize: '14px', color: '#0c4a6e', marginBottom: '12px', fontWeight: '500' }}>
            All data below (classes, tests, questions) is for the selected school:
          </p>
          <select 
            value={selectedSchoolId} 
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '2px solid #0284c7',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#0369a1',
              cursor: 'pointer'
            }}
          >
            <option value="">-- SELECT A SCHOOL TO MANAGE --</option>
            {allSchools.map(s => (
              <option key={s._id} value={s._id}>{s.name.toUpperCase()}</option>
            ))}
          </select>
          {!selectedSchoolId && (
            <p style={{ color: '#e11d48', fontSize: '13px', marginTop: '8px', fontWeight: 'bold' }}>
              ⚠️ Please select a school to start managing its data.
            </p>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h4>Analytics & Reports</h4>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchOverall} style={{ flex: 1, background: 'var(--ye-success)' }}>Overall Performance</button>
          <button onClick={fetchDifficulty} style={{ flex: 1, background: 'var(--ye-accent)' }}>Question Difficulty</button>
        </div>
      </div>


      {overall && <pre>{JSON.stringify(overall, null, 2)}</pre>}
      {difficulty && <pre>{JSON.stringify(difficulty, null, 2)}</pre>}     
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
        <Suspense fallback={loadingSuspense}>
          {showQuestionForm && <QuestionForm token={token} schoolId={isSuperAdmin ? selectedSchoolId : undefined} />}
        </Suspense>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setShowGradingDashboard(!showGradingDashboard)}>
          {showGradingDashboard ? 'Hide Grading Dashboard' : 'View Essays for Grading'}
        </button>
        <Suspense fallback={loadingSuspense}>
          {showGradingDashboard && <GradingDashboard token={token} schoolId={isSuperAdmin ? selectedSchoolId : undefined} />}     
        </Suspense>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setShowAnalyticsDashboard(!showAnalyticsDashboard)}>
          {showAnalyticsDashboard ? 'Hide Analytics' : 'Show Analytics Dashboard'}
        </button>
        <Suspense fallback={loadingSuspense}>
          {showAnalyticsDashboard && <AnalyticsDashboard token={token} schoolId={isSuperAdmin ? selectedSchoolId : undefined} />} 
        </Suspense>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => { setShowTestForm(!showTestForm); setEditingTest(null); }}>
          {showTestForm ? 'Hide Test Form' : 'Create New Test'}
        </button>
        <Suspense fallback={loadingSuspense}>
          {showTestForm && <TestForm token={token} test={editingTest} schoolId={isSuperAdmin ? selectedSchoolId : undefined} onTestCreated={() => { fetchTests(); setShowTestForm(false); }} onTestUpdated={() => { fetchTests(); setEditingTest(null); setShowTestForm(false); }} />}  
        </Suspense>
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
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setShowEnrollmentManagement(!showEnrollmentManagement)}>
          {showEnrollmentManagement ? 'Hide Enrollment Management' : 'Manage Student Enrollments'}
        </button>
        <Suspense fallback={loadingSuspense}>
          {showEnrollmentManagement && <EnrollmentManagement schoolId={isSuperAdmin ? selectedSchoolId : undefined} />}
        </Suspense>
      </div>
      <Suspense fallback={loadingSuspense}>
        <UserManagement token={token} schoolId={isSuperAdmin ? selectedSchoolId : undefined} />
      </Suspense>
    </div>
  )
}

export default AdminDashboard;
