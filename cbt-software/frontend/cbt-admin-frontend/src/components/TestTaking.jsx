import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TestTaking = ({ testId, onBack }) => {
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    startTest();
  }, [testId]);

  const startTest = async () => {
    try {
      setLoading(true);
      // 1. Fetch test details (questions)
      const testRes = await api.get(`/api/test-engine/${testId}`);
      const testData = testRes.test;
      setTest(testData);

      // 2. Start attempt
      const attemptRes = await api.post(`/api/test-engine/${testId}/start`);
      const attemptData = attemptRes.attempt;
      setAttempt(attemptData);

      // Initialize answers if resuming
      const initialAnswers = {};
      if (attemptData.responses && attemptData.responses.length > 0) {
        attemptData.responses.forEach(r => {
          initialAnswers[r.questionId] = r.answer;
        });
      }
      setAnswers(initialAnswers);

      // Set timer based on start time and duration
      const startTime = new Date(attemptData.startTime).getTime();
      const endTime = startTime + (testData.durationMinutes * 60 * 1000);
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
      submitTest(); // auto-submit when time is up
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attempt?.status]);

  // Auto-save logic
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || Object.keys(answers).length === 0) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        const formattedResponses = Object.keys(answers).map(qId => ({
          questionId: qId,
          answer: answers[qId]
        }));
        await api.patch(`/api/test-engine/${testId}/save-progress`, {
          responses: formattedResponses
        });
      } catch (err) {
        console.error('Failed to auto-save:', err);
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [answers, attempt, testId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };

  const submitTest = async () => {
    if (!attempt || attempt.status !== 'in_progress') return;
    
    try {
      setSubmitting(true);
      
      const formattedResponses = Object.keys(answers).map(qId => ({
        questionId: qId,
        answer: answers[qId]
      }));

      const res = await api.post(`/api/test-engine/${testId}/submit`, {
        responses: formattedResponses
      });
      
      setAttempt(res.attempt); // Now contains final score and status

    } catch (err) {
      setError(err.message || 'Failed to submit test');
      setSubmitting(false); // Only allow retry if it errored, otherwise remains true to disable UI
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div>Loading test...</div>;
  if (error) return <div><p style={{color:'red'}}>{error}</p><button onClick={onBack}>Go Back</button></div>;
  if (!test) return <div>Test not found</div>;

  // View: Completed / Submitted
  if (attempt?.status === 'submitted' || attempt?.status === 'graded') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <h2>Test Submitted Successfully</h2>
        <div style={{ margin: '30px 0', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h1 style={{ fontSize: '48px', color: attempt.percentage >= 50 ? 'green' : 'red', margin: '0' }}>
            {attempt.percentage}%
          </h1>
          <p>You scored {attempt.score} points.</p>
        </div>
        <button onClick={onBack} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  // View: Taking Test
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '2px solid #eee' }}>
        <h2>{test.title}</h2>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: timeLeft < 60 ? 'red' : 'inherit' }}>
          Time Left: {formatTime(timeLeft)}
        </div>
      </div>

      {test.description && <p style={{ marginBottom: '20px', color: '#666' }}>{test.description}</p>}

      <div className="questions-container">
        {test.questions.map((q, index) => (
          <div key={q._id} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>{index + 1}. {q.text} <span style={{color: '#888', fontSize: '12px', fontWeight: 'normal'}}>({q.points} pt)</span></h4>
            
            {q.type === 'multiple_choice' || q.type === 'true_false' ? (
              <div>
                {q.options.filter(opt => opt).map((opt, i) => (
                  <label key={i} style={{ display: 'block', margin: '10px 0', padding: '10px', background: answers[q._id] === opt ? '#e3f2fd' : '#f9f9f9', borderRadius: '4px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name={`question-${q._id}`} 
                      value={opt}
                      checked={answers[q._id] === opt}
                      onChange={() => handleAnswerChange(q._id, opt)}
                      style={{ marginRight: '10px' }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <input 
                type="text" 
                value={answers[q._id] || ''}
                onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                placeholder="Type your answer here..."
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button 
          onClick={submitTest} 
          disabled={submitting}
          style={{ padding: '15px 40px', fontSize: '18px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {submitting ? 'Submitting...' : 'Submit Test'}
        </button>
      </div>
    </div>
  );
};

export default TestTaking;
