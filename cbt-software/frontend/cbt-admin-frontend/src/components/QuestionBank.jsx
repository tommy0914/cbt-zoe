import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function QuestionBank({ token }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (token) {
      fetchSubjects();
      fetchQuestions();
    }
  }, [token]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/api/questions/subjects', token);
      if (res && res.subjects) setSubjects(res.subjects);
    } catch (err) {
      console.error('Failed to fetch subjects');
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const url = selectedSubject === 'all' 
        ? '/api/questions' 
        : `/api/questions/by-subject/${encodeURIComponent(selectedSubject)}`;
      const res = await api.get(url, token);
      
      let data = [];
      if (Array.isArray(res)) {
        data = res;
      } else if (res && res.questions) {
        data = res.questions;
      } else if (res && typeof res === 'object') {
        data = res.data || [];
      }
      
      setQuestions(data);
    } catch (err) {
      console.error('Failed to fetch questions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchQuestions();
  }, [selectedSubject, token]);

  const filteredQuestions = (questions || []).filter(q => {
    const textMatch = q.text?.toLowerCase().includes(searchTerm.toLowerCase());
    const tagMatch = q.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return textMatch || tagMatch;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/api/questions/${id}`, token);
      setQuestions(questions.filter(q => (q.id || q._id) !== id));
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  return (
    <div className="question-bank" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>⬅️</button>
              📚 Question Bank
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '300px', justifyContent: 'flex-end' }}>
            <input 
              placeholder="Search questions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1, maxWidth: '300px' }}
            />
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <h3>No questions found</h3>
          <button onClick={() => {setSearchTerm(''); setSelectedSubject('all')}} style={{ marginTop: '15px', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Clear all filters</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredQuestions.map((q, idx) => (
            <div key={q.id || q._id} className="card" style={{ borderLeft: '5px solid #6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px' }}>
                  Question #{idx + 1}
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {q.tags?.map(tag => (
                    <span key={tag} style={{ background: '#eef2ff', color: '#4338ca', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                      {tag}
                    </span>
                  ))}
                  <button onClick={() => handleDelete(q.id || q._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>

              <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', lineHeight: '1.5' }}>
                {q.text}
              </div>

              {q.imageUrl && (
                <div style={{ marginBottom: '20px' }}>
                  <img src={q.imageUrl} alt="Diagram" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                {(q.options || []).map((opt, i) => {
                  const isCorrect = String(opt).trim() === String(q.correctAnswer).trim();
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        border: '2px solid',
                        background: isCorrect ? '#f0fdf4' : '#fff',
                        borderColor: isCorrect ? '#22c55e' : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <span style={{ fontWeight: 'bold', color: isCorrect ? '#16a34a' : '#94a3b8' }}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <span style={{ color: isCorrect ? '#15803d' : '#334155', fontWeight: isCorrect ? 'bold' : 'normal' }}>
                        {opt}
                      </span>
                      {isCorrect && <span style={{ marginLeft: 'auto' }}>✅ (Correct Answer)</span>}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #cbd5e1', fontSize: '14px', color: '#475569' }}>
                  <strong>💡 Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
