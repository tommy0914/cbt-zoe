import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'

export default function UserSearch({ token, placeholder = 'Search user by email', onSelect }) {
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
        const data = await api.get(`/api/users/search?email=${encodeURIComponent(query)}`, token)
        setResults((data && data.users) || [])
      } catch (e) {
        setResults([])
      } finally { setLoading(false) }
    }, 350)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query, token])

  return (
    <div style={{ position: 'relative' }}>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder={placeholder} style={{ width: '60%' }} />
      {loading && <span style={{ marginLeft: 8 }}>Searching…</span>}
      {results.length > 0 && (
        <div className="card" style={{ position: 'absolute', zIndex: 40, width: '60%', marginTop: 6 }}>
          <ul style={{ listStyle: 'none', padding: 8, margin: 0 }}>
            {results.map(u => (
              <li key={u._id} style={{ padding: 6, borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => { onSelect && onSelect(u); setQuery(''); setResults([]) }}>
                <strong>{u.username}</strong> <span style={{ color: '#666', marginLeft: 8 }}>{u.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
