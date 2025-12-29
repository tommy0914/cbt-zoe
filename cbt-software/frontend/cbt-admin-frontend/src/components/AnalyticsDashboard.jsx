import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../services/api';

export default function AnalyticsDashboard({ token }) {
  const [overall, setOverall] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [classPerformance, setClassPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchData() {
    try {
      setLoading(true);
      const [overallRes, difficultyRes, classPerfRes] = await Promise.all([
        api.get('/api/reports/overall-performance', token),
        api.get('/api/reports/question-difficulty', token),
        api.get('/api/reports/class-performance', token),
      ]);
      setOverall(overallRes);
      setDifficulty(difficultyRes);
      setClassPerformance(classPerfRes.classPerformance);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [token]);

  if (loading) return <div>Loading Analytics...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h4>Analytics Dashboard</h4>

      <div style={{ marginBottom: 40 }}>
        <h5>Overall Performance</h5>
        <p>
          <strong>Average Score:</strong> {overall?.averageScore?.toFixed(2) || 'N/A'}
        </p>
        <p>
          <strong>Total Attempts:</strong> {overall?.attempts || 'N/A'}
        </p>
      </div>

      <div style={{ marginBottom: 40 }}>
        <h5>Class Performance</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="className" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="averageScore" fill="#8884d8" name="Average Score" />
            <Bar dataKey="numberOfAttempts" fill="#82ca9d" name="Number of Attempts" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h5>Most Difficult Questions (Lowest Success Rate)</h5>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={difficulty?.difficultQuestions} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 1]} />
            <YAxis type="category" dataKey="questionText" width={350} />
            <Tooltip />
            <Legend />
            <Bar dataKey="successRate" fill="#ffc658" name="Success Rate" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
