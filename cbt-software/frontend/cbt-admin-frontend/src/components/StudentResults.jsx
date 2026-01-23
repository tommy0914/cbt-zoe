import React, { useState, useEffect } from 'react';
import '../styles/StudentResults.css';
import ReportCard from './ReportCard';

const StudentResults = ({ classId, className, onClose }) => {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailedResult, setDetailedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // list, detail, reportcard
  const [notes, setNotes] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [showReportCard, setShowReportCard] = useState(null);
  const [reportCardData, setReportCardData] = useState(null);

  // Fetch class students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch(`/api/classes/${classId}/students`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students || []);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    if (classId) {
      fetchStudents();
    }
  }, [classId]);

  // Fetch all results for the class
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reports/student-results/${classId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchResults();
    }
  }, [classId]);

  // Generate result for selected student
  const handleGenerateResult = async () => {
    if (!selectedStudent) {
      setMessage('Please select a student');
      return;
    }

    try {
      setGenerating(true);
      setMessage('Generating result...');

      const response = await fetch(`/api/reports/generate-student-result/${selectedStudent}/${classId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Result generated successfully! ✓');
        setDetailedResult(data.result);
        setActiveTab('detail');

        // Refresh results list
        const refreshResponse = await fetch(`/api/reports/student-results/${classId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setResults(refreshData.results || []);
        }

        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating result:', error);
      setMessage('Failed to generate result');
    } finally {
      setGenerating(false);
    }
  };

  // View detailed result
  const handleViewResult = async (resultId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/student-result/${resultId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDetailedResult(data);
        setNotes(data.notes || '');
        setActiveTab('detail');
      } else {
        setMessage('Failed to load result details');
      }
    } catch (error) {
      console.error('Error fetching result:', error);
      setMessage('Error loading result');
    } finally {
      setLoading(false);
    }
  };

  // Update notes
  const handleUpdateNotes = async () => {
    if (!detailedResult) return;

    try {
      const response = await fetch(`/api/reports/student-result/${detailedResult._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        const data = await response.json();
        setDetailedResult(data.result);
        setMessage('Notes updated successfully! ✓');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      setMessage('Failed to update notes');
    }
  };

  // Export result to CSV
  const handleExportResult = (result) => {
    const csv = [
      ['Student Result Report'],
      ['Student Name', result.studentName],
      ['Email', result.studentEmail],
      ['Class', result.className],
      ['Date Generated', new Date(result.generatedAt).toLocaleDateString()],
      [],
      ['Performance Summary'],
      ['Total Tests', result.totalTestsTaken],
      ['Average Score', result.averageScore.toFixed(2)],
      ['Highest Score', result.highestScore],
      ['Lowest Score', result.lowestScore],
      ['Passing Rate', `${result.passingRate.toFixed(2)}%`],
      ['Performance Grade', result.performanceGrade],
      [],
      ['Test Details'],
      ['Test Name', 'Score', 'Correct Answers', 'Total Questions', 'Duration (min)', 'Status', 'Completed At']
    ];

    result.testAttempts.forEach(test => {
      csv.push([
        test.testName,
        test.score,
        test.correctAnswers,
        test.totalQuestions,
        test.duration,
        test.status,
        new Date(test.completedAt).toLocaleDateString()
      ]);
    });

    if (result.notes) {
      csv.push([]);
      csv.push(['Teacher Notes', result.notes]);
    }

    const csvContent = csv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.studentName}_result_${Date.now()}.csv`;
    a.click();
  };

  // Delete result
  const handleDeleteResult = async (resultId) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;

    try {
      const response = await fetch(`/api/reports/student-result/${resultId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        setMessage('Result deleted successfully ✓');
        setResults(results.filter(r => r._id !== resultId));
        setActiveTab('list');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      setMessage('Failed to delete result');
    }
  };

  // Generate Report Card
  const handleGenerateReportCard = async (resultId) => {
    try {
      setGenerating(true);
      setMessage('Generating report card...');

      const response = await fetch(`/api/reports/generate-report-card/${detailedResult.studentId._id}/${classId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          academicTerm: 'Term 1',
          academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReportCardData(data.reportCard);
        setShowReportCard(data.reportCard._id);
        setMessage('Report card generated successfully! ✓');
        setTimeout(() => setMessage(''), 2000);
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating report card:', error);
      setMessage('Failed to generate report card');
    } finally {
      setGenerating(false);
    }
  };

  // Filter results based on grade
  const filteredResults = filterGrade === 'all'
    ? results
    : results.filter(r => r.performanceGrade === filterGrade);

  return (
    <div className="student-results-modal">
      <div className="student-results-container">
        <div className="results-header">
          <h2>📊 Student Results - {className}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            📋 Results List
          </button>
          <button
            className={`tab-btn ${activeTab === 'detail' ? 'active' : ''}`}
            onClick={() => setActiveTab('detail')}
            disabled={!detailedResult}
          >
            📈 Detailed View
          </button>
          <button
            className={`tab-btn ${activeTab === 'reportcard' ? 'active' : ''}`}
            onClick={() => setActiveTab('reportcard')}
            disabled={!detailedResult}
          >
            🎓 Report Card
          </button>
        </div>

        {/* Results List Tab */}
        {activeTab === 'list' && (
          <div className="results-list-tab">
            <div className="generate-section">
              <h3>Generate New Result</h3>
              <div className="generate-form">
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="student-select"
                >
                  <option value="">-- Select Student --</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="Add optional notes (teacher observations, feedback, etc.)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="notes-textarea"
                  rows="3"
                />

                <button
                  className="generate-btn"
                  onClick={handleGenerateResult}
                  disabled={!selectedStudent || generating || loading}
                >
                  {generating ? '⏳ Generating...' : '🚀 Generate Result'}
                </button>
              </div>
            </div>

            <div className="results-section">
              <div className="results-header-row">
                <h3>Generated Results</h3>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Grades</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                  <option value="F">Grade F</option>
                </select>
              </div>

              {loading ? (
                <div className="loading">Loading results...</div>
              ) : filteredResults.length === 0 ? (
                <div className="no-results">No results found for this class</div>
              ) : (
                <div className="results-grid">
                  {filteredResults.map(result => (
                    <div key={result._id} className="result-card">
                      <div className="result-card-header">
                        <div>
                          <h4>{result.studentName}</h4>
                          <p className="email">{result.studentEmail}</p>
                        </div>
                        <div className={`grade-badge grade-${result.performanceGrade}`}>
                          {result.performanceGrade}
                        </div>
                      </div>

                      <div className="result-stats">
                        <div className="stat">
                          <span className="label">Average Score</span>
                          <span className="value">{result.averageScore.toFixed(2)}%</span>
                        </div>
                        <div className="stat">
                          <span className="label">Tests Taken</span>
                          <span className="value">{result.totalTestsTaken}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Passing Rate</span>
                          <span className="value">{result.passingRate.toFixed(1)}%</span>
                        </div>
                        <div className="stat">
                          <span className="label">Highest Score</span>
                          <span className="value">{result.highestScore}%</span>
                        </div>
                      </div>

                      <div className="result-actions">
                        <button
                          className="view-btn"
                          onClick={() => handleViewResult(result._id)}
                        >
                          👁️ View
                        </button>
                        <button
                          className="export-btn"
                          onClick={() => handleExportResult(result)}
                        >
                          📥 Export
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteResult(result._id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed View Tab */}
        {activeTab === 'detail' && detailedResult && (
          <div className="details-tab">
            <div className="detail-header">
              <div>
                <h3>{detailedResult.studentName}</h3>
                <p>{detailedResult.studentEmail}</p>
              </div>
              <div className={`grade-badge large grade-${detailedResult.performanceGrade}`}>
                {detailedResult.performanceGrade}
              </div>
            </div>

            <div className="detail-stats-grid">
              <div className="detail-stat">
                <span className="icon">📚</span>
                <span className="label">Total Tests</span>
                <span className="value">{detailedResult.totalTestsTaken}</span>
              </div>
              <div className="detail-stat">
                <span className="icon">⭐</span>
                <span className="label">Average Score</span>
                <span className="value">{detailedResult.averageScore.toFixed(2)}%</span>
              </div>
              <div className="detail-stat">
                <span className="icon">🎯</span>
                <span className="label">Highest Score</span>
                <span className="value">{detailedResult.highestScore}%</span>
              </div>
              <div className="detail-stat">
                <span className="icon">📉</span>
                <span className="label">Lowest Score</span>
                <span className="value">{detailedResult.lowestScore}%</span>
              </div>
              <div className="detail-stat">
                <span className="icon">✅</span>
                <span className="label">Passing Rate</span>
                <span className="value">{detailedResult.passingRate.toFixed(1)}%</span>
              </div>
              <div className="detail-stat">
                <span className="icon">🏆</span>
                <span className="label">Passed Tests</span>
                <span className="value">
                  {Math.round((detailedResult.passingRate / 100) * detailedResult.totalTestsTaken)}
                </span>
              </div>
            </div>

            <div className="test-attempts">
              <h4>📝 Test Attempts Details</h4>
              <table className="attempts-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Score</th>
                    <th>Correct/Total</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedResult.testAttempts.map((test, idx) => (
                    <tr key={idx} className={test.isPassed ? 'passed' : 'attempted'}>
                      <td>{test.testName}</td>
                      <td>{test.score}%</td>
                      <td>{test.correctAnswers}/{test.totalQuestions}</td>
                      <td>{test.duration} min</td>
                      <td className="status">
                        <span className={`badge ${test.status}`}>{test.status}</span>
                      </td>
                      <td>{new Date(test.completedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="notes-section">
              <h4>📝 Teacher Notes</h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your observations and feedback here..."
                className="notes-input"
                rows="4"
              />
              <button className="update-notes-btn" onClick={handleUpdateNotes}>
                💾 Save Notes
              </button>
            </div>

            <div className="detail-actions">
              <button
                className="export-btn"
                onClick={() => handleExportResult(detailedResult)}
              >
                📥 Export as CSV
              </button>
              <button
                className="reportcard-btn"
                onClick={() => handleGenerateReportCard(detailedResult._id)}
                disabled={generating}
              >
                {generating ? '⏳ Generating...' : '🎓 Generate Report Card'}
              </button>
              <button
                className="back-btn"
                onClick={() => setActiveTab('list')}
              >
                ← Back to List
              </button>
            </div>
          </div>
        )}

        {/* Report Card Tab */}
        {activeTab === 'reportcard' && showReportCard && (
          <ReportCard
            reportCardId={showReportCard}
            onClose={() => {
              setShowReportCard(null);
              setActiveTab('detail');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default StudentResults;
