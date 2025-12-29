import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function TestForm({ token, test, onTestCreated, onTestUpdated }) {
  const [testName, setTestName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passScorePercentage, setPassScorePercentage] = useState(50);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [questionDistribution, setQuestionDistribution] = useState([{ subject: '', count: 10 }]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (test) {
      setTestName(test.testName);
      setDurationMinutes(test.durationMinutes);
      setPassScorePercentage(test.passScorePercentage);
      setAvailableFrom(test.availableFrom ? new Date(test.availableFrom).toISOString().slice(0, 16) : '');
      setAvailableUntil(test.availableUntil ? new Date(test.availableUntil).toISOString().slice(0, 16) : '');
      setQuestionDistribution(test.questionDistribution);
    }
  }, [test]);

  const handleDistributionChange = (index, field, value) => {
    const newDistribution = [...questionDistribution];
    newDistribution[index][field] = value;
    setQuestionDistribution(newDistribution);
  };

  const addDistributionRow = () => {
    setQuestionDistribution([...questionDistribution, { subject: '', count: 10 }]);
  };

  const removeDistributionRow = (index) => {
    const newDistribution = [...questionDistribution];
    newDistribution.splice(index, 1);
    setQuestionDistribution(newDistribution);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const payload = {
      testName,
      durationMinutes,
      passScorePercentage,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      availableUntil: availableUntil ? new Date(availableUntil) : null,
      questionDistribution,
    };

    try {
      if (test) {
        const res = await api.put(`/api/tests/${test._id}`, payload, token);
        if (res.test) {
          setMessage('Test updated successfully!');
          onTestUpdated(res.test);
        } else {
          setMessage(res.message || 'Failed to update test.');
        }
      } else {
        const res = await api.post('/api/tests', payload, token);
        if (res.test) {
          setMessage('Test created successfully!');
          onTestCreated(res.test);
          // Clear form
          setTestName('');
          setDurationMinutes(60);
          setPassScorePercentage(50);
          setAvailableFrom('');
          setAvailableUntil('');
          setQuestionDistribution([{ subject: '', count: 10 }]);
        } else {
          setMessage(res.message || 'Failed to create test.');
        }
      }
    } catch (err) {
      setMessage(err.message || 'An error occurred.');
    }
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h4>{test ? 'Edit Test' : 'Create New Test'}</h4>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Test Name</label>
          <input value={testName} onChange={(e) => setTestName(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Duration (minutes)</label>
          <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Pass Score (%)</label>
          <input type="number" value={passScorePercentage} onChange={(e) => setPassScorePercentage(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Available From</label>
          <input type="datetime-local" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Available Until</label>
          <input type="datetime-local" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Question Distribution</label>
          {questionDistribution.map((dist, index) => (
            <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={dist.subject}
                onChange={(e) => handleDistributionChange(index, 'subject', e.target.value)}
                placeholder="Subject"
              />
              <input
                type="number"
                value={dist.count}
                onChange={(e) => handleDistributionChange(index, 'count', e.target.value)}
                placeholder="Count"
              />
              <button type="button" onClick={() => removeDistributionRow(index)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addDistributionRow}>
            Add Subject
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">{test ? 'Update Test' : 'Create Test'}</button>
        </div>
        {message && <div style={{ marginTop: 8, color: message.includes('success') ? 'green' : 'red' }}>{message}</div>}
      </form>
    </div>
  );
}
