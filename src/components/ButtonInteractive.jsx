import React, { useState } from 'react';
import '../styles/ButtonInteractive.css';

function ButtonInteractive() {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="button-interactive-container">
      <h3>Интерактивная кнопка</h3>
      <button
        className={`interactive-btn ${isHovered ? 'hovered' : ''} ${isActive ? 'active' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        onClick={() => setClickCount(clickCount + 1)}
      >
        Нажми меня!
      </button>
      <div className="button-stats">
        <p>Состояние: {isActive ? 'Нажата' : isHovered ? 'Наведение' : 'Обычная'}</p>
        <p>Количество кликов: {clickCount}</p>
      </div>
    </div>
  );
}

export default ButtonInteractive;