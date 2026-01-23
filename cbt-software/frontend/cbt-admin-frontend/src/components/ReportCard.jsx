import React, { useState, useEffect } from 'react';
import '../styles/ReportCard.css';

const ReportCard = ({ reportCardId, onClose }) => {
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetchReportCard();
  }, [reportCardId]);

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/report-card/${reportCardId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReportCard(data);
        setRemarks(data.teacherRemarks || '');
        setIsApproved(data.isApproved || false);
        setIsPublished(data.isPublished || false);
      } else {
        setMessage('Failed to load report card');
      }
    } catch (error) {
      console.error('Error fetching report card:', error);
      setMessage('Error loading report card');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRemarks = async () => {
    try {
      const response = await fetch(`/api/reports/report-card/${reportCardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          teacherRemarks: remarks,
          isApproved,
          isPublished
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReportCard(data.reportCard);
        setMessage('Report card updated successfully! ✓');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('Failed to update report card');
      }
    } catch (error) {
      console.error('Error updating report card:', error);
      setMessage('Error updating report card');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const element = document.getElementById('report-card-content');
    const opt = {
      margin: 10,
      filename: `${reportCard.studentName}_reportcard.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    // This would require html2pdf library - for now just use print
    window.print();
  };

  if (loading) {
    return <div className="report-card-loading">Loading report card...</div>;
  }

  if (!reportCard) {
    return <div className="report-card-error">Report card not found</div>;
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A':
        return '#4CAF50';
      case 'B':
        return '#2196F3';
      case 'C':
        return '#FF9800';
      case 'D':
        return '#FF5722';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <div className="report-card-modal">
      <div className="report-card-container">
        <div className="report-card-header">
          <h2>📋 Academic Report Card</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div id="report-card-content" className="report-card-content">
          {/* School Header */}
          <div className="report-card-school-header">
            <h3>🎓 Academic Performance Report</h3>
            <p>{reportCard.className} | {reportCard.academicYear} {reportCard.academicTerm}</p>
          </div>

          {/* Student Information */}
          <div className="report-card-student-info">
            <div className="info-row">
              <div className="info-item">
                <label>Student Name:</label>
                <value>{reportCard.studentName}</value>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <value>{reportCard.studentEmail}</value>
              </div>
              <div className="info-item">
                <label>Roll Number:</label>
                <value>{reportCard.studentRoll || 'N/A'}</value>
              </div>
            </div>
            <div className="info-row">
              <div className="info-item">
                <label>Class:</label>
                <value>{reportCard.className}</value>
              </div>
              <div className="info-item">
                <label>Overall Ranking:</label>
                <value>#{reportCard.overallRanking || 'N/A'}</value>
              </div>
              <div className="info-item">
                <label>Total Tests:</label>
                <value>{reportCard.totalTestsTaken}</value>
              </div>
            </div>
          </div>

          {/* Overall Performance */}
          <div className="report-card-overall">
            <h3>Overall Performance</h3>
            <div className="overall-stats">
              <div className="stat-box">
                <div className="stat-label">GPA</div>
                <div className="stat-value">{reportCard.overallGPA.toFixed(2)}</div>
              </div>
              <div className="stat-box">
                <div
                  className="stat-grade"
                  style={{ backgroundColor: getGradeColor(reportCard.overallGrade) }}
                >
                  {reportCard.overallGrade}
                </div>
                <div className="stat-label">Grade</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Average</div>
                <div className="stat-value">{reportCard.averagePercentage.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Subject-wise Grades */}
          {reportCard.subjectGrades && reportCard.subjectGrades.length > 0 && (
            <div className="report-card-subjects">
              <h3>Subject Performance</h3>
              <table className="subjects-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                    <th>Tests</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCard.subjectGrades.map((subject, idx) => (
                    <tr key={idx} className={subject.grade === 'F' ? 'failed' : 'passed'}>
                      <td className="subject-name">{subject.subject}</td>
                      <td className="percentage">{subject.percentage.toFixed(1)}%</td>
                      <td className="grade">
                        <span
                          className="grade-badge"
                          style={{ backgroundColor: getGradeColor(subject.grade) }}
                        >
                          {subject.grade}
                        </span>
                      </td>
                      <td className="tests">{subject.totalTests}</td>
                      <td className={`status ${subject.remarks.toLowerCase()}`}>
                        {subject.remarks}
                      </td>
                      <td className="performance">{subject.performanceStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Test Breakdown by Subject */}
          {reportCard.testBreakdown && reportCard.testBreakdown.length > 0 && (
            <div className="report-card-breakdown">
              <h3>Test-wise Breakdown</h3>
              {reportCard.testBreakdown.map((subjectBreak, idx) => (
                <div key={idx} className="subject-breakdown">
                  <h4>{subjectBreak.subject}</h4>
                  <table className="breakdown-table">
                    <thead>
                      <tr>
                        <th>Test Name</th>
                        <th>Date</th>
                        <th>Marks</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectBreak.tests.map((test, testIdx) => (
                        <tr key={testIdx}>
                          <td>{test.testName}</td>
                          <td>{new Date(test.date).toLocaleDateString()}</td>
                          <td>
                            {test.marksObtained}/{test.totalMarks}
                          </td>
                          <td>{test.percentage.toFixed(1)}%</td>
                          <td>
                            <span
                              className="grade-badge"
                              style={{ backgroundColor: getGradeColor(test.grade) }}
                            >
                              {test.grade}
                            </span>
                          </td>
                          <td className={`status ${test.status.toLowerCase()}`}>
                            {test.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Teacher Remarks */}
          <div className="report-card-remarks">
            <h3>Teacher Remarks & Comments</h3>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add teacher remarks and observations..."
              className="remarks-textarea"
              rows="4"
            />
          </div>

          {/* Approval Section */}
          <div className="report-card-approval">
            <div className="approval-checkbox">
              <input
                type="checkbox"
                id="approved"
                checked={isApproved}
                onChange={(e) => setIsApproved(e.target.checked)}
              />
              <label htmlFor="approved">Approved by Principal/Authority</label>
            </div>
            <div className="approval-checkbox">
              <input
                type="checkbox"
                id="published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <label htmlFor="published">Published (Visible to Parents)</label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="report-card-actions">
          <button className="save-btn" onClick={handleUpdateRemarks}>
            💾 Save Remarks
          </button>
          <button className="print-btn" onClick={handlePrint}>
            🖨️ Print Report Card
          </button>
          <button className="pdf-btn" onClick={handleExportPDF}>
            📄 Export as PDF
          </button>
          <button className="close-action-btn" onClick={onClose}>
            ← Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
