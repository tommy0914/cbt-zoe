import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import YoungEmeritusLogo from '../components/YoungEmeritusLogo';
import './Landing.css';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    // If already authenticated, redirect to appropriate dashboard
    return <Link to="/admin" />;
  }

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <Link to="/" className="logo-link-nav">
              <YoungEmeritusLogo size={40} />
              <span>YoungEmeritus</span>
            </Link>
          </div>
          <div className="nav-links">
            <Link to="/login" className="nav-btn login-btn">Login</Link>
            <Link to="/signup" className="nav-btn signup-btn">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Powerful Features for Modern Learning</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><span role="img" aria-label="Comprehensive Testing">📝</span></div>
            <h3>Comprehensive Testing</h3>
            <p>Create, manage, and deploy tests with multiple question types, detailed grading, and instant feedback.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><span role="img" aria-label="User Management">👥</span></div>
            <h3>User Management</h3>
            <p>Manage students, teachers, and admins with role-based access control and permission management.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><span role="img" aria-label="Analytics & Reporting">📊</span></div>
            <h3>Analytics & Reporting</h3>
            <p>Track student performance, generate detailed reports, and identify learning gaps with advanced analytics.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><span role="img" aria-label="School Management">🏫</span></div>
            <h3>School Management</h3>
            <p>Multi-tenant architecture supporting multiple schools with isolated data and independent management.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><span role="img" aria-label="Class Organization">📚</span></div>
            <h3>Class Organization</h3>
            <p>Organize students into classes, assign teachers, and manage class-specific content and assessments.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><span role="img" aria-label="Secure & Reliable">🔒</span></div>
            <h3>Secure & Reliable</h3>
            <p>Enterprise-grade security with encrypted passwords, JWT authentication, and comprehensive audit logging.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><span role="img" aria-label="Batch Operations">📤</span></div>
            <h3>Batch Operations</h3>
            <p>Bulk enroll students via CSV upload, automated account creation, and credential delivery.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><span role="img" aria-label="Email Integration">🔔</span></div>
            <h3>Email Integration</h3>
            <p>Automated email notifications for student enrollments, temporary credentials, and important announcements.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><span role="img" aria-label="Responsive Design">📱</span></div>
            <h3>Responsive Design</h3>
            <p>Works seamlessly on desktop, tablet, and mobile devices for learning anywhere, anytime.</p>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="user-roles">
        <h2>Built for Everyone</h2>
        <div className="roles-grid">
          <div className="role-card">
            <div className="role-icon"><span role="img" aria-label="Students">👨‍🎓</span></div>
            <h3>Students</h3>
            <ul>
              <li>Take tests and assessments</li>
              <li>View results and feedback</li>
              <li>Join classes and schools</li>
              <li>Track progress and grades</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-icon"><span role="img" aria-label="Teachers">👨‍🏫</span></div>
            <h3>Teachers</h3>
            <ul>
              <li>Create and manage classes</li>
              <li>Design test questions</li>
              <li>Grade student submissions</li>
              <li>Approve student enrollments</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-icon"><span role="img" aria-label="Administrators">👨‍💼</span></div>
            <h3>Administrators</h3>
            <ul>
              <li>Manage schools and users</li>
              <li>Create bulk enrollments</li>
              <li>View analytics dashboard</li>
              <li>Manage permissions</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Sign Up</h4>
            <p>Create an account as a student, teacher, or administrator</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Join School</h4>
            <p>Join your school or create a new school organization</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Enroll in Classes</h4>
            <p>Request or be added to classes by teachers/admins</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Take Tests</h4>
            <p>Access and complete tests, receive grades and feedback</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-container">
          <div className="stat">
            <div className="stat-number">∞</div>
            <p>Questions & Tests</p>
          </div>
          <div className="stat">
            <div className="stat-number">🏫</div>
            <p>Multi-Tenant Ready</p>
          </div>
          <div className="stat">
            <div className="stat-number">🔒</div>
            <p>Enterprise Security</p>
          </div>
          <div className="stat">
            <div className="stat-number">⚡</div>
            <p>Real-Time Results</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Transform Education?</h2>
        <p>Join thousands of educators and students using YoungEmeritus</p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn btn-primary btn-large">Create Account</Link>
          <Link to="/login" className="btn btn-secondary btn-large">Login</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>YoungEmeritus</h4>
            <p>Empowering education through technology</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#roles">User Roles</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="mailto:support@youngemeritus.com">Contact Us</a></li>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 YoungEmeritus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
