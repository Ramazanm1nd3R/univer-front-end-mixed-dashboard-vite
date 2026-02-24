import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

function VerificationCode({ email, type }) {
  const { completeLogin, completeRegister, resendCode, pendingVerification } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [blocked, setBlocked] = useState(false); // после превышения попыток

  useEffect(() => {
    if (!pendingVerification) return;

    const updateTimer = () => {
      const now = new Date();
      const expiresAt = new Date(pendingVerification.expiresAt);
      const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      
      setTimeLeft(secondsLeft);
      setCanResend(secondsLeft === 0);

      if (secondsLeft === 0) {
        setError('Код истек. Запросите новый код.');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [pendingVerification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (blocked) return;

    setError('');
    setLoading(true);

    try {
      if (type === 'login') {
        await completeLogin(code.trim());
      } else {
        await completeRegister(code.trim());
      }
    } catch (err) {
      setError(err.message);
      // Блокируем форму если попытки исчерпаны
      if (err.message.includes('Превышено количество попыток')) {
        setBlocked(true);
        setCanResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    setCode('');
    setBlocked(false);

    try {
      await resendCode();
      setTimeLeft(60);
      setCanResend(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
    setError('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔐 Верификация</h1>
          <h2>Введите код из email</h2>
          <p>
            Код отправлен на <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-field">
            <label>6-значный код</label>
            <input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="000000"
              required
              autoComplete="off"
              className={`verification-input ${error ? 'error' : ''}`}
              maxLength={6}
              autoFocus
              disabled={blocked}
            />
            <div className="input-hint">
              Проверьте папку "Спам" если не видите письмо
            </div>
          </div>

          <div className="timer-display">
            {timeLeft > 0 && !blocked ? (
              <>
                ⏱️ Код действителен: <strong>{formatTime(timeLeft)}</strong>
              </>
            ) : (
              <span className="timer-expired">⚠️ {blocked ? 'Попытки исчерпаны' : 'Код истек'}</span>
            )}
          </div>

          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading || code.length !== 6 || timeLeft === 0 || blocked}
          >
            {loading ? 'Проверка...' : 'Подтвердить'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="resend-button"
            disabled={(!canResend && !blocked) || loading}
          >
            {canResend || blocked
              ? '📧 Отправить код повторно'
              : `Повторная отправка через ${formatTime(timeLeft)}`}
          </button>
        </form>

        <div className="auth-demo">
          <p className="demo-title">💡 Подсказка:</p>
          <p className="demo-text">
            Код верификации показан в консоли браузера (F12) и в alert-окне
          </p>
          <p className="demo-text" style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
            В продакшене код придет на email
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerificationCode;