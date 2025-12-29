import React from 'react';
import { createBrowserRouter, RouterProvider, Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentTest from './pages/StudentTest';
import AdminDashboard from './pages/AdminDashboard';
import TeacherClasses from './pages/TeacherClasses';
import JoinSchool from './pages/JoinSchool';
import ProtectedRoute from './components/ProtectedRoute';
import YoungEmeritusLogo from './components/YoungEmeritusLogo';

function AppLayout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="app-layout">
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
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, user } = useAuth();

  const router = createBrowserRouter([
    {
      path: '/',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to={isAuthenticated ? '/join-school' : '/login'} replace /> },
        { path: 'login', element: <Login /> },
        { path: 'signup', element: <Signup /> },
        { path: 'join-school', element: <ProtectedRoute><JoinSchool /></ProtectedRoute> },
        { path: 'student', element: <ProtectedRoute><StudentTest /></ProtectedRoute> },
        { path: 'admin', element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute> },
        { path: 'teacher', element: <ProtectedRoute allowedRoles={['admin', 'teacher']}><TeacherClasses /></ProtectedRoute> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

