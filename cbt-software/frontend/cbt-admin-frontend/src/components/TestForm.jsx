import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function TestForm({ token, test, schoolId, onTestCreated, onTestUpdated }) {
  const [testName, setTestName] = useState('');
  const [classId, setClassId] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passScorePercentage, setPassScorePercentage] = useState(50);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [questionDistribution, setQuestionDistribution] = useState([{ subject: '', count: 10 }]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Fetch available classes
    const fetchClasses = async () => {
      try {
        const url = schoolId ? `/api/classes?schoolId=${schoolId}` : '/api/classes';
        const res = await api.get(url, token);
        if (res.classes) setAvailableClasses(res.classes);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };
    fetchClasses();

    if (test) {
      setTestName(test.testName || test.title);
      setDurationMinutes(test.durationMinutes);
      setPassScorePercentage(test.passScorePercentage);
      setAvailableFrom(test.availableFrom ? new Date(test.availableFrom).toISOString().slice(0, 16) : '');
      setAvailableUntil(test.availableUntil ? new Date(test.availableUntil).toISOString().slice(0, 16) : '');
      setQuestionDistribution(test.questionDistribution || [{ subject: '', count: 10 }]);
      if (test.classId) setClassId(test.classId);
    }
  }, [test, schoolId, token]);

  // Update available subjects when class changes
  useEffect(() => {
    if (classId) {
      const selectedClass = availableClasses.find(c => c._id === classId);
      if (selectedClass && selectedClass.subjects && selectedClass.subjects.length > 0) {
        setAvailableSubjects(selectedClass.subjects);
      } else {
        // Fetch global subjects if class has none
        const fetchGlobalSubjects = async () => {
          try {
            const res = await api.get('/api/questions/subjects', token);
            if (res.subjects) setAvailableSubjects(res.subjects);
          } catch (err) {
            console.error('Failed to fetch global subjects:', err);
          }
        };
        fetchGlobalSubjects();
      }
    }
  }, [classId, availableClasses, token]);

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
    if (!classId) return setMessage('Please select a class for this test.');
    
    setMessage(null);
    const payload = {
      testName,
      classId,
      durationMinutes: Number(durationMinutes),
      passScorePercentage: Number(passScorePercentage),
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
          setClassId('');
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
    <div className="card" style={{ marginTop: 20, border: '1px solid #e2e8f0' }}>
      <h4 style={{ marginTop: 0 }}>{test ? 'Edit Test' : 'Create New Test'}</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontWeight: '600' }}>Target Class *</label>
          <select 
            value={classId} 
            onChange={(e) => setClassId(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          >
            <option value="">-- Select Class --</option>
            {availableClasses.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontWeight: '600' }}>Test Name *</label>
          <input 
            value={testName} 
            onChange={(e) => setTestName(e.target.value)} 
            required 
            placeholder="e.g. Mid-Term Examination"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: '600' }}>Duration (min) *</label>
            <input 
              type="number" 
              value={durationMinutes} 
              onChange={(e) => setDurationMinutes(e.target.value)} 
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: '600' }}>Pass Score (%) *</label>
            <input 
              type="number" 
              value={passScorePercentage} 
              onChange={(e) => setPassScorePercentage(e.target.value)} 
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: '600' }}>Available From</label>
            <input type="datetime-local" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: '600' }}>Available Until</label>
            <input type="datetime-local" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>
        </div>

        <div style={{ marginTop: 16, padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
          <label style={{ fontWeight: '700', color: '#1e293b', display: 'block', marginBottom: '8px' }}>📚 Question Distribution</label>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
            Pick subjects from the class list. The system will randomly select questions from the bank for these subjects.
          </p>
          
          {questionDistribution.map((dist, index) => (
            <div key={index} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 2 }}>
                <select
                  value={dist.subject}
                  onChange={(e) => handleDistributionChange(index, 'subject', e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">-- Select Subject --</option>
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  <option value="custom">-- Custom Subject --</option>
                </select>
                {dist.subject === 'custom' && (
                  <input
                    placeholder="Type subject name"
                    onChange={(e) => handleDistributionChange(index, 'subject', e.target.value)}
                    style={{ marginTop: '5px', width: '100%', padding: '6px' }}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  value={dist.count}
                  onChange={(e) => handleDistributionChange(index, 'count', e.target.value)}
                  placeholder="Count"
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <button 
                type="button" 
                onClick={() => removeDistributionRow(index)}
                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '4px' }}
              >
                ✕
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={addDistributionRow}
            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '600' }}
          >
            + Add Subject to Test
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
              color: 'white', 
              fontWeight: 'bold', 
              fontSize: '16px',
              border: 'none',
              borderRadius: '6px'
            }}
          >
            {test ? '💾 Update Assessment' : '🚀 Create Assessment'}
          </button>
        </div>
        
        {message && (
          <div style={{ 
            marginTop: 15, 
            padding: '10px', 
            borderRadius: '4px', 
            background: message.includes('success') ? '#f0fdf4' : '#fef2f2',
            color: message.includes('success') ? '#16a34a' : '#dc2626',
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
