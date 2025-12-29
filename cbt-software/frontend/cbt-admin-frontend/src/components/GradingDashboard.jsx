import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function GradingDashboard({ token }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchUngradedAttempts() {
    try {
      setLoading(true);
      const res = await api.get('/api/attempts/grading', token);
      if (res.pendingGrading) {
        setAttempts(res.pendingGrading);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch attempts for grading.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUngradedAttempts();
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h4>Essays Pending Grading</h4>
      {attempts.length === 0 ? (
        <p>No essays are currently pending grading.</p>
      ) : (
        attempts.map((attempt) => (
          <div key={attempt._id} className="card" style={{ marginBottom: 12 }}>
            <h5>
              Attempt by {attempt.userId?.username || 'Unknown User'} on {new Date(attempt.startTime).toLocaleString()}
            </h5>
            {attempt.userAnswers
              .filter((answer) => !answer.grade && attempt.questions.some(q => q._id === answer.questionId.toString() && q.questionType === 'essay'))
              .map((answer) => (
                <EssayGradingForm key={answer.questionId} token={token} attemptId={attempt._id} answer={answer} questions={attempt.questions} onGradeSubmitted={fetchUngradedAttempts} />
              ))}
          </div>
        ))
      )}
    </div>
  );
}

function EssayGradingForm({ token, attemptId, answer, questions, onGradeSubmitted }) {
  const [grade, setGrade] = useState('');
  const [message, setMessage] = useState(null);
  const question = questions.find(q => q._id === answer.questionId.toString());

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (grade === '' || isNaN(parseInt(grade, 10))) {
      setMessage('Please enter a valid number for the grade.');
      return;
    }

    try {
      const res = await api.post(
        '/api/attempts/grading',
        { attemptId, questionId: answer.questionId, grade: parseInt(grade, 10) },
        token,
      );
      if (res.attempt) {
        setMessage('Grade submitted successfully!');
        onGradeSubmitted(); // Refresh the list
      } else {
        setMessage(res.message || 'Failed to submit grade.');
      }
    } catch (err) {
      setMessage(err.message || 'An error occurred.');
    }
  }

  if (!question) return null;

  return (
    <div style={{ borderTop: '1px solid #ccc', paddingTop: 12, marginTop: 12 }}>
      <strong>Question:</strong>
      <p>{question.questionText}</p>
      <strong>Student's Answer:</strong>
      <p>{answer.selectedAnswer}</p>
      <form onSubmit={handleSubmit}>
        <label>Grade:</label>
        <input type="number" value={grade} onChange={(e) => setGrade(e.target.value)} style={{ marginLeft: 8, width: 80 }} />
        <button type="submit" style={{ marginLeft: 8 }}>
          Submit Grade
        </button>
        {message && <div style={{ marginTop: 8, color: message.includes('success') ? 'green' : 'red' }}>{message}</div>}
      </form>
    </div>
  );
}
