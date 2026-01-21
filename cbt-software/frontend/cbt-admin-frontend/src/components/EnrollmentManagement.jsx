import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function EnrollmentManagement() {
  const token = JSON.parse(localStorage.getItem('auth'))?.token;
  const [enrollmentRequests, setEnrollmentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState(null);

  useEffect(() => {
    fetchEnrollmentRequests();
  }, [token]);

  async function fetchEnrollmentRequests() {
    try {
      setLoading(true);
      const res = await api.get('/api/enrollment/requests', token);
      setEnrollmentRequests(res.requests || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch enrollment requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId) {
    try {
      await api.post(`/api/enrollment/approve/${requestId}`, {}, token);
      setMessage('Enrollment approved!');
      setTimeout(() => {
        fetchEnrollmentRequests();
        setMessage(null);
      }, 1500);
    } catch (err) {
      setMessage(err.message || 'Failed to approve request');
    }
  }

  async function handleReject(requestId, reason = '') {
    try {
      await api.post(`/api/enrollment/reject/${requestId}`, { reason }, token);
      setMessage('Enrollment rejected!');
      setTimeout(() => {
        fetchEnrollmentRequests();
        setMessage(null);
      }, 1500);
    } catch (err) {
      setMessage(err.message || 'Failed to reject request');
    }
  }

  async function handleBulkEnroll() {
    if (!file) {
      setUploadMsg('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await api.postForm('/api/enrollment/bulk-enroll', formData, token);
      setUploadMsg(`✓ ${res.results.success.length} enrolled, ${res.results.failed.length} failed`);
      setFile(null);
      if (res.results.failed.length > 0) {
        console.log('Failed enrollments:', res.results.failed);
      }
    } catch (err) {
      setUploadMsg(err.message || 'Failed to process bulk enrollment');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="card">Loading enrollment data...</div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <h4>📤 Bulk Enroll Students</h4>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Upload CSV with columns: email, className (or classId)
        </p>
        <input
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={e => setFile(e.target.files[0])}
          disabled={loading}
        />
        <div style={{ marginTop: '8px' }}>
          <button onClick={handleBulkEnroll} disabled={loading}>
            {loading ? 'Processing...' : 'Upload & Enroll'}
          </button>
        </div>
        {uploadMsg && (
          <div
            style={{
              marginTop: '8px',
              color: uploadMsg.includes('failed') && !uploadMsg.includes('0 failed') ? '#dc2626' : '#16a34a',
            }}
          >
            {uploadMsg}
          </div>
        )}
      </div>

      <div className="card">
        <h4>⏳ Pending Enrollment Requests</h4>
        {message && (
          <div
            style={{
              marginBottom: '12px',
              color: message.includes('Failed') ? '#dc2626' : '#16a34a',
            }}
          >
            {message}
          </div>
        )}
        {error && (
          <div style={{ marginBottom: '12px', color: '#dc2626' }}>
            {error}
          </div>
        )}
        {enrollmentRequests.length === 0 ? (
          <p>No pending enrollment requests.</p>
        ) : (
          <div>
            {enrollmentRequests.map(request => (
              <div
                key={request._id}
                className="card"
                style={{
                  marginBottom: '12px',
                  padding: '12px',
                  background: '#fffbeb',
                  borderLeft: '4px solid #fbbf24',
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <strong>{request.studentId?.name || 'Unknown'}</strong> (
                  {request.studentId?.email})
                  <br />
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    Class: {request.classId?.name}
                  </span>
                  <br />
                  <span style={{ color: '#999', fontSize: '11px' }}>
                    Requested:{' '}
                    {new Date(request.requestedAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApprove(request._id)}
                    style={{ background: '#16a34a' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request._id)}
                    style={{ background: '#dc2626' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
