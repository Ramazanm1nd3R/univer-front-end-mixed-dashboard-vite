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

// Провайдеры из feature/entity-слоёв. Порядок их монтирования важен:
// Dashboard читает currentUser из Auth, поэтому Auth должен быть выше.
import { AuthProvider, useAuth } from '@features/auth/model/AuthContext';
import { DashboardProvider } from '@entities/task/model/DashboardContext';
import { ScreenProtectionProvider } from '@features/screen-protection/model/ScreenProtectionContext';
import withAuth from '@features/auth/lib/withAuth';
import ScreenshotGuard from '@features/screen-protection/ui/ScreenshotGuard';
import ErrorBoundary from '@shared/ui/ErrorBoundary';

import Header from '@widgets/header/ui/Header';

import './styles/App.css';

// Ленивые импорты страниц — main bundle остаётся лёгким,
// чанк страницы подгружается только когда пользователь на неё переходит.
const Dashboard = lazy(() => import('@pages/dashboard/ui/Dashboard'));
const ToolsPage = lazy(() => import('@pages/tools/ui/ToolsPage'));
const DataPage = lazy(() => import('@pages/data/ui/DataPage'));
const ProfilePage = lazy(() => import('@pages/profile/ui/ProfilePage'));
const NotFoundPage = lazy(() => import('@pages/not-found/ui/NotFoundPage'));
const Login = lazy(() => import('@features/auth/ui/Login'));
const Register = lazy(() => import('@features/auth/ui/Register'));
const Notifications = lazy(() => import('@widgets/notifications/ui/Notifications'));

// Оборачиваем страницы HOC'ом withAuth — фоллбэк с предложением залогиниться,
// если кто-то откроет /data или /profile, не имея сессии.
const ProtectedDataPage = withAuth(DataPage, {
  fallbackMessage: 'Страница аналитики доступна только после авторизации.',
});
const ProtectedProfilePage = withAuth(ProfilePage, {
  fallbackMessage: 'Страница профиля доступна только после авторизации.',
});

function RouteLoading() {
  return <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>;
}

// Защищённый блок маршрутов: если сессии нет — редирект на /login.
// Сделано через Outlet, чтобы не оборачивать каждую страницу руками.
function ProtectedRouteWrapper() {
  const { currentUser, loading } = useAuth();

  // Пока AuthContext восстанавливает сессию из localStorage — показываем заглушку,
  // иначе моргнёт редирект на /login и тут же обратно.
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

  // Header подсвечивает активный пункт навигации по currentView.
  // У "/" нет суффикса, поэтому маппим его на 'dashboard' вручную.
  const currentView =
    location.pathname === '/'
      ? 'dashboard'
      : location.pathname.replace('/', '');

  // На 404 не показываем шапку — страница имеет собственный full-screen layout.
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
  // Инициализируем тему из localStorage синхронно (ленивая инициализация useState),
  // чтобы избежать вспышки светлой темы перед монтированием useEffect.
  const [isDarkTheme, setIsDarkTheme] = useState(() => localStorage.getItem('theme') === 'dark');

  // Управляем темой через класс на <html>, а не на корневом div —
  // так CSS-переменные доступны порталам (Modal, ToastViewport) тоже.
  useEffect(() => {
    const themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
    const oppositeClass = isDarkTheme ? 'light-theme' : 'dark-theme';

    document.documentElement.classList.remove(oppositeClass);
    document.documentElement.classList.add(themeClass);
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const toggleTheme = () => setIsDarkTheme((prev) => !prev);

  // Композиция провайдеров. Снаружи внутрь:
  //   Router → Auth → Dashboard → ScreenProtection → ScreenshotGuard → routes
  // ScreenshotGuard оборачивает контент, чтобы blur срабатывал поверх всего, что внутри.
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
