import React, { lazy, Suspense, useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import YoungEmeritusLogo from './components/YoungEmeritusLogo';
import ChangePassword from './components/ChangePassword';

// Lazy load pages that don't need wrapping
const SecureLogin = lazy(() => import('./pages/SecureLogin'));
const Signup = lazy(() => import('./pages/Signup'));
const Landing = lazy(() => import('./pages/Landing'));

// Import pages that need protection (not lazy)
import StudentTest from './pages/StudentTest';
import AdminDashboard from './pages/AdminDashboard';
import TeacherClasses from './pages/TeacherClasses';
import JoinSchool from './pages/JoinSchool';

// Wrapper components for protected routes - these handle auth checks internally
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

function AppLayout() {
  const { isAuthenticated, user, logout, login, isLoading } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';

  // Check if user needs to change password on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user?.mustChangePassword) {
      setShowPasswordChange(true);
    }
  }, [isAuthenticated, user?.mustChangePassword]);

  const handlePasswordChanged = () => {
    // Clear the mustChangePassword flag by updating auth
    const auth = JSON.parse(localStorage.getItem('auth'));
    auth.user.mustChangePassword = false;
    localStorage.setItem('auth', JSON.stringify(auth));
    login(auth);
    setShowPasswordChange(false);
  };

  // Get token from localStorage
  const token = JSON.parse(localStorage.getItem('auth'))?.token;

  if (isLoading) {
    return <div className="card">Loading...</div>;
  }

  return (
    <div className="app-layout">
      {!isLandingPage && (
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
                {isAuthenticated ? (
                  <>
                    <Link to="/join-school">Join School</Link>
                    <Link to="/student">Student Test</Link>
                    {(user?.schools?.some(s => s.role === 'admin' || s.role === 'teacher')) && <Link to="/teacher">My Classes</Link>}
                    {(user?.schools?.some(s => s.role === 'admin')) && <Link to="/admin">Admin Dashboard</Link>}
                    <button onClick={logout} className="logout-btn">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <button>Login</button>
                    </Link>
                    <Link to="/signup">
                      <button>Sign Up</button>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>
      )}
      <main className={isLandingPage ? '' : 'container'}>
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

// Create router once - outside component to avoid recreating on every render
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'landing', element: <Landing /> },
      { path: 'login', element: <SecureLogin /> },
      { path: 'signup', element: <Signup /> },
      { path: 'join-school', element: <ProtectedJoinSchool /> },
      { path: 'student', element: <ProtectedStudentTest /> },
      { path: 'admin', element: <ProtectedAdminDashboard /> },
      { path: 'teacher', element: <ProtectedTeacherClasses /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

