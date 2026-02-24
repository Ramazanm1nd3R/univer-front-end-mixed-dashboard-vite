import React, { useState, useEffect } from 'react';
import '../styles/Timer.css';

function Timer({ initialTime = 60 }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId;

    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, timeLeft]);

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(initialTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-container">
      <h3>Таймер обратного отсчета</h3>
      <div className={`timer-display ${timeLeft === 0 ? 'finished' : ''}`}>
        {formatTime(timeLeft)}
      </div>
      <div className="timer-controls">
        {!isRunning ? (
          <button onClick={startTimer} disabled={timeLeft === 0}>
            Старт
          </button>
        ) : (
          <button onClick={pauseTimer}>
            Пауза
          </button>
        )}
        <button onClick={resetTimer}>
          Сброс
        </button>
      </div>
      {timeLeft === 0 && <p className="timer-message">Время вышло! ⏰</p>}
    </div>
  );
}

export default Timer;