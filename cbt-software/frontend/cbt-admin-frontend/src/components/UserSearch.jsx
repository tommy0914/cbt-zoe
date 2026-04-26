import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'

export default function UserSearch({ token, placeholder = 'Search student by name or email', onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (!query) { setResults([]); return }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        // Use the new 'q' parameter which supports name and email search
        const data = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`, token)
        setResults((data && data.users) || [])
      } catch (e) {
        setResults([])
      } finally { setLoading(false) }
    }, 350)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query, token])

  return (
    <div style={{ position: 'relative' }}>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)} 
        placeholder={placeholder} 
        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
      />
      {loading && (
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#64748b' }}>
          Searching...
        </div>
      )}
      {results.length > 0 && (
        <div className="card" style={{ 
          position: 'absolute', 
          zIndex: 1000, 
          width: '100%', 
          marginTop: 6, 
          padding: 0, 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          maxHeight: '300px',
          overflowY: 'auto',
          background: 'white'
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {results.map(u => (
              <li 
                key={u._id} 
                style={{ 
                  padding: '12px 15px', 
                  borderBottom: '1px solid #f1f5f9', 
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }} 
                onClick={() => { onSelect && onSelect(u); setQuery(''); setResults([]) }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{u.name || u.username}</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>{u.email} • {u.role}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
