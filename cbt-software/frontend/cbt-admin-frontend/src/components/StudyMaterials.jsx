import React, { useState, useEffect } from 'react';

export default function StudyMaterials({ classId, isTeacher }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);

  const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('auth'))?.token;

  useEffect(() => {
    if (classId) {
      fetchMaterials();
    }
  }, [classId]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/materials/class/${classId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMaterials(data.materials || []);
      }
    } catch (err) {
      console.error('Failed to fetch materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setMessage('Error: File and Title are required');
      return;
    }

    setUploading(true);
    setMessage('Uploading...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('subject', subject);
    formData.append('classId', classId);

    try {
      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Do not set Content-Type for FormData, browser will set it with the boundary automatically
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Material uploaded successfully! ✓');
        setTitle('');
        setDescription('');
        setSubject('');
        setFile(null);
        // Reset file input
        document.getElementById('material-file-input').value = '';
        fetchMaterials();
        
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Error: ${data.message || 'Failed to upload'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    
    try {
      const res = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMaterials(materials.filter(m => m._id !== id));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete material');
    }
  };

  return (
    <div className="card" style={{ marginTop: '20px', borderLeft: '4px solid #8b5cf6' }}>
      <h3 style={{ marginTop: 0 }}>📚 Resource Library & Study Materials</h3>
      
      {isTeacher && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
          <h4 style={{ marginTop: 0, color: '#5b21b6' }}>Upload New Material</h4>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Title *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required
                  placeholder="e.g. Chapter 1 Notes"
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Subject (Optional)</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  placeholder="e.g. Math"
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Brief description of the material..."
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '60px' }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>File to Upload *</label>
                <input 
                  id="material-file-input"
                  type="file" 
                  onChange={e => setFile(e.target.files[0])} 
                  required
                  style={{ width: '100%', padding: '8px', border: '1px dashed #8b5cf6', borderRadius: '4px', background: '#fff' }}
                />
              </div>
              <button 
                type="submit" 
                disabled={uploading || !file || !title}
                style={{ padding: '10px 20px', height: 'fit-content', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {uploading ? 'Uploading...' : '☁️ Upload File'}
              </button>
            </div>
            
            {message && (
              <div style={{ color: message.includes('Error') ? '#ef4444' : '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
                {message}
              </div>
            )}
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading materials...</p>
      ) : materials.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', color: '#64748b', borderRadius: '8px' }}>
          {isTeacher ? "You haven't uploaded any study materials yet." : "No study materials have been uploaded for this class."}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {materials.map(m => (
            <div key={m._id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: 'white', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#1e293b' }}>{m.title}</h4>
                {m.subject && <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{m.subject}</span>}
              </div>
              
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b', flex: 1 }}>
                {m.description || "No description provided."}
              </p>
              
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>📄 {m.fileName}</span>
                <span style={{ margin: '0 4px' }}>•</span>
                <span>{new Date(m.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                {/* Download Link */}
                <a 
                  href={m.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ flex: 1, textAlign: 'center', background: '#f8fafc', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '8px 0', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}
                >
                  📥 Download
                </a>
                
                {isTeacher && (
                  <button 
                    onClick={() => handleDelete(m._id)}
                    style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}
                    title="Delete Material"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
