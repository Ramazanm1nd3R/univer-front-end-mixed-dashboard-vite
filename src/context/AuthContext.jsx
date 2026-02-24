import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('currentSession');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      if (new Date(session.expiresAt) > new Date()) {
        setCurrentUser(session.user);
      } else {
        localStorage.removeItem('currentSession');
      }
    }
    setLoading(false);
  }, []);

  // Генерация 6-значного кода
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Отправка кода через Flask backend
  const sendVerificationCode = async (email, type = 'login') => {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 60000).toISOString();

    // Сохраняем код локально
    const verificationData = {
      email,
      code,
      expiresAt,
      type,
      attempts: 0
    };

    localStorage.setItem('pendingVerification', JSON.stringify(verificationData));
    setPendingVerification(verificationData);

    console.log('📧 Отправка кода на email:', email);
    console.log('🔐 Код:', code);

    try {
      const result = await api.sendVerificationCode(email, code, type);

      if (result.success) {
        console.log('✅ Email успешно отправлен на:', email);
        alert(`✅ Код отправлен на ${email}\n\n🔐 Код (для теста): ${code}\n⏱️ Действителен 60 секунд`);
      } else {
        throw new Error(result.error || 'Ошибка отправки');
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
      alert(`⚠️ Ошибка отправки email\n\n🔐 Ваш код: ${code}\n⏱️ Действителен 60 секунд\n\nВведите его на странице`);
      return { success: false };
    }
  };

  // Регистрация - шаг 1
  const initiateRegister = async (userData) => {
    // Сохраняем данные для регистрации
    localStorage.setItem('pendingRegistration', JSON.stringify(userData));
    
    // Отправляем код верификации
    await sendVerificationCode(userData.email, 'register');
  };

  // Регистрация - шаг 2 (после ввода кода)
  const completeRegister = async (code) => {
    const verification = JSON.parse(localStorage.getItem('pendingVerification') || '{}');
    const userData = JSON.parse(localStorage.getItem('pendingRegistration') || '{}');

    if (!verification.code || !userData.email) {
      throw new Error('Данные не найдены');
    }

    if (new Date(verification.expiresAt) < new Date()) {
      throw new Error('Код истек. Запросите новый код.');
    }

    if (verification.code !== code) {
      verification.attempts = (verification.attempts || 0) + 1;
      localStorage.setItem('pendingVerification', JSON.stringify(verification));
      
      if (verification.attempts >= 3) {
        localStorage.removeItem('pendingVerification');
        localStorage.removeItem('pendingRegistration');
        throw new Error('Превышено количество попыток');
      }
      
      throw new Error(`Неверный код. Осталось попыток: ${3 - verification.attempts}`);
    }

    // Регистрация через API
    const result = await api.register({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName
    });

    if (!result.success) {
      throw new Error(result.error || 'Ошибка регистрации');
    }

    // Очищаем временные данные
    localStorage.removeItem('pendingVerification');
    localStorage.removeItem('pendingRegistration');
    setPendingVerification(null);

    // Получаем данные пользователя и создаем сессию
    const userResult = await api.getUser(result.userId);
    if (userResult.success) {
      createSession(userResult.user);
    }
  };

  // Вход - шаг 1
  const initiateLogin = async (credentials) => {
    // Проверяем логин через API
    const result = await api.login(credentials);

    if (!result.success) {
      throw new Error(result.error || 'Ошибка входа');
    }

    // Сохраняем user ID для дальнейшей верификации
    localStorage.setItem('pendingLoginUserId', result.user.id);

    // Отправляем код верификации
    await sendVerificationCode(credentials.email, 'login');
  };

  // Вход - шаг 2 (после ввода кода)
  const completeLogin = async (code) => {
    const verification = JSON.parse(localStorage.getItem('pendingVerification') || '{}');
    const userId = localStorage.getItem('pendingLoginUserId');

    if (!verification.code || !userId) {
      throw new Error('Данные не найдены');
    }

    if (new Date(verification.expiresAt) < new Date()) {
      throw new Error('Код истек. Запросите новый код.');
    }

    if (verification.code !== code) {
      verification.attempts = (verification.attempts || 0) + 1;
      localStorage.setItem('pendingVerification', JSON.stringify(verification));
      
      if (verification.attempts >= 3) {
        localStorage.removeItem('pendingVerification');
        localStorage.removeItem('pendingLoginUserId');
        throw new Error('Превышено количество попыток');
      }
      
      throw new Error(`Неверный код. Осталось попыток: ${3 - verification.attempts}`);
    }

    // Получаем данные пользователя
    const result = await api.getUser(userId);

    if (!result.success) {
      throw new Error('Пользователь не найден');
    }

    // Очищаем временные данные
    localStorage.removeItem('pendingVerification');
    localStorage.removeItem('pendingLoginUserId');
    setPendingVerification(null);

    // Создаем сессию
    createSession(result.user);
  };

  // Создание сессии
  const createSession = (user) => {
    const session = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    localStorage.setItem('currentSession', JSON.stringify(session));
    setCurrentUser(session.user);
  };

  // Повторная отправка кода
  const resendCode = async () => {
    const verification = JSON.parse(localStorage.getItem('pendingVerification') || '{}');
    
    if (!verification.email) {
      throw new Error('Нет активной верификации');
    }

    await sendVerificationCode(verification.email, verification.type);
  };

  const logout = () => {
    localStorage.removeItem('currentSession');
    setCurrentUser(null);
  };

  const updateUserProfile = async (profileData) => {
    if (!currentUser) return;
    
    const result = await api.updateProfile(currentUser.id, profileData);
    if (!result.success) {
      throw new Error('Ошибка обновления профиля');
    }
  };

  const updateUserSettings = async (settingsData) => {
    if (!currentUser) return;
    
    const result = await api.updateSettings(currentUser.id, settingsData);
    if (!result.success) {
      throw new Error('Ошибка обновления настроек');
    }
  };

  const getCurrentUserData = async () => {
    if (!currentUser) return null;
    
    const result = await api.getUser(currentUser.id);
    return result.success ? result.user : null;
  };

  const value = {
    currentUser,
    loading,
    pendingVerification,
    initiateRegister,
    completeRegister,
    initiateLogin,
    completeLogin,
    resendCode,
    logout,
    updateUserProfile,
    updateUserSettings,
    getCurrentUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};