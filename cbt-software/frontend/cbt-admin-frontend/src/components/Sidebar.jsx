import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">YE</div>
        <h1>YoungEmeritus</h1>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">MAIN</span>
          
          {role === 'superAdmin' && (
            <NavLink to="/schools" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              🏫 Schools
            </NavLink>
          )}

          {role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              📊 Dashboard
            </NavLink>
          )}

          {role === 'teacher' && (
            <NavLink to="/teacher" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              👨‍🏫 My Dashboard
            </NavLink>
          )}

          {role === 'student' && (
            <NavLink to="/student" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              🎓 My Portal
            </NavLink>
          )}
        </div>

        {/* Academic Section */}
        {(role === 'admin' || role === 'teacher' || role === 'student') && (
          <div className="nav-section">
            <span className="nav-section-title">ACADEMIC</span>
            
            {role !== 'student' && (
              <NavLink to="/classes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                🏫 Classes
              </NavLink>
            )}

            {role === 'student' && (
              <>
                <NavLink to="/student" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                  📝 Take Tests
                </NavLink>
              </>
            )}

            {(role === 'admin' || role === 'teacher') && (
              <NavLink to="/questions" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                📚 Question Bank
              </NavLink>
            )}
          </div>
        )}

        {/* Management & Reports */}
        <div className="nav-section">
          <span className="nav-section-title">MANAGEMENT</span>
          
          {(role === 'admin' || role === 'superAdmin') && (
            <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              👥 Users
            </NavLink>
          )}

          {(role === 'admin' || role === 'teacher') && (
            <NavLink to="/attendance" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              📅 Attendance
            </NavLink>
          )}

          <NavLink to="/results" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            📉 Results & reports
          </NavLink>

          {(role === 'admin' || role === 'superAdmin') && (
            <NavLink to="/audit" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              🛡️ Audit Logs
            </NavLink>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}</div>
          <div className="user-info">
            <span className="user-name" title={user?.name || user?.username}>{user?.name || user?.username || 'User'}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        </div>
        <button onClick={logout} className="logout-btn" title="Logout">
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
