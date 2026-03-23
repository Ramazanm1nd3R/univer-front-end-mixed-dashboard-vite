import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import VerificationCode from './VerificationCode';
import './Auth.css';

function Login({ onSwitchToRegister }) {
  const { initiateLogin, pendingVerification } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goToRegister = () => {
    if (typeof onSwitchToRegister === 'function') {
      onSwitchToRegister();
      return;
    }

    navigate('/register');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await initiateLogin(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  // Если код отправлен, показываем форму верификации
  if (pendingVerification && pendingVerification.type === 'login') {
    return <VerificationCode email={formData.email} type="login" />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🎯 TaskFlow AI</h1>
          <h2>Вход в систему</h2>
          <p>Добро пожаловать! Введите свои данные для входа.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-field">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label>Пароль</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Введите пароль"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Нет аккаунта?{' '}
            <button type="button" onClick={goToRegister} className="link-button">
              Зарегистрироваться
            </button>
          </p>
        </div>

        <div className="auth-demo">
          <p className="demo-title">Демо-доступ:</p>
          <p className="demo-text">Email: demo@example.com</p>
          <p className="demo-text">Пароль: demo123</p>
          <button 
            onClick={() => {
              setFormData({ email: 'demo@example.com', password: 'demo123' });
              setTimeout(() => {
                document.querySelector('.auth-form').requestSubmit();
              }, 100);
            }}
            className="demo-button"
          >
            Войти как демо
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
