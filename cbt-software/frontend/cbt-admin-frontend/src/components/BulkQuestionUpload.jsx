import React, { useState } from 'react';
import api from '../services/api';

export default function BulkQuestionUpload({ token }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
      setError(null);
    }
  };

  const handeUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.postForm('/api/questions/upload', formData);
      
      if (response.message && !response.error) {
        setMessage(response.message || `Successfully uploaded ${response.count || 0} questions!`);
        setFile(null); // Clear the file
        // Reset the input field
        document.getElementById('file-upload').value = '';
      } else {
        setError(response.message || response.error || 'Upload failed.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h4>Bulk Upload Questions</h4>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
        Upload a .csv or .xlsx file containing questions. 
        Ensure your columns include <strong>Question</strong>, <strong>Option A</strong>, <strong>Option B</strong>, <strong>Option C</strong>, <strong>Option D</strong>, <strong>Correct Answer</strong>, and optionally <strong>Subject</strong>.
      </p>

      <form onSubmit={handeUpload}>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="file" 
            id="file-upload"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            onChange={handleFileChange} 
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={uploading || !file}
          style={{ 
            background: file ? '#4f46e5' : '#ccc', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '6px', 
            cursor: file ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          {uploading ? 'Uploading...' : '📤 Upload Questions'}
        </button>
      </form>

      {message && <div style={{ marginTop: '15px', color: 'green', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>✅ {message}</div>}
      {error && <div style={{ marginTop: '15px', color: 'red', padding: '10px', background: '#ffebee', borderRadius: '4px' }}>❌ {error}</div>}
    </div>
  );
}
