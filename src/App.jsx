import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { DashboardProvider } from './context/DashboardContext.jsx';
import withAuth from './components/Auth/withAuth.jsx';

import Header from 'Layout/Header.jsx';

import './App.css';

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard.jsx'));
const ToolsPage = lazy(() => import('./components/Pages/ToolsPage.jsx'));
const DataPage = lazy(() => import('./components/Pages/DataPage.jsx'));
const ProfilePage = lazy(() => import('./components/Pages/ProfilePage.jsx'));
const NotFoundPage = lazy(() => import('./components/Pages/NotFoundPage.jsx'));
const Login = lazy(() => import('./components/Auth/Login.jsx'));
const Register = lazy(() => import('./components/Auth/Register.jsx'));
const Notifications = lazy(() => import('./components/Pages/Notifications.jsx'));
const ProtectedDataPage = withAuth(DataPage, {
  fallbackMessage: 'Страница аналитики доступна только после авторизации.',
});
const ProtectedProfilePage = withAuth(ProfilePage, {
  fallbackMessage: 'Страница профиля доступна только после авторизации.',
});

function RouteLoading() {
  return <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>;
}

function ProtectedRouteWrapper() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function AppContent({ isDarkTheme, toggleTheme }) {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return <RouteLoading />;
  }

  const currentView =
    location.pathname === '/'
      ? 'dashboard'
      : location.pathname.replace('/', '');
  const knownRoutes = new Set(['/', '/dashboard', '/tools', '/data', '/profile', '/login', '/register']);
  const is404Route = !knownRoutes.has(location.pathname);

  return (
    <>
      {currentUser && !is404Route && (
        <Header
          onViewChange={(view) => navigate(view === 'dashboard' ? '/' : `/${view}`)}
          currentView={currentView}
          isDarkTheme={isDarkTheme}
          toggleTheme={toggleTheme}
        />
      )}

      <main className={`app-content ${is404Route ? 'app-content-404' : ''}`}>
        <Suspense fallback={<RouteLoading />}>
          {currentUser && !is404Route && <Notifications />}

          <Routes>
            <Route
              path="/login"
              element={currentUser ? <Navigate to="/" replace /> : <Login />}
            />

            <Route
              path="/register"
              element={currentUser ? <Navigate to="/" replace /> : <Register />}
            />

            <Route element={<ProtectedRouteWrapper />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/tools" element={<ToolsPage />} />
            </Route>

            <Route path="/data" element={<ProtectedDataPage />} />
            <Route path="/profile" element={<ProtectedProfilePage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
    const oppositeClass = isDarkTheme ? 'light-theme' : 'dark-theme';

    document.documentElement.classList.remove(oppositeClass);
    document.documentElement.classList.add(themeClass);
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const toggleTheme = () => setIsDarkTheme((prev) => !prev);

  return (
    <BrowserRouter>
      <AuthProvider>
        <DashboardProvider>
          <div className={`App ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
            <AppContent isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
          </div>
        </DashboardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
