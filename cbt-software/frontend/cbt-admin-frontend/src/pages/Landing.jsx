import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import YoungEmeritusLogo from '../components/YoungEmeritusLogo';
import './Landing.css';

export default function Landing() {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'superAdmin') return '/schools';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'teacher') return '/teacher';
    return '/student';
  };

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/" className="logo-link-nav">
              <YoungEmeritusLogo size={40} />
              <span>YoungEmeritus</span>
            </Link>
          </div>
          <div className="nav-links">
            {isAuthenticated ? (
              <Link to={getDashboardLink()} className="nav-btn dashboard-btn" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}>Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="nav-btn login-btn">Login</Link>
                <Link to="/signup" className="nav-btn signup-btn">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Learn. Build. Explore Tech.</h1>
          <p className="hero-subtitle">
            A comprehensive Computer-Based Testing (CBT) platform designed for modern education
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">Get Started</Link>
            <a href="#features" className="btn btn-secondary">Learn More</a>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-graphic">
            <YoungEmeritusLogo size={120} />
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <h2>Powerful Features for Modern Learning</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>📝 Comprehensive Testing</h3>
            <p>Create, manage, and deploy tests with multiple question types, detailed grading, and instant feedback.</p>
          </div>
          <div className="feature-card">
            <h3>📊 Analytics & Reporting</h3>
            <p>Track student performance, generate detailed reports, and identify learning gaps with advanced analytics.</p>
          </div>
          <div className="feature-card">
            <h3>🏫 School Management</h3>
            <p>Multi-tenant architecture supporting multiple schools with isolated data and independent management.</p>
          </div>
          <div className="feature-card">
            <h3>🔒 Secure & Reliable</h3>
            <p>Enterprise-grade security with encrypted passwords, JWT authentication, and comprehensive audit logging.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Transform Education?</h2>
        <p>Join thousands of educators and students using YoungEmeritus</p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn btn-primary btn-large">Create Account</Link>
          <Link to="/login" className="btn btn-secondary btn-large">Login</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-bottom">
          <p>&copy; 2026 YoungEmeritus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
