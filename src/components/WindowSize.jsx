import React, { useState, useEffect } from 'react';
import '../styles/WindowSize.css';

function WindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getDeviceType = () => {
    if (windowSize.width < 768) return 'Мобильное устройство';
    if (windowSize.width < 1024) return 'Планшет';
    return 'Десктоп';
  };

  return (
    <div className="window-size-container">
      <h3>Размер окна</h3>
      <div className="size-info">
        <div className="size-item">
          <span className="label">Ширина:</span>
          <span className="value">{windowSize.width}px</span>
        </div>
        <div className="size-item">
          <span className="label">Высота:</span>
          <span className="value">{windowSize.height}px</span>
        </div>
        <div className="size-item device-type">
          <span className="label">Устройство:</span>
          <span className="value">{getDeviceType()}</span>
        </div>
      </div>
    </div>
  );
}

export default WindowSize;