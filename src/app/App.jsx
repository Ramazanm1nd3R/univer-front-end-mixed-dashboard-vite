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

import { AuthProvider, useAuth } from '@features/auth/model/AuthContext';
import { DashboardProvider } from '@entities/task/model/DashboardContext';
import { ScreenProtectionProvider } from '@features/screen-protection/model/ScreenProtectionContext';
import withAuth from '@features/auth/lib/withAuth';
import ScreenshotGuard from '@features/screen-protection/ui/ScreenshotGuard';
import ErrorBoundary from '@shared/ui/ErrorBoundary';

import Header from '@widgets/header/ui/Header';

import './styles/App.css';

const Dashboard = lazy(() => import('@pages/dashboard/ui/Dashboard'));
const ToolsPage = lazy(() => import('@pages/tools/ui/ToolsPage'));
const DataPage = lazy(() => import('@pages/data/ui/DataPage'));
const ProfilePage = lazy(() => import('@pages/profile/ui/ProfilePage'));
const NotFoundPage = lazy(() => import('@pages/not-found/ui/NotFoundPage'));
const Login = lazy(() => import('@features/auth/ui/Login'));
const Register = lazy(() => import('@features/auth/ui/Register'));
const Notifications = lazy(() => import('@widgets/notifications/ui/Notifications'));
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
        <ErrorBoundary>
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
        </ErrorBoundary>
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
          <ScreenProtectionProvider>
            <div className={`App ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
              <ScreenshotGuard>
                <AppContent isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
              </ScreenshotGuard>
            </div>
          </ScreenProtectionProvider>
        </DashboardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
