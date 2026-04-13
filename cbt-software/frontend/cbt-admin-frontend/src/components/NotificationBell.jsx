import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Connect to the Socket.io server (backend root)
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001');
    
    // Listen for notifications specific to this user
    socket.on(`user_${userId}`, (data) => {
      console.log('Received notification:', data);
      setNotifications(prev => [data.payload, ...prev]);
    });

    return () => socket.disconnect();
  }, [userId]);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  return (
    <div className="notification-bell-container" style={{ position: 'relative', cursor: 'pointer' }}>
      <div className="bell-icon" onClick={toggleDropdown} style={{ fontSize: '24px' }}>
        🔔
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px'
          }}>
            {notifications.length}
          </span>
        )}
      </div>

      {showDropdown && (
        <div className="notification-dropdown" style={{
          position: 'absolute',
          top: '35px',
          right: '0',
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          width: '250px',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '10px', textAlign: 'center', color: '#888' }}>No new notifications</div>
          ) : (
            notifications.map((n, index) => (
              <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{n.title}</div>
                <div style={{ fontSize: '12px', color: '#555' }}>{n.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
