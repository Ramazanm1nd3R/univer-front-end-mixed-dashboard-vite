import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDashboardData } from '../../context/DashboardContext';
import LifeWheelTool from '../Tools/LifeWheelTool';
import './ToolsPage.css';

const MODES = {
  work: { label: '🎯 Work', defaultSeconds: 25 * 60, color: '#1d4ed8' },
  shortBreak: { label: '☕ Short Break', defaultSeconds: 5 * 60, color: '#0ea5e9' },
  longBreak: { label: '🌴 Long Break', defaultSeconds: 15 * 60, color: '#0f766e' },
};

const MODE_SECONDS_STORAGE_KEY = 'taskflow-pomodoro-mode-seconds';

function getInitialModeSeconds() {
  const fallback = {
    work: MODES.work.defaultSeconds,
    shortBreak: MODES.shortBreak.defaultSeconds,
    longBreak: MODES.longBreak.defaultSeconds,
  };

  try {
    const raw = localStorage.getItem(MODE_SECONDS_STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return {
      work: Number(parsed.work) > 0 ? Number(parsed.work) : fallback.work,
      shortBreak: Number(parsed.shortBreak) > 0 ? Number(parsed.shortBreak) : fallback.shortBreak,
      longBreak: Number(parsed.longBreak) > 0 ? Number(parsed.longBreak) : fallback.longBreak,
    };
  } catch {
    return fallback;
  }
}

function PomodoroTimer() {
  const initialModeSeconds = useRef(getInitialModeSeconds());
  const [mode, setMode] = useState('work');
  const [modeSeconds, setModeSeconds] = useState(initialModeSeconds.current);
  const [remaining, setRemaining] = useState(initialModeSeconds.current.work);
  const [customMinutes, setCustomMinutes] = useState(
    String(Math.round(initialModeSeconds.current.work / 60)),
  );
  const [isActive, setIsActive] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(() => {
    const stored = Number(localStorage.getItem('taskflow-pomodoros') || 0);
    return Number.isNaN(stored) ? 0 : stored;
  });

  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('taskflow-pomodoros', String(completedPomodoros));
  }, [completedPomodoros]);

  useEffect(() => {
    localStorage.setItem(MODE_SECONDS_STORAGE_KEY, JSON.stringify(modeSeconds));
  }, [modeSeconds]);

  useEffect(() => {
    setCustomMinutes(String(Math.round(modeSeconds[mode] / 60)));
  }, [mode, modeSeconds]);

  useEffect(() => {
    if (!isActive) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsActive(false);
          if (mode === 'work') {
            setCompletedPomodoros((value) => value + 1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isActive, mode]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setRemaining(modeSeconds[nextMode]);
    setIsActive(false);
    clearInterval(timerRef.current);
  };

  const resetTimer = () => {
    setRemaining(modeSeconds[mode]);
    setIsActive(false);
    clearInterval(timerRef.current);
  };

  const applyCustomMinutes = () => {
    const parsed = Number.parseInt(customMinutes, 10);
    const safeMinutes = Number.isNaN(parsed) ? Math.round(modeSeconds[mode] / 60) : Math.min(180, Math.max(1, parsed));
    const nextSeconds = safeMinutes * 60;

    setModeSeconds((prev) => ({ ...prev, [mode]: nextSeconds }));
    setRemaining(nextSeconds);
    setIsActive(false);
    setCustomMinutes(String(safeMinutes));
    clearInterval(timerRef.current);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const total = modeSeconds[mode];
  const progress = ((total - remaining) / total) * 100;
  const radius = 126;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="pomodoro-container">
      <div className="mode-tabs">
        {Object.entries(MODES).map(([key, config]) => (
          <button
            key={key}
            className={`mode-tab ${mode === key ? 'active' : ''}`}
            onClick={() => switchMode(key)}
          >
            {config.label} ({Math.round(modeSeconds[key] / 60)} min)
          </button>
        ))}
      </div>

      <div className="custom-time-controls">
        <label htmlFor="custom-mode-minutes" className="custom-time-label">
          Timer duration for current mode (minutes)
        </label>
        <div className="custom-time-row">
          <input
            id="custom-mode-minutes"
            type="number"
            min="1"
            max="180"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            className="custom-time-input"
          />
          <button className="btn-secondary custom-time-btn" onClick={applyCustomMinutes}>
            Apply
          </button>
        </div>
      </div>

      <div className="timer-container">
        <div className="timer-circle">
          <svg className="timer-ring" viewBox="0 0 300 300" aria-hidden="true">
            <circle cx="150" cy="150" r={radius} className="ring-bg" />
            <circle
              cx="150"
              cy="150"
              r={radius}
              className="ring-progress"
              style={{
                stroke: MODES[mode].color,
                strokeDasharray: circumference,
                strokeDashoffset: offset,
              }}
            />
          </svg>

          <div className="timer-text">
            <div className="timer-display">
              <span className="timer-minutes">{String(minutes).padStart(2, '0')}</span>
              <span className="timer-separator">:</span>
              <span className="timer-seconds">{String(seconds).padStart(2, '0')}</span>
            </div>
            <span className="timer-label">{mode === 'work' ? 'Focus Time' : 'Break Time'}</span>
          </div>
        </div>
      </div>

      <div className="timer-controls">
        <button className="btn-primary" onClick={() => setIsActive((state) => !state)}>
          {isActive ? '⏸ Pause' : '▶️ Start'}
        </button>
        <button className="btn-secondary" onClick={resetTimer}>🔄 Reset</button>
      </div>

      <div className="pomodoro-stats-row">
        <div className="stat-inline">
          <span className="stat-value">{completedPomodoros}</span>
          <span className="stat-label">Pomodoros Today</span>
        </div>
        <div className="stat-inline">
          <span className="stat-value">{completedPomodoros * 25}</span>
          <span className="stat-label">Minutes Focused</span>
        </div>
      </div>
    </div>
  );
}

function QuickStats() {
  const { items } = useDashboardData();

  const todayMetrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayItems = items.filter((item) => {
      const date = new Date(item.updatedAt || item.date).toISOString().slice(0, 10);
      return date === today;
    });

    const completedToday = todayItems.filter((item) => item.status === 'completed').length;
    const activeToday = items.filter((item) => item.status === 'active').length;
    const focusTime = Math.max(1, Math.round((completedToday * 35) / 60));

    return { completedToday, activeToday, focusTime };
  }, [items]);

  return (
    <div className="quick-stats-tool">
      <h3>📊 Today's Summary</h3>
      <div className="quick-stats">
        <div className="quick-stat">
          <span className="quick-stat-icon">✅</span>
          <span className="quick-stat-value">{todayMetrics.completedToday}</span>
          <span className="quick-stat-label">Completed</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-icon">⚡</span>
          <span className="quick-stat-value">{todayMetrics.activeToday}</span>
          <span className="quick-stat-label">Active</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-icon">⏱️</span>
          <span className="quick-stat-value">{todayMetrics.focusTime}h</span>
          <span className="quick-stat-label">Focus Time</span>
        </div>
      </div>
    </div>
  );
}

function ToolsPage() {
  const { items } = useDashboardData();
  const userCategories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))],
    [items],
  );

  return (
    <div className="tools-page">
      <div className="tools-header">
        <h1>🛠️ Productivity Tools</h1>
        <p>Focus tools to boost your productivity</p>
      </div>

      <div className="tools-grid-vertical">
        <div className="tool-section">
          <div className="tool-card">
            <PomodoroTimer />
          </div>
        </div>

        <div className="tool-section">
          <LifeWheelTool userCategories={userCategories} />
        </div>

        <div className="tool-section">
          <div className="tool-card">
            <QuickStats />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToolsPage;
