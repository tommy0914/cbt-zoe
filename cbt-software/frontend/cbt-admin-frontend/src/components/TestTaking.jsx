import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TestTaking = ({ testId, onBack }) => {
  const token = JSON.parse(localStorage.getItem('auth'))?.token;
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [violationCount, setViolationCount] = useState(0);

  useEffect(() => {
    if (testId && token) {
      startTest();
    } else if (!token) {
      setError('Authentication token missing. Please log in again.');
      setLoading(false);
    }
  }, [testId, token]);

  // Proctoring: Detect tab switching / window blur
  useEffect(() => {
    if (attempt?.status !== 'in_progress') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationCount(prev => prev + 1);
        alert('SECURITY ALERT: Tab switching is not allowed during the exam. This incident has been logged.');
      }
    };

    const handleBlur = () => {
      setViolationCount(prev => prev + 1);
      console.warn('Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [attempt?.status]);

  // Auto-submit if violations are too many (optional, e.g., > 5)
  useEffect(() => {
    if (violationCount > 5 && attempt?.status === 'in_progress') {
      alert('EXAM TERMINATED: Too many security violations detected. Your paper is being submitted automatically.');
      submitTest();
    }
  }, [violationCount]);

  const startTest = async () => {
    try {
      setLoading(true);
      const testRes = await api.get(`/api/test-engine/${testId}`, token);
      const testData = testRes.test || testRes;
      setTest(testData);

      const attemptRes = await api.post(`/api/test-engine/${testId}/start`, {}, token);
      const attemptData = attemptRes.attempt || attemptRes;
      setAttempt(attemptData);

      const initialAnswers = {};
      if (attemptData.responses && attemptData.responses.length > 0) {
        attemptData.responses.forEach(r => {
          initialAnswers[r.questionId] = r.answer;
        });
      }
      setAnswers(initialAnswers);

      const startTime = new Date(attemptData.startTime).getTime();
      const duration = testData.durationMinutes || 60;
      const endTime = startTime + (duration * 60 * 1000);
      const remainingSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);

    } catch (err) {
      setError(err.message || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft === null || attempt?.status !== 'in_progress') return;
    if (timeLeft <= 0) {
      submitTest();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, attempt?.status]);

  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || Object.keys(answers).length === 0 || !token) return;
    const autoSaveInterval = setInterval(async () => {
      try {
        const formattedResponses = Object.keys(answers).map(qId => ({
          questionId: qId,
          answer: answers[qId]
        }));
        await api.patch(`/api/test-engine/${testId}/save-progress`, {
          responses: formattedResponses
        }, token);
      } catch (err) {
        console.error('Failed to auto-save:', err);
      }
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [answers, attempt, testId, token]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const submitTest = async () => {
    if (!attempt || attempt.status !== 'in_progress' || !token) return;
    try {
      setSubmitting(true);
      const formattedResponses = Object.keys(answers).map(qId => ({
        questionId: qId,
        answer: answers[qId]
      }));
      const res = await api.post(`/api/test-engine/${testId}/submit`, {
        responses: formattedResponses
      }, token);
      setAttempt(res.attempt || res);
    } catch (err) {
      setError(err.message || 'Failed to submit test');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading assessment...</div>;
  if (error) return <div className="card" style={{ textAlign: 'center', padding: '40px' }}><p style={{color:'red', fontWeight: 'bold'}}>{error}</p><button onClick={onBack}>Go Back</button></div>;
  if (!test) return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Test not found.</div>;

  if (attempt?.status === 'submitted' || attempt?.status === 'graded') {
    const isPassed = attempt.totalScore >= (test.passingMarks || 0);
    return (
      <div id="printable-result" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px' }}>
          <h2 style={{ color: '#1e293b' }}>Assessment Result</h2>
          <div style={{ margin: '30px 0', padding: '30px', background: isPassed ? '#f0fdf4' : '#fef2f2', borderRadius: '12px', border: `2px solid ${isPassed ? '#bbf7d0' : '#fecaca'}` }}>
            <div style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Final Score</div>
            <h1 style={{ fontSize: '64px', color: isPassed ? '#16a34a' : '#dc2626', margin: '0' }}>{attempt.percentage}%</h1>
            <p style={{ fontSize: '18px', color: '#334155', marginTop: '10px' }}>
              Scored <strong>{attempt.totalScore}</strong> out of <strong>{test.totalMarks}</strong> points.
            </p>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handlePrint} style={{ padding: '12px 30px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Print Result</button>
            <button onClick={onBack} style={{ padding: '12px 30px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Return to Portal</button>
          </div>
        </div>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .card { border: none !important; box-shadow: none !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div className="card" style={{ position: 'sticky', top: '10px', zIndex: 100, marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>{test.title}</h2>
          <div style={{ fontSize: '13px', color: '#64748b' }}>{test.questions?.length || 0} Questions • {test.totalMarks} Points</div>
        </div>
        <div style={{ textAlign: 'right', padding: '10px 20px', background: timeLeft < 60 ? '#fef2f2' : '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>TIME REMAINING</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: timeLeft < 60 ? '#dc2626' : '#1e293b' }}>{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className="questions-container">
        {(test.questions || []).map((q, index) => (
          <div key={q._id} className="card" style={{ marginBottom: '25px', padding: '25px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ background: '#4f46e5', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>{index + 1}</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>{q.text}</h4>
                
                {q.imageUrl && (
                  <div style={{ marginBottom: '20px' }}>
                    <img src={q.imageUrl} alt="Question diagram" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  </div>
                )}

                {q.formula && (
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontStyle: 'italic', color: '#0f172a' }}>
                    {q.formula}
                  </div>
                )}
                
                <div style={{ display: 'grid', gap: '12px' }}>
                  {(q.options || []).filter(opt => opt).map((opt, i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', padding: '15px', background: answers[q._id] === opt ? '#eff6ff' : '#f8fafc', borderRadius: '8px', cursor: 'pointer', border: `2px solid ${answers[q._id] === opt ? '#3b82f6' : 'transparent'}` }}>
                      <input type="radio" name={`q-${q._id}`} value={opt} checked={answers[q._id] === opt} onChange={() => handleAnswerChange(q._id, opt)} style={{ marginRight: '15px' }} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center', paddingBottom: '100px' }}>
        <button onClick={submitTest} disabled={submitting} style={{ padding: '18px 60px', fontSize: '20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
          {submitting ? '🚀 Submitting...' : '✅ Finish and Submit'}
        </button>
      </div>
    </div>
  );
};

export default TestTaking;
