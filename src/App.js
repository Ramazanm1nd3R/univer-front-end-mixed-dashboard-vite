import React, { useState } from 'react';
import './App.css';
import { useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ThemeToggle from './components/ThemeToggle';
import Dashboard from './components/Dashboard/Dashboard';
import ToolsPage from './components/Pages/ToolsPage';
import DataPage from './components/Pages/DataPage';
import ProfilePage from './components/Pages/ProfilePage';

function App() {
  const { currentUser, loading } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  // Показываем загрузку пока проверяем сессию
  if (loading) {
    return (
      <div className={`app ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          Загрузка...
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем Login/Register
  if (!currentUser) {
    return (
      <div className={`app ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
        <ThemeToggle isDark={isDarkTheme} onToggle={toggleTheme} />
        {authView === 'login' ? (
          <Login onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <Register onSwitchToLogin={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  // Рендерим контент в зависимости от выбранной страницы
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tools':
        return <ToolsPage />;
      case 'data':
        return <DataPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`app ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      <Header 
        onViewChange={setCurrentView} 
        currentView={currentView}
      />
      
      <ThemeToggle isDark={isDarkTheme} onToggle={toggleTheme} />
      
      <main className="main-content">
        {renderView()}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;