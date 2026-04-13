import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

export default function Chat({ userId, classId, receiverId }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const socketRef = useRef();

  useEffect(() => {
    // Fetch historical messages
    fetchMessages();

    // Connect to socket
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001');

    const eventName = classId ? `class_message_${classId}` : `user_message_${userId}`;
    
    socketRef.current.on(eventName, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => socketRef.current.disconnect();
  }, [userId, classId, receiverId]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = classId 
        ? `${import.meta.env.VITE_API_BASE_URL}/messaging/class/${classId}`
        : `${import.meta.env.VITE_API_BASE_URL}/messaging/direct/${receiverId}`;
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const messageData = {
      senderId: userId,
      content,
      classId,
      receiverId
    };

    socketRef.current.emit('sendMessage', messageData);
    setContent('');
  };

  return (
    <div className="chat-container" style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', height: '400px', display: 'flex', flexDirection: 'column' }}>
      <div className="messages-list" style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((m, index) => (
          <div key={index} style={{ textAlign: m.senderId === userId ? 'right' : 'left', margin: '5px 0' }}>
            <div style={{ fontSize: '12px', color: '#888' }}>{m.sender.name}</div>
            <div style={{
              display: 'inline-block',
              background: m.senderId === userId ? '#007bff' : '#eee',
              color: m.senderId === userId ? 'white' : 'black',
              padding: '8px 12px',
              borderRadius: '12px'
            }}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex' }}>
        <input 
          type="text" 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          placeholder="Type a message..."
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ marginLeft: '10px', padding: '8px 16px' }}>Send</button>
      </form>
    </div>
  );
}
