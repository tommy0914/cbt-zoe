import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem('auth'))?.user;
  const role = user?.role;

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
          <div className="user-avatar">{user?.name?.charAt(0)}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
