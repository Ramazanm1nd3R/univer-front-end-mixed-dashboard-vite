import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ToolsPage.css';

/* ─────────────────────────────────────────────
   POMODORO TIMER
───────────────────────────────────────────── */
function PomodoroTool() {
  const MODES = {
    work:       { label: '🍅 Работа',     seconds: 25 * 60, color: '#ef4444' },
    short:      { label: '☕ Короткий',   seconds:  5 * 60, color: '#22c55e' },
    long:       { label: '🌙 Длинный',    seconds: 15 * 60, color: '#3b82f6' },
  };

  const [mode, setMode]         = useState('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.seconds);
  const [running, setRunning]   = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef             = useRef(null);

  const reset = useCallback((m = mode) => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(MODES[m].seconds);
  }, [mode]); // eslint-disable-line

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === 'work') setSessions(s => s + 1);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const switchMode = (m) => {
    setMode(m);
    reset(m);
    setTimeLeft(MODES[m].seconds);
  };

  const total   = MODES[mode].seconds;
  const pct     = ((total - timeLeft) / total) * 100;
  const r       = 54;
  const circ    = 2 * Math.PI * r;
  const offset  = circ - (pct / 100) * circ;
  const mm      = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss      = String(timeLeft % 60).padStart(2, '0');
  const accent  = MODES[mode].color;

  return (
    <div className="tool-section">
      <div className="tool-section-header">
        <h3>🍅 Помодоро Таймер</h3>
        <span className="tool-badge">Фокус</span>
      </div>

      {/* Mode tabs */}
      <div className="pomodoro-modes">
        {Object.entries(MODES).map(([key, cfg]) => (
          <button
            key={key}
            className={`pomo-mode-btn ${mode === key ? 'active' : ''}`}
            style={mode === key ? { background: cfg.color, borderColor: cfg.color } : {}}
            onClick={() => switchMode(key)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* SVG Ring */}
      <div className="pomodoro-ring-wrap">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border-primary)" strokeWidth="8" />
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke={accent}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        <div className="pomodoro-time" style={{ color: accent }}>{mm}:{ss}</div>
        <div className="pomodoro-mode-label">{MODES[mode].label}</div>
      </div>

      {/* Controls */}
      <div className="pomodoro-controls">
        <button className="pomo-btn secondary" onClick={() => reset()}>⟳ Сброс</button>
        <button
          className="pomo-btn primary"
          style={{ background: accent, borderColor: accent }}
          onClick={() => setRunning(r => !r)}
        >
          {running ? '⏸ Пауза' : '▶ Старт'}
        </button>
      </div>

      <div className="pomodoro-sessions">
        🍅 Сессий сегодня: <strong>{sessions}</strong>
        {sessions > 0 && sessions % 4 === 0 && (
          <span className="sessions-milestone"> · 🏆 Возьмите длинный перерыв!</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   QUICK NOTES
───────────────────────────────────────────── */
function QuickNotes() {
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('quick-notes') || '[]'); }
    catch { return []; }
  });
  const [input, setInput] = useState('');

  const save = (updated) => {
    setNotes(updated);
    localStorage.setItem('quick-notes', JSON.stringify(updated));
  };

  const addNote = () => {
    if (!input.trim()) return;
    save([{ id: Date.now(), text: input.trim(), done: false, ts: new Date().toLocaleString('ru') }, ...notes]);
    setInput('');
  };

  const toggleNote = (id) => save(notes.map(n => n.id === id ? { ...n, done: !n.done } : n));
  const deleteNote = (id) => save(notes.filter(n => n.id !== id));

  return (
    <div className="tool-section">
      <div className="tool-section-header">
        <h3>📝 Быстрые заметки</h3>
        <span className="tool-badge">{notes.length} заметок</span>
      </div>

      <div className="notes-input-row">
        <input
          className="notes-input"
          placeholder="Добавить заметку..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNote()}
        />
        <button className="notes-add-btn" onClick={addNote}>＋</button>
      </div>

      <div className="notes-list">
        {notes.length === 0 && (
          <div className="notes-empty">Нет заметок. Добавьте первую!</div>
        )}
        {notes.map(n => (
          <div key={n.id} className={`note-item ${n.done ? 'done' : ''}`}>
            <button className="note-check" onClick={() => toggleNote(n.id)}>
              {n.done ? '✅' : '⬜'}
            </button>
            <div className="note-body">
              <span className="note-text">{n.text}</span>
              <span className="note-ts">{n.ts}</span>
            </div>
            <button className="note-del" onClick={() => deleteNote(n.id)}>✕</button>
          </div>
        ))}
      </div>
      {notes.filter(n => n.done).length > 0 && (
        <button className="notes-clear-done" onClick={() => save(notes.filter(n => !n.done))}>
          🗑 Очистить завершённые ({notes.filter(n => n.done).length})
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   DAILY GOALS
───────────────────────────────────────────── */
function DailyGoals() {
  const todayKey = new Date().toISOString().split('T')[0];
  const storageKey = `daily-goals-${todayKey}`;

  const [goals, setGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
    catch { return []; }
  });
  const [input, setInput] = useState('');

  const save = (updated) => {
    setGoals(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const addGoal = () => {
    if (!input.trim()) return;
    save([...goals, { id: Date.now(), text: input.trim(), done: false }]);
    setInput('');
  };

  const toggleGoal = (id) => save(goals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  const deleteGoal = (id) => save(goals.filter(g => g.id !== id));

  const doneCount  = goals.filter(g => g.done).length;
  const totalCount = goals.length;
  const pct        = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="tool-section">
      <div className="tool-section-header">
        <h3>🎯 Цели на сегодня</h3>
        <span className="tool-badge">{doneCount}/{totalCount}</span>
      </div>

      {totalCount > 0 && (
        <div className="goals-progress-wrap">
          <div className="goals-progress-bar">
            <div className="goals-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="goals-pct">{pct}%</span>
        </div>
      )}

      <div className="notes-input-row">
        <input
          className="notes-input"
          placeholder="Новая цель на сегодня..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGoal()}
        />
        <button className="notes-add-btn" onClick={addGoal}>＋</button>
      </div>

      <div className="goals-list">
        {goals.length === 0 && (
          <div className="notes-empty">Поставьте цели на сегодня!</div>
        )}
        {goals.map(g => (
          <div key={g.id} className={`goal-item ${g.done ? 'done' : ''}`}>
            <button className="note-check" onClick={() => toggleGoal(g.id)}>
              {g.done ? '✅' : '⬜'}
            </button>
            <span className="note-text">{g.text}</span>
            <button className="note-del" onClick={() => deleteGoal(g.id)}>✕</button>
          </div>
        ))}
      </div>

      {pct === 100 && totalCount > 0 && (
        <div className="goals-congrats">🎉 Все цели на сегодня выполнены!</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CALCULATOR
───────────────────────────────────────────── */
function Calculator() {
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [history, setHistory] = useState([]);

  const handleCalculate = () => {
    if (!calcInput.trim()) return;
    try {
      // eslint-disable-next-line no-eval
      const result = eval(calcInput);
      setCalcResult(result);
      setHistory(h => [{ expr: calcInput, result }, ...h.slice(0, 4)]);
    } catch {
      setCalcResult('Ошибка');
    }
  };

  return (
    <div className="tool-section">
      <div className="tool-section-header">
        <h3>🧮 Калькулятор</h3>
        <span className="tool-badge">Утилита</span>
      </div>
      <div className="calc-display">
        <input
          className="calc-input"
          type="text"
          placeholder="Введите выражение: 2 + 2 * 3"
          value={calcInput}
          onChange={e => setCalcInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCalculate()}
        />
        {calcResult !== '' && (
          <div className="calc-result">= <strong>{calcResult}</strong></div>
        )}
      </div>
      <button className="tool-btn-primary" onClick={handleCalculate}>Вычислить</button>
      {history.length > 0 && (
        <div className="calc-history">
          {history.map((h, i) => (
            <div key={i} className="calc-history-row" onClick={() => { setCalcInput(h.expr); setCalcResult(h.result); }}>
              <span>{h.expr}</span><span>= {h.result}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   COLOR CONVERTER
───────────────────────────────────────────── */
function ColorConverter() {
  const [hexColor, setHexColor]   = useState('#667eea');
  const [rgbColor, setRgbColor]   = useState('rgb(102, 126, 234)');
  const [copied, setCopied]       = useState('');

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
      : 'Invalid';
  };

  const handleHexChange = (value) => {
    setHexColor(value);
    setRgbColor(hexToRgb(value));
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="tool-section">
      <div className="tool-section-header">
        <h3>🎨 Конвертер цветов</h3>
        <span className="tool-badge">Утилита</span>
      </div>
      <div className="color-preview-large" style={{ background: hexColor }}>
        <span className="color-preview-text">{hexColor.toUpperCase()}</span>
      </div>
      <div className="color-inputs">
        <div className="color-field">
          <label>HEX</label>
          <div className="color-field-row">
            <input
              type="color"
              value={hexColor.length === 7 ? hexColor : '#667eea'}
              onChange={e => handleHexChange(e.target.value)}
              className="color-picker"
            />
            <input
              type="text"
              value={hexColor}
              onChange={e => handleHexChange(e.target.value)}
              className="color-text-input"
              placeholder="#667eea"
            />
            <button className={`copy-btn ${copied === 'hex' ? 'copied' : ''}`}
              onClick={() => copy(hexColor, 'hex')}>
              {copied === 'hex' ? '✓' : '📋'}
            </button>
          </div>
        </div>
        <div className="color-field">
          <label>RGB</label>
          <div className="color-field-row">
            <input type="text" value={rgbColor} readOnly className="color-text-input" />
            <button className={`copy-btn ${copied === 'rgb' ? 'copied' : ''}`}
              onClick={() => copy(rgbColor, 'rgb')}>
              {copied === 'rgb' ? '✓' : '📋'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TEXT ANALYZER
───────────────────────────────────────────── */
function TextAnalyzer() {
  const [text, setText] = useState('');
  const wordCount    = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount    = text.length;
  const charNoSpaces = text.replace(/\s/g, '').length;
  const sentences    = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const readMins     = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="tool-section">
      <div className="tool-section-header">
        <h3>📝 Анализатор текста</h3>
        <span className="tool-badge">Утилита</span>
      </div>
      <textarea
        className="text-analyzer-area"
        placeholder="Введите или вставьте текст..."
        value={text}
        onChange={e => setText(e.target.value)}
        rows="6"
      />
      <div className="text-stats-grid">
        <div className="text-stat"><span className="ts-value">{charCount}</span><span className="ts-label">Символов</span></div>
        <div className="text-stat"><span className="ts-value">{charNoSpaces}</span><span className="ts-label">Без пробелов</span></div>
        <div className="text-stat"><span className="ts-value">{wordCount}</span><span className="ts-label">Слов</span></div>
        <div className="text-stat"><span className="ts-value">{sentences}</span><span className="ts-label">Предложений</span></div>
        <div className="text-stat"><span className="ts-value">{readMins}</span><span className="ts-label">Мин чтения</span></div>
      </div>
      {text && <button className="tool-btn-secondary" onClick={() => setText('')}>Очистить</button>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   UNIT CONVERTER
───────────────────────────────────────────── */
function UnitConverter() {
  const [inputValue, setInputValue] = useState('1');
  const [fromUnit, setFromUnit]     = useState('km');
  const [toUnit, setToUnit]         = useState('miles');

  const conversions = {
    'km-miles': v => v * 0.621371,
    'miles-km': v => v * 1.60934,
    'kg-lbs':   v => v * 2.20462,
    'lbs-kg':   v => v * 0.453592,
    'c-f':      v => (v * 9 / 5) + 32,
    'f-c':      v => (v - 32) * 5 / 9,
    'm-ft':     v => v * 3.28084,
    'ft-m':     v => v * 0.3048,
  };

  const units = ['km','miles','kg','lbs','c','f','m','ft'];

  const result = () => {
    const v = parseFloat(inputValue) || 0;
    const fn = conversions[`${fromUnit}-${toUnit}`];
    return fn ? fn(v).toFixed(4) : v.toFixed(4);
  };

  return (
    <div className="tool-section">
      <div className="tool-section-header">
        <h3>⚖️ Конвертер единиц</h3>
        <span className="tool-badge">Утилита</span>
      </div>
      <input
        type="number"
        className="form-input"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="Введите значение"
      />
      <div className="unit-row">
        <select className="form-select" value={fromUnit} onChange={e => setFromUnit(e.target.value)}>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <span className="unit-arrow">→</span>
        <select className="form-select" value={toUnit} onChange={e => setToUnit(e.target.value)}>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="unit-result">
        <span className="unit-result-val">{inputValue}</span>
        <span className="unit-result-from">{fromUnit}</span>
        <span>=</span>
        <span className="unit-result-val accent">{result()}</span>
        <span className="unit-result-from">{toUnit}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PASSWORD GENERATOR
───────────────────────────────────────────── */
function PasswordGenerator() {
  const [password, setPassword]         = useState('');
  const [length, setLength]             = useState(16);
  const [inclNumbers, setInclNumbers]   = useState(true);
  const [inclSymbols, setInclSymbols]   = useState(true);
  const [inclUpper, setInclUpper]       = useState(true);
  const [copied, setCopied]             = useState(false);

  const generate = () => {
    let charset = 'abcdefghijklmnopqrstuvwxyz';
    if (inclUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (inclNumbers) charset += '0123456789';
    if (inclSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let pw = '';
    for (let i = 0; i < length; i++) {
      pw += charset[Math.floor(Math.random() * charset.length)];
    }
    setPassword(pw);
    setCopied(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const strength = () => {
    if (!password) return null;
    const score = [inclNumbers, inclSymbols, inclUpper, length >= 16].filter(Boolean).length;
    const levels = ['', '🔴 Слабый', '🟡 Средний', '🟠 Хороший', '🟢 Сильный'];
    return levels[score] || levels[1];
  };

  return (
    <div className="tool-section">
      <div className="tool-section-header">
        <h3>🔐 Генератор паролей</h3>
        <span className="tool-badge">Безопасность</span>
      </div>

      <div className="pw-options">
        <div className="pw-length-row">
          <label>Длина: <strong>{length}</strong></label>
          <input type="range" min="8" max="32" value={length}
            onChange={e => setLength(Number(e.target.value))} className="pw-range" />
        </div>
        <div className="pw-checkboxes">
          {[
            ['Заглавные', inclUpper, setInclUpper],
            ['Цифры',     inclNumbers, setInclNumbers],
            ['Символы',   inclSymbols, setInclSymbols],
          ].map(([lbl, val, setter]) => (
            <label key={lbl} className="pw-check-label">
              <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} />
              {lbl}
            </label>
          ))}
        </div>
      </div>

      <button className="tool-btn-primary" onClick={generate}>⚡ Сгенерировать</button>

      {password && (
        <div className="pw-output-wrap">
          <div className="pw-output">
            <code className="pw-code">{password}</code>
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
              {copied ? '✓ Скопировано' : '📋 Копировать'}
            </button>
          </div>
          {strength() && <div className="pw-strength">{strength()}</div>}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   JSON FORMATTER
───────────────────────────────────────────── */
function JsonFormatter() {
  const [raw, setRaw]       = useState('');
  const [output, setOutput] = useState('');
  const [error, setError]   = useState('');

  const format = () => {
    if (!raw.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError('Ошибка: ' + e.message);
      setOutput('');
    }
  };

  const minify = () => {
    if (!raw.trim()) return;
    try {
      setOutput(JSON.stringify(JSON.parse(raw)));
      setError('');
    } catch (e) {
      setError('Ошибка: ' + e.message);
    }
  };

  return (
    <div className="tool-section tool-section-wide">
      <div className="tool-section-header">
        <h3>🔧 JSON Форматтер</h3>
        <span className="tool-badge">Утилита</span>
      </div>
      <div className="json-layout">
        <div className="json-col">
          <label className="json-col-label">Входные данные</label>
          <textarea
            className="json-area"
            placeholder='{"name": "example", "value": 123}'
            value={raw}
            onChange={e => setRaw(e.target.value)}
            rows="10"
          />
          <div className="json-btns">
            <button className="tool-btn-primary" onClick={format}>Форматировать</button>
            <button className="tool-btn-secondary" onClick={minify}>Минифицировать</button>
            <button className="tool-btn-secondary" onClick={() => { setRaw(''); setOutput(''); setError(''); }}>Очистить</button>
          </div>
          {error && <div className="json-error">{error}</div>}
        </div>
        <div className="json-col">
          <label className="json-col-label">Результат</label>
          <textarea
            className="json-area"
            readOnly
            placeholder="Отформатированный JSON появится здесь..."
            value={output}
            rows="10"
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const TABS = [
  { id: 'productivity', label: '⚡ Продуктивность' },
  { id: 'utilities',    label: '🔧 Утилиты' },
];

function ToolsPage() {
  const [activeTab, setActiveTab] = useState('productivity');

  return (
    <div className="tools-page">
      <div className="tools-page-header">
        <div>
          <h1>🛠️ Инструменты</h1>
          <p>Полезные утилиты для повседневных задач</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tools-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tools-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'productivity' && (
        <div className="tools-grid tools-grid-3">
          <PomodoroTool />
          <QuickNotes />
          <DailyGoals />
        </div>
      )}

      {activeTab === 'utilities' && (
        <div className="tools-grid tools-grid-2">
          <Calculator />
          <ColorConverter />
          <TextAnalyzer />
          <UnitConverter />
          <PasswordGenerator />
          <JsonFormatter />
        </div>
      )}
    </div>
  );
}

export default ToolsPage;
