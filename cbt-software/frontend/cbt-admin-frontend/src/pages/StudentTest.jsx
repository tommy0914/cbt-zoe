import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import Announcements from '../components/Announcements'
import Leaderboard from '../components/Leaderboard'
import Certificates from '../components/Certificates'
import TestTaking from '../components/TestTaking'
import StudyMaterials from '../components/StudyMaterials'

export default function StudentTest() {
  const token = JSON.parse(localStorage.getItem('auth'))?.token;
  const [testId, setTestId] = useState('')
  const [testsList, setTestsList] = useState([])
  const [classesList, setClassesList] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const timerRef = useRef(null)
  const [timeLeft, setTimeLeft] = useState(null)
  
  // Student Profile State
  const [studentProfile, setStudentProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const fileInputRef = useRef(null)

  // CBT Engine State
  const [cbtTests, setCbtTests] = useState([])
  const [activeCbtTestId, setActiveCbtTestId] = useState(null)

  useEffect(() => {
    if (!attempt) return
    const end = Date.now() + attempt.durationMinutes * 60 * 1000
    setTimeLeft(Math.max(0, Math.round((end - Date.now()) / 1000)))
    timerRef.current = setInterval(() => {
      const secs = Math.max(0, Math.round((end - Date.now()) / 1000))
      setTimeLeft(secs)
      if (secs <= 0) {
        clearInterval(timerRef.current)
        // Optionally auto-submit
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [attempt])

  useEffect(() => {
    // fetch available tests when component mounts or page/pageSize/token changes
    async function load() {
      // prefer authenticated list (paged); otherwise use public search with pagination
      let data = null
      if (token) {
        data = await api.get(`/api/tests/list?page=${page}&pageSize=${pageSize}`, token)
      }
      if (!data || !data.tests) {
        data = await api.get(`/api/tests/search?page=${page}&pageSize=${pageSize}`)
      }
      if (data.tests) {
        setTestsList(data.tests)
        setTotal(data.total || data.tests.length)
        setPage(data.page || page)
        setPageSize(data.pageSize || pageSize)
        setTotalPages(data.totalPages || Math.ceil((data.total || data.tests.length) / (data.pageSize || pageSize)))
        // auto-select first test on load
        if (data.tests.length > 0) setTestId(data.tests[0]._id)
      }
    }
    load()
      // also load classes for subject selection if authenticated
    async function loadClasses() {
      if (!token) return
      try {
        const data = await api.get('/api/classes', token)
        const list = data && data.classes ? data.classes : []
        if (list && Array.isArray(list)) {
          setClassesList(list)
          if (data.length > 0) {
            setSelectedClassId(prev => prev || list[0]._id)
            // pick first subject if exists
            const firstSubjects = (list[0].subjects || [])
            if (firstSubjects.length > 0) setSelectedSubject(prev => prev || firstSubjects[0])
          }
        }
      } catch (err) {
        // ignore; classes endpoint requires auth
      }
    }
    
    async function fetchProfile() {
      if (!token) return
      try {
        const authData = JSON.parse(localStorage.getItem('auth'));
        if (authData && authData.userId) {
          setProfileLoading(true);
          const res = await api.get(`/api/users/${authData.userId}`, token);
          if (res.user) setStudentProfile(res.user);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setProfileLoading(false);
      }
    }

    loadClasses()
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, pageSize])

  // Fetch CBT Engine Tests when selected class changes
  useEffect(() => {
    if (selectedClassId && token) {
      api.get(`/api/test-engine/class/${selectedClassId}`, token)
        .then(data => setCbtTests(data.tests || []))
        .catch(err => console.error('Failed to load CBT tests:', err));
    } else {
      setCbtTests([]);
    }
  }, [selectedClassId, token]);

  function gotoPage(nextPage) {
    if (nextPage < 1) return
    if (totalPages && nextPage > totalPages) return
    setPage(nextPage)
  }

  async function start(isPractice = false) {
    if (!token) return alert('Login as student first');
    if (!testId) return alert('Select a test');
    // require class and subject selection
    if (!selectedClassId) return alert('Please select a class before starting the test');
    if (!selectedSubject) return alert('Please select a subject before starting the test');
    const subjectQuery = `?classId=${encodeURIComponent(selectedClassId)}&subject=${encodeURIComponent(
      selectedSubject,
    )}&isPractice=${isPractice}`;
    const data = await api.get(`/api/tests/start/${testId}${subjectQuery}`, token);
    if (data.attemptId) {
      setAttempt({ ...data, isPractice });
      setAnswers({});
      setResult(null);
    } else {
      alert(data.message || 'Failed to start test');
    }
  }

  function selectAnswer(qid, val) {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  }

  async function submit() {
    if (!attempt) return
    const payload = {
      attemptId: attempt.attemptId,
      answers: Object.keys(answers).map(k => ({ questionId: k, selectedAnswer: answers[k] }))
    }
    const data = await api.post('/api/tests/submit', payload, token)
    setResult(data)
  }

  // auto-submit when timeLeft reaches zero
  useEffect(() => {
    if (timeLeft === 0 && attempt && !result) {
      submit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert('Warning: You have switched to another tab. This action may be flagged.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 200x200 for database storage efficiency
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress and encode as Base64 JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Optimistically update UI
        setStudentProfile(prev => ({ ...prev, profilePicture: dataUrl }));

        // Save to backend
        const authData = JSON.parse(localStorage.getItem('auth'));
        if (authData && authData.userId) {
          api.put(`/api/users/${authData.userId}`, { profilePicture: dataUrl }, token)
            .catch(err => {
              console.error('Failed to save profile picture', err);
              alert('Failed to save image. Please try again.');
            });
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div onCopy={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}>
      {activeCbtTestId ? (
        <TestTaking testId={activeCbtTestId} onBack={() => setActiveCbtTestId(null)} />
      ) : (
        <>
          {/* Profile Card Section */}
          {token && studentProfile && (
            <div className="card" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(to right, #f8fafc, #eff6ff)', border: '1px solid #bfdbfe' }}>
              <div 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  backgroundColor: '#e2e8f0',
                  backgroundImage: studentProfile.profilePicture ? `url(${studentProfile.profilePicture})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to update profile picture"
              >
                {!studentProfile.profilePicture && (
                  <span style={{ fontSize: '24px', color: '#94a3b8' }}>👤</span>
                )}
                {/* Overlay on hover */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px 0', opacity: 0, transition: 'opacity 0.2s' }}
                     onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                     onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                >
                  Edit
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>{studentProfile.name}</h3>
                <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '14px' }}>
                  <span><strong style={{ color: '#475569' }}>Matric No:</strong> {studentProfile.matricNumber || studentProfile.username || 'N/A'}</span>
                  {studentProfile.level && <span><strong style={{ color: '#475569' }}>Level:</strong> {studentProfile.level}</span>}
                </div>
              </div>
            </div>
          )}

          <h3>📋 Assessment Portal</h3>
          <div className="card">
        <h4>Select Your Assessment</h4>
        {token ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label>Class</label>
                <select value={selectedClassId} onChange={e => {
                  const cid = e.target.value
                  setSelectedClassId(cid)
                  const cls = classesList.find(c => c._id === cid)
                  const subs = (cls && cls.subjects) || []
                  setSelectedSubject(subs.length > 0 ? subs[0] : '')
                }}>
                  <option value="">-- choose class --</option>
                  {classesList.map(c => (<option key={c._id} value={c._id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label>Subject</label>
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                  <option value="">-- all subjects --</option>
                  {(classesList.find(c => c._id === selectedClassId)?.subjects || []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label>Test</label>
              <select value={testId} onChange={e => setTestId(e.target.value)}>
                <option value="">-- pick a test --</option>
                {testsList.map(t => (
                  <option key={t._id} value={t._id}>{t.testName} — {t.durationMinutes} mins</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => start(false)} disabled={!(token && selectedClassId && selectedSubject)} style={{ flex: 1 }}>Start Test</button>
              <button onClick={() => start(true)} disabled={!(token && selectedClassId && selectedSubject)} style={{ flex: 1, background: 'var(--ye-accent)' }}>Practice Mode</button>
            </div>
            {!(token && selectedClassId && selectedSubject) && (
              <div style={{ color: '#ef4444', background: '#fee2e2', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>⚠️ You must select a class and subject to start.</div>
            )}
          </>
        ) : (
          <div style={{ color: '#64748b', background: 'var(--ye-light-bg)', padding: '16px', borderRadius: '8px' }}>Login to access your assessments.</div>
        )}
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h4>Available Assessments</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>{total ? `${total} assessments available` : ''}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => gotoPage(page - 1)} disabled={page <= 1} style={{ padding: '6px 10px', fontSize: '12px' }}>← Prev</button>
            <span style={{ fontSize: '13px' }}>Page {page}{totalPages ? ` / ${totalPages}` : ''}</span>
            <button onClick={() => gotoPage(page + 1)} disabled={totalPages ? page >= totalPages : testsList.length < pageSize} style={{ padding: '6px 10px', fontSize: '12px' }}>Next →</button>
            <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setPage(1); }} style={{ padding: '6px', fontSize: '12px' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {attempt && (
        <div>
          <h4>Attempt: {attempt.attemptId}</h4>
          <div>Time left: {timeLeft != null ? `${Math.floor(timeLeft/60)}:${('0'+(timeLeft%60)).slice(-2)}` : '—'}</div>
          <div>
            {attempt.questions.map(q => (
              <div key={q._id} className="question card">
                <div><strong>{q.questionText}</strong></div>
                <div className="options">
                  {q.options.map(opt => (
                    <button key={opt} onClick={() => selectAnswer(q._id, opt)} style={{ background: answers[q._id] === opt ? '#eef' : '#fff' }}>{opt}</button>
                  ))}
                </div>
                {result && result.detailedResults && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
                    <p style={{ color: result.detailedResults.find(r => r.questionId === q._id)?.isCorrect ? 'green' : 'red' }}>
                      Your answer: {answers[q._id]} | Correct answer: {result.detailedResults.find(r => r.questionId === q._id)?.correctAnswer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!result && <button onClick={submit}>Submit Answers</button>}
        </div>
      )}

      {result && !attempt.isPractice && (
        <div className="card">
          <h4>Result</h4>
          <div>Score: {result.score} / {result.total} ({Math.round(result.percentage)}%)</div>
          <div>Passed: {result.isPassed ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* New CBT Engine Tests Section */}
      {selectedClassId && cbtTests.length > 0 && (
        <div className="card" style={{ marginTop: '16px', border: '2px solid #8b5cf6' }}>
          <h4>🚀 New Test Engine Assessments</h4>
          <div style={{ display: 'grid', gap: '10px' }}>
            {cbtTests.map(t => (
              <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f3ff', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <strong>{t.title}</strong>
                  <div style={{ fontSize: '12px', color: '#6d28d9', marginTop: '4px' }}>
                    {t.durationMinutes} Minutes • {t.questions?.length || 0} Questions
                  </div>
                  {t.description && <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{t.description}</div>}
                </div>
                <button 
                  onClick={() => setActiveCbtTestId(t._id)}
                  style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Take Test
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Wins Components */}
      {selectedClassId && (
        <>
          <Announcements classId={selectedClassId} isTeacher={false} />
          <Leaderboard classId={selectedClassId} studentId={token ? JSON.parse(localStorage.getItem('auth'))?.userId : null} isStudent={true} />
          <Certificates studentId={token ? JSON.parse(localStorage.getItem('auth'))?.userId : null} isStudent={true} />
          <StudyMaterials classId={selectedClassId} isTeacher={false} />
        </>
      )}
        </>
      )}
    </div>
  )
}
