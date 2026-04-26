import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, role, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>YoungEmeritus</h1>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          🏠 Dashboard
        </NavLink>
        {role === 'teacher' && (
          <NavLink to="/classes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            👨‍🏫 My Classes
          </NavLink>
        )}
        {(role === 'admin' || role === 'superAdmin') && (
          <>
            <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              👥 User Management
            </NavLink>
            {role === 'superAdmin' && (
              <NavLink to="/schools" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                🏫 School Management
              </NavLink>
            )}
          </>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</div>
          <div className="user-info">
            <span className="user-name">{user?.name || user?.username || 'User'}</span>
            <span className="user-role">{user?.role || role}</span>
          </div>
        </div>
        <button onClick={logout} className="logout-btn" title="Logout">
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
