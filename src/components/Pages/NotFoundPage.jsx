import React from 'react';
import { useNavigate } from 'react-router-dom';

function NotFoundPage() {

  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh'
    }}>

      <h1>404</h1>

      <h2>Страница не найдена</h2>

      <button onClick={() => navigate("/")}>
        Вернуться на главную
      </button>

    </div>
  );
}

export default NotFoundPage;