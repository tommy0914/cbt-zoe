import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import Announcements from '../components/Announcements'
import Leaderboard from '../components/Leaderboard'
import Certificates from '../components/Certificates'

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
        // console.error('Failed to load classes', err)
      }
    }
    loadClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, pageSize])

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

  return (
    <div onCopy={(e) => e.preventDefault()} onPaste={(e) => e.preventDefault()}>
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

      {/* Quick Wins Components */}
      {selectedClassId && (
        <>
          <Announcements classId={selectedClassId} isTeacher={false} />
          <Leaderboard classId={selectedClassId} studentId={token ? JSON.parse(localStorage.getItem('auth'))?.userId : null} isStudent={true} />
          <Certificates studentId={token ? JSON.parse(localStorage.getItem('auth'))?.userId : null} isStudent={true} />
        </>
      )}
    </div>
  )
}
