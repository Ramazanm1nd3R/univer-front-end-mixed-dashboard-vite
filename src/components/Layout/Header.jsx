import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

function Header({ onViewChange, currentView, isDarkTheme, toggleTheme }) {
  const { currentUser, logout } = useAuth();

  // Не показываем Header если не авторизован
  if (!currentUser) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  const handleNavigate = (view) => {
    console.log('🔵 Header: Переключение на:', view);
    onViewChange(view);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="logo" onClick={() => handleNavigate('dashboard')}>
          🎯 TaskFlow AI
        </h1>
        
        {/* Навигационное меню - Лаба 4 Задача 4 ✅ */}
        <nav className="nav-menu">
          <button
            className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-button ${currentView === 'tools' ? 'active' : ''}`}
            onClick={() => handleNavigate('tools')}
          >
            🛠️ Инструменты
          </button>
          <button
            className={`nav-button ${currentView === 'data' ? 'active' : ''}`}
            onClick={() => handleNavigate('data')}
          >
            📈 Аналитика
          </button>
          <button
            className={`nav-button ${currentView === 'profile' ? 'active' : ''}`}
            onClick={() => handleNavigate('profile')}
          >
            👤 Профиль
          </button>

          {/* Кнопка для теста NotFound (можно убрать после защиты) */}
          <button
            className="nav-button"
            onClick={() => handleNavigate('invalid-page-12345')}
            style={{ opacity: 0.6, fontSize: '0.875rem' }}
            title="Тест 404"
          >
            🔍 404
          </button>
        </nav>

        {/* Информация о пользователе */}
        <div className="user-section">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={isDarkTheme ? 'Светлая тема' : 'Тёмная тема'}
          >
            {isDarkTheme ? '☀️' : '🌙'}
          </button>
          <span className="user-info">
            {currentUser.firstName} {currentUser.lastName}
          </span>
          <button
            onClick={handleLogout}
            className="logout-button"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;