import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/App.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Создаем демо-аккаунт при первом запуске
const initDemoAccount = () => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  if (!users.find(u => u.email === 'demo@example.com')) {
    const demoUser = {
      id: 'demo-user-001',
      email: 'demo@example.com',
      password: 'demo123',
      firstName: 'Демо',
      lastName: 'Пользователь',
      createdAt: new Date('2025-01-01').toISOString(),
      lastLogin: new Date().toISOString(),
      profile: {
        phone: '+7 700 123 4567',
        bio: 'Это демонстрационный аккаунт для тестирования системы Mixed Dashboard. Все данные в этом аккаунте являются примерами.',
        company: 'Demo Company',
        position: 'Тестовый пользователь',
        location: 'Алматы, Казахстан',
        website: 'https://example.com',
        github: 'demouser',
        linkedin: 'demouser',
        twitter: 'demouser'
      },
      settings: {
        emailNotifications: true,
        pushNotifications: false,
        weeklyDigest: true,
        language: 'ru',
        timezone: 'Asia/Almaty',
        dateFormat: 'DD.MM.YYYY',
        theme: 'auto'
      }
    };
    
    users.push(demoUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Создаем демо-задачи для демо-пользователя
    const demoTasks = [
      {
        id: Date.now() + 1,
        text: 'Изучить основы React',
        status: 'completed',
        priority: 'high',
        category: 'Обучение',
        createdAt: new Date('2025-01-15').toISOString(),
        updatedAt: new Date('2025-01-20').toISOString()
      },
      {
        id: Date.now() + 2,
        text: 'Настроить рабочее окружение',
        status: 'completed',
        priority: 'medium',
        category: 'Работа',
        createdAt: new Date('2025-01-18').toISOString(),
        updatedAt: new Date('2025-01-22').toISOString()
      },
      {
        id: Date.now() + 3,
        text: 'Создать дизайн-систему',
        status: 'active',
        priority: 'high',
        category: 'Дизайн',
        createdAt: new Date('2025-02-01').toISOString(),
        updatedAt: new Date('2025-02-05').toISOString()
      },
      {
        id: Date.now() + 4,
        text: 'Написать документацию',
        status: 'active',
        priority: 'medium',
        category: 'Документация',
        createdAt: new Date('2025-02-03').toISOString(),
        updatedAt: new Date('2025-02-08').toISOString()
      },
      {
        id: Date.now() + 5,
        text: 'Провести код-ревью',
        status: 'active',
        priority: 'low',
        category: 'Разработка',
        createdAt: new Date('2025-02-09').toISOString(),
        updatedAt: new Date('2025-02-10').toISOString()
      }
    ];
    
    localStorage.setItem(`dashboardItems_${demoUser.id}`, JSON.stringify(demoTasks));
    
    console.log('✅ Демо-аккаунт создан:', demoUser.email);
  }
};

initDemoAccount();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
