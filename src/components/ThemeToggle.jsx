import React from 'react';
import '../styles/ThemeToggle.css';

function ThemeToggle({ isDark, onToggle }) {
  return (
    <div className="theme-toggle-container">
      <button 
        className={`theme-toggle-btn ${isDark ? 'dark' : 'light'}`}
        onClick={onToggle}
        aria-label="Toggle theme"
      >
        <span className="theme-icon">
          {isDark ? '🌙' : '☀️'}
        </span>
        <span className="theme-text">
          {isDark ? 'Темная' : 'Светлая'}
        </span>
      </button>
    </div>
  );
}

export default ThemeToggle;