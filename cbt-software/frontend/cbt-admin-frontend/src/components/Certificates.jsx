import { useState, useEffect } from 'react';
import api from '../services/api';
import './Certificates.css';

export default function Certificates({ studentId, isStudent }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchCertificates();
    }
  }, [studentId]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quickwins/certificates/student/${studentId}`);
      setCertificates(res.data);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certId) => {
    try {
      const certificate = await api.get(`/quickwins/certificates/${certId}`);
      // Generate PDF (placeholder - can integrate pdfkit)
      alert(`Certificate ${certificate.data.certificateNumber} - Ready to download`);
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  const sendCertificateEmail = async (certId) => {
    try {
      await api.post(`/quickwins/certificates/${certId}/send`);
      alert('Certificate sent to your email!');
      fetchCertificates();
    } catch (error) {
      console.error('Error sending certificate:', error);
      alert('Failed to send certificate');
    }
  };

  const getTemplateColor = (template) => {
    switch (template) {
      case 'gold':
        return '#fbbf24';
      case 'platinum':
        return '#a78bfa';
      default:
        return '#3b82f6';
    }
  };

  if (!isStudent) return null;

  if (loading) {
    return <div className="certificates-loading">Loading certificates...</div>;
  }

  return (
    <div className="certificates-section">
      <div className="certificates-header">
        <h3>🏅 Your Certificates</h3>
        <span className="cert-count">{certificates.length} certificates earned</span>
      </div>

      {certificates.length === 0 ? (
        <div className="no-certificates">
          <p>No certificates yet</p>
          <small>Complete tests with passing scores to earn certificates!</small>
        </div>
      ) : (
        <div className="certificates-grid">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="certificate-card"
              style={{ borderTopColor: getTemplateColor(cert.template) }}
              onClick={() => setSelectedCert(cert)}
            >
              <div className="cert-header">
                <div className="cert-icon">📜</div>
                <div className="cert-number">{cert.certificateNumber}</div>
              </div>

              <div className="cert-body">
                <h4>{cert.testTitle}</h4>
                <p className="cert-score">Score: {cert.score}/{cert.totalMarks}</p>
                <p className="cert-percentage">{cert.percentage}%</p>
                <small className="cert-date">
                  {new Date(cert.issuedDate).toLocaleDateString()}
                </small>
              </div>

              <div className="cert-actions">
                <button
                  className="btn-download"
                  onClick={() => downloadCertificate(cert._id)}
                >
                  Download
                </button>
                {cert.status !== 'sent' && (
                  <button
                    className="btn-email"
                    onClick={() => sendCertificateEmail(cert._id)}
                  >
                    Email
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCert && (
        <div className="cert-preview-modal" onClick={() => setSelectedCert(null)}>
          <div className="cert-preview" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedCert(null)}>
              ✕
            </button>
            <div className="cert-preview-content">
              <h2>Certificate of Achievement</h2>
              <p>This is to certify that</p>
              <h3>{selectedCert.studentName}</h3>
              <p>has successfully completed</p>
              <h3>{selectedCert.testTitle}</h3>
              <p>with a score of {selectedCert.percentage}%</p>
              <p className="cert-number">Cert #: {selectedCert.certificateNumber}</p>
              <p className="cert-date">
                Issued: {new Date(selectedCert.issuedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
