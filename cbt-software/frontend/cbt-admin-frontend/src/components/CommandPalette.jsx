import React, { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useNavigate } from 'react-router-dom';
import './CommandPalette.css';

const ACTIONS = [
  { name: 'Dashboard', path: '/dashboard', type: 'navigation' },
  { name: 'My Classes', path: '/classes', type: 'navigation' },
  { name: 'User Management', path: '/users', type: 'navigation' },
  { name: 'School Management', path: '/schools', type: 'navigation' },
  { name: 'Join School', path: '/join-school', type: 'navigation' },
  { name: 'Student Test', path: '/student', type: 'navigation' },
  { name: 'Create Test', path: '/classes', action: 'create-test', type: 'action' },
  { name: 'Upload CSV', path: '/classes', action: 'upload', type: 'action' },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query) {
      setResults(ACTIONS.slice(0, 5));
      return;
    }
    const fuse = new Fuse(ACTIONS, { keys: ['name'] });
    setResults(fuse.search(query).map(r => r.item));
  }, [query]);

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-modal" onClick={e => e.stopPropagation()}>
        <div className="palette-search">
          <span className="search-icon">🔍</span>
          <input 
            autoFocus
            placeholder="Search actions, classes, students..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="palette-results">
          {results.length > 0 ? (
            results.map((res, i) => (
              <div key={i} className="palette-item" onClick={() => { navigate(res.path); onClose(); }}>
                <span className="item-icon">{res.type === 'navigation' ? '🔗' : '⚡'}</span>
                <div className="item-details">
                  <span className="item-name">{res.name}</span>
                  <span className="item-type">{res.type}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="palette-no-results">No results found for "{query}"</div>
          )}
        </div>
        <div className="palette-footer">
          <span>Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
