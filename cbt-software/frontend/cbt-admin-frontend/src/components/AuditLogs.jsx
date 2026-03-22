import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AuditLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [userIdFilter, setUserIdFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    fetchLogs();
  }, [limit]); // Fetch immediately on load. Debounce filter changes or require button click for filters.

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userIdFilter) params.append('userId', userIdFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (resourceTypeFilter) params.append('resourceType', resourceTypeFilter);
      if (limit) params.append('limit', limit);

      const res = await api.get(`/api/admin/audit?${params.toString()}`, token);
      if (res.logs) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const handleClearFilters = () => {
    setUserIdFilter('');
    setActionFilter('');
    setResourceTypeFilter('');
    setLimit(100);
    // State updates are async, so we just clear the params immediately in a manual fetch
    setTimeout(() => {
      fetchLogs();
    }, 0);
  };

  return (
    <div className="card" style={{ marginTop: '20px', borderTop: '4px solid #0f766e' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛡️</span> System Audit Logs Monitor
        </h3>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? '↻ Refreshing...' : '↻ Refresh Data'}
        </button>
      </div>

      <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>Filter Logs</h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>User ID</label>
            <input 
              type="text" 
              placeholder="e.g. 64b8f..." 
              value={userIdFilter} 
              onChange={e => setUserIdFilter(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Action</label>
            <input 
              type="text" 
              placeholder="e.g. create_user" 
              value={actionFilter} 
              onChange={e => setActionFilter(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Resource Type</label>
            <input 
              type="text" 
              placeholder="e.g. test, attendance" 
              value={resourceTypeFilter} 
              onChange={e => setResourceTypeFilter(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div style={{ minWidth: '100px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Limit</label>
            <select 
              value={limit} 
              onChange={e => setLimit(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleApplyFilters}
              style={{ background: '#0f766e', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Apply Filters
            </button>
            <button 
              onClick={handleClearFilters}
              style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
          No audit logs found matching your criteria.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px', color: '#475569' }}>Timestamp</th>
                <th style={{ padding: '12px', color: '#475569' }}>Action</th>
                <th style={{ padding: '12px', color: '#475569' }}>Actor (User)</th>
                <th style={{ padding: '12px', color: '#475569' }}>Resource</th>
                <th style={{ padding: '12px', color: '#475569' }}>Details</th>
                <th style={{ padding: '12px', color: '#475569' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap', color: '#64748b' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: '#ccfbf1', 
                      color: '#0f766e', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#334155' }}>{log.userName || 'Unknown User'}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {log.userId}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{log.userRole || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '500', color: '#475569' }}>{log.resourceType || 'system'}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{log.resourceId ? `ID: ${log.resourceId}` : ''}</div>
                  </td>
                  <td style={{ padding: '12px', maxWidth: '300px' }}>
                    {Object.keys(log.details || {}).length > 0 ? (
                      <pre style={{ 
                        margin: 0, 
                        background: '#f8fafc', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        fontSize: '11px',
                        overflowX: 'auto',
                        border: '1px solid #e2e8f0',
                        color: '#475569'
                      }}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontSize: '12px' }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                    {log.ip || 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
