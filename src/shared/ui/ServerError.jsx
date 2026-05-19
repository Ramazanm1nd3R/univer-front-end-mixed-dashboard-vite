import React from 'react';
import './ServerError.css';

function ServerError({ onRetry, message = 'Не удалось загрузить данные. Проверьте подключение к серверу.' }) {
  return (
    <div className="server-error">
      <div className="server-error-icon">📭</div>
      <h2 className="server-error-title">Данные не найдены</h2>
      <p className="server-error-message">{message}</p>
      {onRetry && (
        <button className="server-error-button" onClick={onRetry}>
          🔄 Попробовать снова
        </button>
      )}
    </div>
  );
}

export default ServerError;