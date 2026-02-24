import React, { useState } from 'react';
import '../styles/TogglePanel.css';

function TogglePanel() {
  const [toggles, setToggles] = useState({
    toggle1: false,
    toggle2: false,
    toggle3: false,
    toggle4: false
  });

  const handleToggle = (toggleName) => {
    setToggles({
      ...toggles,
      [toggleName]: !toggles[toggleName]
    });
  };

  const toggleLabels = {
    toggle1: 'Уведомления',
    toggle2: 'Звук',
    toggle3: 'Автосохранение',
    toggle4: 'Темный режим'
  };

  return (
    <div className="toggle-panel-container">
      <h3>Панель переключателей</h3>
      <div className="toggles-grid">
        {Object.keys(toggles).map(key => (
          <div key={key} className="toggle-item">
            <label className="toggle-label">
              <span>{toggleLabels[key]}</span>
              <div 
                className={`toggle-switch ${toggles[key] ? 'active' : ''}`}
                onClick={() => handleToggle(key)}
              >
                <div className="toggle-slider"></div>
              </div>
              <span className={`toggle-status ${toggles[key] ? 'on' : 'off'}`}>
                {toggles[key] ? 'Включен' : 'Выключен'}
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TogglePanel;