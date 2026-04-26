import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';

export default function AnalyticsDashboard({ token }) {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [insights, setInsights] = useState(null);
  const [overall, setOverall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [token]);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassInsights(selectedClassId);
    }
  }, [selectedClassId]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const [classRes, overallRes] = await Promise.all([
        api.get('/api/classes', token),
        api.get('/api/reports/overall-performance', token)
      ]);
      setClasses(classRes.classes || []);
      setOverall(overallRes);
      if (classRes.classes?.length > 0) {
        setSelectedClassId(classRes.classes[0]._id);
      }
    } catch (err) {
      setError('Failed to load initial analytics');
    } finally {
      setLoading(false);
    }
  }

  async function fetchClassInsights(classId) {
    try {
      const data = await api.get(`/api/analytics/class-insights/${classId}`, token);
      setInsights(data);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  }

  if (loading && !overall) return <div className="card">Loading Analytics...</div>;

  return (
    <div className="analytics-container">
      <div className="card" style={{ marginBottom: '20px', background: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ margin: 0 }}>📊 Performance Analytics</h3>
            <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>Insights for {classes.find(c => c._id === selectedClassId)?.name || 'Class'}</p>
          </div>
          <select 
            value={selectedClassId} 
            onChange={(e) => setSelectedClassId(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minWidth: '200px' }}
          >
            <option value="">-- Select Class --</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* At-Risk Students Card */}
        <div className="card" style={{ borderTop: '4px solid #ef4444' }}>
          <h4 style={{ marginTop: 0, color: '#991b1b' }}>🚨 Early Warning: At-Risk Students</h4>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>Students with declining performance or low averages.</p>
          
          {insights?.atRiskStudents?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {insights.atRiskStudents.map(student => (
                <div key={student.id} style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                  <div style={{ fontWeight: 'bold', color: '#b91c1c' }}>{student.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '5px' }}>
                    <span>{student.reason}</span>
                    <span style={{ fontWeight: 'bold' }}>{student.latestScore}%</span>
                  </div>
                  {student.drop > 0 && (
                    <div style={{ width: '100%', height: '4px', background: '#e2e8f0', marginTop: '8px', borderRadius: '2px' }}>
                      <div style={{ width: `${student.drop}%`, height: '100%', background: '#ef4444', borderRadius: '2px' }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#16a34a', fontWeight: '500' }}>
              ✅ No students currently flagged at risk.
            </div>
          )}
        </div>

        {/* Subject Weakness Card */}
        <div className="card" style={{ borderTop: '4px solid #f59e0b' }}>
          <h4 style={{ marginTop: 0, color: '#92400e' }}>📚 Subject Performance (Weakness Analysis)</h4>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>Average class performance per subject tag.</p>
          
          {insights?.subjectPerformance?.length > 0 ? (
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.subjectPerformance} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="subject" type="category" width={100} axisLine={false} tickLine={false} style={{ fontSize: '12px', fontWeight: '500' }} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                    {insights.subjectPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score < 50 ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              No data available for subjects.
            </div>
          )}
        </div>
      </div>

      {/* Class Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Class Average</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>
            {overall?.averageScore?.toFixed(1) || '0'}%
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Highest Performance</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            {insights?.subjectPerformance?.length > 0 ? Math.max(...insights.subjectPerformance.map(s => s.score)) : 0}%
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Critical Subjects</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
            {insights?.subjectPerformance?.filter(s => s.score < 50).length || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
