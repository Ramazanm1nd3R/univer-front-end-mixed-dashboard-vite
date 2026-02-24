import React from 'react';

// Лаба 4 Задача 6 - Страница NotFound ✅
function NotFoundPage({ onNavigate }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '4rem', margin: '0', color: '#667eea' }}>404</h1>
      <h2 style={{ marginTop: '0.5rem', color: '#333' }}>Страница не найдена</h2>
      <p style={{ color: '#666', maxWidth: '400px' }}>
        Запрашиваемая страница не существует или была удалена.
      </p>
      <button
        onClick={() => onNavigate('dashboard')}
        style={{
          marginTop: '1.5rem',
          padding: '12px 32px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        Вернуться на главную
      </button>
    </div>
  );
}

export default NotFound;