import React, { useState } from 'react';
import api from '../services/api';

export default function QuestionForm({ token }) {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('multiple-choice');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [subject, setSubject] = useState('General');
  const [message, setMessage] = useState(null);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const payload = {
      questionText,
      questionType,
      subject,
    };

    if (questionType === 'multiple-choice' || questionType === 'true-false') {
      payload.options = options.filter(o => o);
      payload.correctAnswer = correctAnswer;
    } else if (questionType === 'fill-in-the-blank') {
      payload.correctAnswer = correctAnswer;
    }

    try {
      const res = await api.post('/api/questions', payload, token);
      if (res.question) {
        setMessage('Question created successfully!');
        // Clear form
        setQuestionText('');
        setQuestionType('multiple-choice');
        setOptions(['', '', '', '']);
        setCorrectAnswer('');
        setSubject('General');
      } else {
        setMessage(res.message || 'Failed to create question.');
      }
    } catch (err) {
      setMessage(err.message || 'An error occurred.');
    }
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h4>Create New Question</h4>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Question Type</label>
          <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="fill-in-the-blank">Fill-in-the-Blank</option>
            <option value="essay">Essay</option>
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Question Text</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows="3"
            style={{ width: '100%' }}
          />
        </div>
        {(questionType === 'multiple-choice' || questionType === 'true-false') && (
          <div style={{ marginTop: 8 }}>
            <label>Options</label>
            {options.map((option, index) => (
              <div key={index}>
                <input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
              </div>
            ))}
          </div>
        )}
        {questionType !== 'essay' && (
          <div style={{ marginTop: 8 }}>
            <label>Correct Answer</label>
            <input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} />
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <button type="submit">Create Question</button>
        </div>
        {message && <div style={{ marginTop: 8, color: message.includes('success') ? 'green' : 'red' }}>{message}</div>}
      </form>
    </div>
  );
}
