import { useState, useEffect } from 'react';
import api from '../services/api';
import './Announcements.css';

export default function Announcements({ classId, isTeacher }) {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('low');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [classId]);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get(`/quickwins/announcements/class/${classId}`);
      setAnnouncements(res.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/quickwins/announcements/create', {
        title,
        content,
        classId,
        priority
      });
      setTitle('');
      setContent('');
      setPriority('low');
      setShowForm(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f97316';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div className="announcements-section">
      <div className="announcements-header">
        <h3>📢 Announcements</h3>
        {isTeacher && (
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ New Announcement'}
          </button>
        )}
      </div>

      {showForm && isTeacher && (
        <div className="announcement-form">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Announcement Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
            <textarea
              placeholder="Announcement Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="form-textarea"
              rows="4"
            />
            <div className="form-row">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="form-select"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="announcements-list">
        {announcements.length === 0 ? (
          <p className="no-announcements">No announcements yet</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement._id} className="announcement-card">
              <div
                className="priority-indicator"
                style={{ backgroundColor: getPriorityColor(announcement.priority) }}
              />
              <div className="announcement-content">
                <h4>{announcement.title}</h4>
                <p>{announcement.content}</p>
                <small className="announcement-meta">
                  by <strong>{announcement.createdBy?.name}</strong> •{' '}
                  {new Date(announcement.createdAt).toLocaleDateString()} at{' '}
                  {new Date(announcement.createdAt).toLocaleTimeString()}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
