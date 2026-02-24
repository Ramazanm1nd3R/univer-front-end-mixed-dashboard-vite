import React from 'react';
import './Loading.css';

function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">Загрузка...</p>
    </div>
  );
}

export default Loading;