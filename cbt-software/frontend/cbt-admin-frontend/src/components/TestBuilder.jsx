import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TestBuilder = ({ initialClassId }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Test configuration state
  const [testConfig, setTestConfig] = useState({
    title: '',
    description: '',
    durationMinutes: 60,
    classId: initialClassId || '',
    shuffleQuestions: false,
    showAnswerAfterSubmit: true
  });

  // Questions state
  const [questions, setQuestions] = useState([{
    text: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1
  }]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/api/classes');
      setClasses(response.classes || []);
      if (response.classes && response.classes.length > 0) {
        setTestConfig(prev => ({ ...prev, classId: initialClassId || prev.classId || response.classes[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes.');
    }
  };

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTestConfig({
      ...testConfig,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    
    // Auto-adjust correct answer format for true/false
    if (field === 'type' && value === 'true_false') {
      updated[index].options = ['True', 'False'];
      updated[index].correctAnswer = 'True';
    } else if (field === 'type' && value === 'multiple_choice' && updated[index].options.length === 2) {
       updated[index].options = ['', '', '', ''];
    }
    
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1
    }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const updated = [...questions];
      updated.splice(index, 1);
      setQuestions(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Basic validation
      if (!testConfig.title) throw new Error("Title is required");
      if (!testConfig.classId) throw new Error("Please select a class");
      
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text) throw new Error(`Question ${i + 1} text is empty`);
        if (!q.correctAnswer) throw new Error(`Question ${i + 1} is missing a correct answer`);
        
        if (q.type === 'multiple_choice') {
           if (q.options.some(opt => !opt.trim())) {
               throw new Error(`Question ${i + 1} has empty options`);
           }
           if (!q.options.includes(q.correctAnswer)) {
               throw new Error(`Question ${i + 1} correct answer must exactly match one of its options`);
           }
        }
      }

      await api.post('/api/test-engine/create', {
        ...testConfig,
        questions
      });

      setSuccess(true);
      // Reset form on success
      setTestConfig({ ...testConfig, title: '', description: '' });
      setQuestions([{ text: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }]);
      
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-builder-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Create New Test Engine Quiz</h2>
      
      {error && <div className="alert-error" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
      {success && <div className="alert-success" style={{ color: 'green', marginBottom: '15px' }}>Test created successfully!</div>}

      <form onSubmit={handleSubmit}>
        <div className="config-section" style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>Test Configuration</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Test Title *</label>
            <input type="text" name="title" value={testConfig.title} onChange={handleConfigChange} required style={{ width: '100%', padding: '8px' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Description</label>
            <textarea name="description" value={testConfig.description} onChange={handleConfigChange} style={{ width: '100%', padding: '8px' }} />
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Duration (Minutes) *</label>
              <input type="number" name="durationMinutes" value={testConfig.durationMinutes} onChange={handleConfigChange} required min="1" style={{ width: '100%', padding: '8px' }} />
            </div>
            
            <div style={{ flex: 1 }}>
              <label>Assign to Class *</label>
              <select name="classId" value={testConfig.classId} onChange={handleConfigChange} required style={{ width: '100%', padding: '8px' }}>
                <option value="">Select a class...</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <label>
              <input type="checkbox" name="shuffleQuestions" checked={testConfig.shuffleQuestions} onChange={handleConfigChange} />
              Shuffle Questions
            </label>
            <label>
              <input type="checkbox" name="showAnswerAfterSubmit" checked={testConfig.showAnswerAfterSubmit} onChange={handleConfigChange} />
              Show Answers to Students After Submit
            </label>
          </div>
        </div>

        <h3>Questions</h3>
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="question-card" style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', marginBottom: '15px', background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4>Question {qIndex + 1}</h4>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQuestion(qIndex)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Remove</button>
              )}
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label>Question Text *</label>
              <textarea value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} required style={{ width: '100%', padding: '8px' }} />
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label>Type</label>
                <select value={q.type} onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)} style={{ width: '100%', padding: '8px' }}>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>
              <div>
                <label>Points</label>
                <input type="number" value={q.points} onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value))} min="1" style={{ width: '80px', padding: '8px' }} />
              </div>
            </div>

            {(q.type === 'multiple_choice' || q.type === 'true_false') && (
              <div style={{ marginBottom: '10px' }}>
                <label>Options * (Select the radio button for the correct answer)</label>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                    <input 
                      type="radio" 
                      name={`correct-${qIndex}`} 
                      checked={q.correctAnswer === opt && opt !== ''} 
                      onChange={() => handleQuestionChange(qIndex, 'correctAnswer', opt)}
                      disabled={!opt}
                    />
                    {q.type === 'multiple_choice' ? (
                       <input 
                         type="text" 
                         value={opt} 
                         onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} 
                         placeholder={`Option ${oIndex + 1}`}
                         required
                         style={{ flex: 1, padding: '6px' }}
                       />
                    ) : (
                       <span>{opt}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {q.type === 'short_answer' && (
              <div style={{ marginBottom: '10px' }}>
                 <label>Correct Answer (Exact Match) *</label>
                 <input type="text" value={q.correctAnswer} onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)} required style={{ width: '100%', padding: '8px' }} />
              </div>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <button type="button" onClick={addQuestion} style={{ padding: '10px 20px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            + Add Question
          </button>
          
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>
            {loading ? 'Saving...' : 'Create Test'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestBuilder;
