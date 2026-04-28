import React, { lazy, Suspense, useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import YoungEmeritusLogo from './components/YoungEmeritusLogo';
import ChangePassword from './components/ChangePassword';
import AppShell from './components/AppShell';

// Lazy load pages
const SecureLogin = lazy(() => import('./pages/SecureLogin'));
const Signup = lazy(() => import('./pages/Signup'));
const Landing = lazy(() => import('./pages/Landing'));

// Import pages that need protection
import StudentTest from './pages/StudentTest';
import AdminDashboard from './pages/AdminDashboard';
import TeacherClasses from './pages/TeacherClasses';
import JoinSchool from './pages/JoinSchool';
import CreateSchool from './pages/CreateSchool';
import SchoolDashboard from './components/SchoolDashboard';
import UserManagement from './components/UserManagement';
import AuditLogs from './components/AuditLogs';
import QuestionBank from './components/QuestionBank';
import AttendanceTracker from './components/AttendanceTracker';

// Wrapper components for protected routes
function ProtectedJoinSchool() {
  return <ProtectedRoute><JoinSchool /></ProtectedRoute>;
}

function ProtectedStudentTest() {
  return <ProtectedRoute><StudentTest /></ProtectedRoute>;
}

function ProtectedAdminDashboard() {
  return <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>;
}

function ProtectedTeacherClasses() {
  return <ProtectedRoute allowedRoles={['admin', 'teacher']}><TeacherClasses /></ProtectedRoute>;
}

function ProtectedSchoolDashboard() {
  return <ProtectedRoute allowedRoles={['superAdmin']}><SchoolDashboard /></ProtectedRoute>;
}

function ProtectedUserManagement() {
  return <ProtectedRoute allowedRoles={['admin', 'superAdmin']}><UserManagement /></ProtectedRoute>;
}

function ProtectedAuditLogs() {
  const token = JSON.parse(localStorage.getItem('auth'))?.token;
  return <ProtectedRoute allowedRoles={['admin', 'superAdmin']}><AuditLogs token={token} /></ProtectedRoute>;
}

function ProtectedQuestionBank() {
  const token = JSON.parse(localStorage.getItem('auth'))?.token;
  return <ProtectedRoute allowedRoles={['admin', 'teacher', 'superAdmin']}><QuestionBank token={token} /></ProtectedRoute>;
}

function AppLayout() {
  const { isAuthenticated, user, logout, login, isLoading } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const useAppShell = isAuthenticated && !isLandingPage && !isAuthPage;

  useEffect(() => {
    if (isAuthenticated && user?.mustChangePassword) {
      setShowPasswordChange(true);
    }
  }, [isAuthenticated, user?.mustChangePassword]);

  const handlePasswordChanged = () => {
    const auth = JSON.parse(localStorage.getItem('auth'));
    auth.user.mustChangePassword = false;
    localStorage.setItem('auth', JSON.stringify(auth));
    login(auth);
    setShowPasswordChange(false);
  };

  const token = JSON.parse(localStorage.getItem('auth'))?.token;

  if (isLoading) {
    return <div className="card">Loading...</div>;
  }

  return (
    <div className="app-layout">
      {(!isAuthenticated && !isLandingPage) && (
        <header className="app-header">
          <div className="container">
            <div className="header-content">
              <Link to="/" className="logo-link">
                <YoungEmeritusLogo size={40} />
                <div className="logo-text">
                  <h1 className="app-title">YoungEmeritus</h1>
                  <p className="app-subtitle">Learn. Build. Explore Tech.</p>
                </div>
              </Link>
              <nav className="main-nav">
                <Link to="/login">
                  <button>Login</button>
                </Link>
                <Link to="/signup">
                  <button>Sign Up</button>
                </Link>
              </nav>
            </div>
          </div>
        </header>
      )}
      <main className={(isLandingPage || useAppShell) ? '' : 'container'}>
        {showPasswordChange && token && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <ChangePassword token={token} onPasswordChanged={handlePasswordChanged} />
          </div>
        )}
        <Suspense fallback={<div className="card">Loading page...</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'landing', element: <Landing /> },
      { path: 'login', element: <SecureLogin /> },
      { path: 'signup', element: <Signup /> },
      {
        element: <AppShell />,
        children: [
          { path: 'dashboard', element: <ProtectedAdminDashboard /> },
          { path: 'admin', element: <ProtectedAdminDashboard /> },
          { path: 'classes', element: <ProtectedTeacherClasses /> },
          { path: 'teacher', element: <ProtectedTeacherClasses /> },
          { path: 'users', element: <ProtectedUserManagement /> },
          { path: 'schools', element: <ProtectedSchoolDashboard /> },
          { path: 'join-school', element: <ProtectedJoinSchool /> },
          { path: 'student', element: <ProtectedStudentTest /> },
          { path: 'create-school', element: <ProtectedRoute><CreateSchool /></ProtectedRoute> },
          { path: 'audit', element: <ProtectedAuditLogs /> },
          { path: 'results', element: <ProtectedTeacherClasses /> },
          { path: 'attendance', element: <ProtectedTeacherClasses /> },
          { path: 'questions', element: <ProtectedQuestionBank /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
