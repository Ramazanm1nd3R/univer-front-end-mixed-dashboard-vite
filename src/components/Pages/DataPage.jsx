import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { generateInsights, generatePredictions } from '../../services/openai';
import './DataPage.css';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const getActivityHeatmapColor = (count) => {
  if (count === 0) return 'var(--bg-secondary)';
  if (count <= 1) return '#dbeafe';
  if (count <= 3) return '#93c5fd';
  if (count <= 6) return '#3b82f6';
  return '#1d4ed8';
};

const getDueHeatmapColor = (count) => {
  if (count === 0) return 'var(--bg-secondary)';
  if (count <= 1) return '#fed7aa';
  if (count <= 3) return '#fdba74';
  if (count <= 6) return '#f97316';
  return '#c2410c';
};

const getHeatmapCellStyle = (activityCount, dueCount) => {
  const hasActivity = activityCount > 0;
  const hasDueDate = dueCount > 0;

  if (!hasActivity && !hasDueDate) {
    return {
      background: 'var(--bg-secondary)',
      borderColor: 'rgba(59, 130, 246, 0.12)',
      opacity: 0.35,
    };
  }

  if (hasActivity && hasDueDate) {
    return {
      background: `linear-gradient(135deg, ${getActivityHeatmapColor(activityCount)} 0%, ${getActivityHeatmapColor(activityCount)} 48%, ${getDueHeatmapColor(dueCount)} 52%, ${getDueHeatmapColor(dueCount)} 100%)`,
      borderColor: 'rgba(249, 115, 22, 0.45)',
      opacity: 1,
    };
  }

  return hasActivity
    ? {
        background: getActivityHeatmapColor(activityCount),
        borderColor: 'rgba(59, 130, 246, 0.25)',
        opacity: 1,
      }
    : {
        background: getDueHeatmapColor(dueCount),
        borderColor: 'rgba(249, 115, 22, 0.35)',
        opacity: 1,
      };
};

const getPriorityColor = (priority) => {
  const map = {
    high:   'linear-gradient(90deg,#ef4444,#dc2626)',
    medium: 'linear-gradient(90deg,#f59e0b,#d97706)',
    low:    'linear-gradient(90deg,#10b981,#059669)',
  };
  return map[priority] || 'linear-gradient(90deg,#6b7280,#4b5563)';
};

const getPriorityLabel = (priority) => {
  const map = { high: '🔴 Высокий', medium: '🟡 Средний', low: '🟢 Низкий' };
  return map[priority] || priority;
};

const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  const now  = new Date();
  const diff = now - date;
  if (diff < 60000)    return 'Только что';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
  if (diff < 604800000)return `${Math.floor(diff / 86400000)} дн назад`;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const DAY_KEYS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="data-page-loading">
      <div className="loading-spinner" />
      <p>Загрузка аналитики...</p>
    </div>
  );
}

function ErrorState({ error, retry }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:500, gap:'1.5rem', padding:'2rem' }}>
      <div style={{ fontSize:'4rem' }}>❌</div>
      <h2 style={{ color:'var(--text-primary)', fontSize:'1.5rem', fontWeight:800, margin:0 }}>Ошибка загрузки</h2>
      <p style={{ color:'var(--text-secondary)', textAlign:'center', maxWidth:420, margin:0 }}>{error}</p>
      <button onClick={retry} style={{ padding:'0.75rem 2rem', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:'1rem', cursor:'pointer' }}>
        🔄 Попробовать снова
      </button>
    </div>
  );
}

function EmptyState({ navigate }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:500, gap:'1.5rem', padding:'2rem' }}>
      <div style={{ fontSize:'5rem' }}>📊</div>
      <h2 style={{ color:'var(--text-primary)', fontSize:'1.75rem', fontWeight:800, margin:0 }}>Нет данных для аналитики</h2>
      <p style={{ color:'var(--text-secondary)', textAlign:'center', maxWidth:420, margin:0, lineHeight:1.6 }}>
        Создайте несколько задач на Dashboard, чтобы здесь появилась статистика и графики.
      </p>
      <button onClick={() => navigate('/')} style={{ padding:'0.75rem 2rem', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:'1rem', cursor:'pointer' }}>
        ➕ Создать задачу
      </button>
    </div>
  );
}

// ─── Main Stats Cards ─────────────────────────
function MainStats({ analytics }) {
  const { totalTasks, activeTasks, completedTasks, completionRate } = analytics;
  const cards = [
    { label:'ВСЕГО ЗАДАЧ',  value:totalTasks,    icon:'📋', type:'primary', pct:100 },
    { label:'АКТИВНЫХ',     value:activeTasks,   icon:'⚡', type:'warning', pct: totalTasks ? Math.round((activeTasks/totalTasks)*100) : 0 },
    { label:'ЗАВЕРШЕНО',    value:completedTasks, icon:'✅', type:'success', pct:completionRate },
    { label:'ВЫПОЛНЕНО %',  value:`${completionRate}%`, icon:'🎯', type:'info', pct:completionRate },
  ];
  return (
    <div className="main-stats-grid">
      {cards.map(c => (
        <div key={c.label} className={`main-stat-card ${c.type}`}>
          <div className="main-stat-header">
            <span className="main-stat-icon">{c.icon}</span>
            <span className={`main-stat-trend ${c.pct >= 50 ? 'positive' : 'negative'}`}>{c.pct}%</span>
          </div>
          <div className="main-stat-value">{c.value}</div>
          <div className="main-stat-label">{c.label}</div>
          <div className="main-stat-progress">
            <div className={`main-stat-progress-fill ${c.type === 'success' ? 'success' : ''}`} style={{ width:`${c.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Heatmap 7×24 ────────────────────────────
function Heatmap({ heatmapData, dueHeatmapData, dueStatusHeatmapData }) {
  const [tooltip, setTooltip] = useState(null);
  return (
    <div className="section-card">
      <div className="section-header">
        <h3>🗓️ Активность по дням и часам</h3>
        <span className="section-badge">Heatmap</span>
      </div>
      <div className="heatmap-container">
        <div className="heatmap-grid">
          {/* Y-axis */}
          <div className="heatmap-labels-y">
            {DAY_KEYS.map((d, i) => (
              <span key={d} className="heatmap-label">{DAY_LABELS[i]}</span>
            ))}
          </div>
          {/* Body */}
          <div className="heatmap-content">
            <div className="heatmap-labels-x">
              {[0,3,6,9,12,15,18,21,23].map(h => (
                <span key={h} style={{ fontSize:'0.7rem', color:'var(--text-secondary)', fontWeight:600 }}>{h}:00</span>
              ))}
            </div>
            <div className="heatmap-cells">
              {DAY_KEYS.map(day => (
                <div key={day} className="heatmap-row">
                  {Array.from({ length:24 }, (_, hour) => {
                    const activityCount = (heatmapData[day] || {})[hour] || 0;
                    const dueCount = (dueHeatmapData?.[day] || {})[hour] || 0;
                    const dueCompleted = (dueStatusHeatmapData?.[day] || {})[hour]?.completed || 0;
                    const dueActive = (dueStatusHeatmapData?.[day] || {})[hour]?.active || 0;
                    const totalCount = activityCount + dueCount;
                    return (
                      <div
                        key={hour}
                        className="heatmap-cell"
                        style={getHeatmapCellStyle(activityCount, dueCount)}
                        title={`${day} ${hour}:00 — назначено: ${activityCount}, сроков: ${dueCount}, выполнено: ${dueCompleted}, активно: ${dueActive}`}
                        onMouseEnter={() => setTooltip({ day, hour, activityCount, dueCount, dueCompleted, dueActive })}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {totalCount > 0 && <span className="heatmap-value">{totalCount}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {tooltip && (
          <div style={{ marginTop:'0.75rem', padding:'0.625rem 1rem', background:'var(--bg-secondary)', borderRadius:8, fontSize:'0.875rem', color:'var(--text-secondary)', fontWeight:600, border:'1px solid var(--border-primary)' }}>
            📍 {tooltip.day} в {tooltip.hour}:00
            {' • '}
            <strong style={{ color:'#2563eb' }}>Назначено: {tooltip.activityCount}</strong>
            {' • '}
            <strong style={{ color:'#ea580c' }}>Сроков: {tooltip.dueCount}</strong>
            {' • '}
            <strong style={{ color:'#16a34a' }}>Выполнено: {tooltip.dueCompleted}</strong>
            {' • '}
            <strong style={{ color:'var(--text-primary)' }}>Активно: {tooltip.dueActive}</strong>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginTop:'1rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', fontWeight:600 }}>Легенда:</span>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <div style={{ width:20, height:20, borderRadius:4, background:'#3b82f6', border:'1px solid rgba(59,130,246,0.25)' }} />
            <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', fontWeight:600 }}>Время назначения задач</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <div style={{ width:20, height:20, borderRadius:4, background:'#f97316', border:'1px solid rgba(249,115,22,0.35)' }} />
            <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', fontWeight:600 }}>Слоты по срокам</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <div style={{ width:20, height:20, borderRadius:4, background:'linear-gradient(135deg, #3b82f6 0%, #3b82f6 48%, #f97316 52%, #f97316 100%)', border:'1px solid rgba(249,115,22,0.35)' }} />
            <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', fontWeight:600 }}>Действие + дата</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Trend Chart 30 days ──────────────────────
function TrendChart({ last30Days }) {
  const maxVal = Math.max(1, ...last30Days.map(d => d.completed + d.active));
  return (
    <div className="section-card">
      <div className="section-header">
        <h3>📈 Тренд за последние 30 дней</h3>
        <span className="section-badge">30 дней</span>
      </div>
      <div className="trend-chart">
        {last30Days.map((day, idx) => {
          const compH   = Math.max(4, (day.completed / maxVal) * 100);
          const activeH = Math.max(4, (day.active    / maxVal) * 100);
          const showLabel = idx % 5 === 0 || idx === last30Days.length - 1;
          return (
            <div key={day.date} className="trend-bar-group">
              <div className="trend-bars">
                <div className="trend-bar completed" style={{ height:`${compH}%` }}   title={`${day.date}: ${day.completed} завершено`} />
                <div className="trend-bar active"    style={{ height:`${activeH}%` }} title={`${day.date}: ${day.active} активных`} />
              </div>
              <div className="trend-label">{showLabel ? day.date.slice(5) : ''}</div>
            </div>
          );
        })}
      </div>
      <div className="trend-legend">
        <div className="legend-item"><div className="legend-dot completed" /><span>Завершено</span></div>
        <div className="legend-item"><div className="legend-dot active"    /><span>Активно</span></div>
      </div>
    </div>
  );
}

// ─── Distribution ─────────────────────────────
function DistributionSection({ analytics }) {
  const { topCategories, priorityDistribution, totalTasks } = analytics;
  return (
    <div className="distribution-grid">
      {/* Categories */}
      <div className="section-card">
        <div className="section-header">
          <h3>📁 По категориям</h3>
          <span className="section-badge">{topCategories.length} кат.</span>
        </div>
        <div className="category-chart">
          {topCategories.length === 0 ? (
            <p style={{ color:'var(--text-secondary)', textAlign:'center', padding:'2rem' }}>Нет данных</p>
          ) : topCategories.map(cat => (
            <div key={cat.name} className="category-row">
              <div className="category-name">{cat.name}</div>
              <div className="category-bar-container">
                <div className="category-bar-fill" style={{ width:`${cat.percentage}%` }}>
                  <span className="category-count">{cat.count}</span>
                </div>
                <span className="category-percentage">{cat.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priorities */}
      <div className="section-card">
        <div className="section-header">
          <h3>🎯 По приоритетам</h3>
          <span className="section-badge">{totalTasks} задач</span>
        </div>
        <div className="priority-chart">
          {Object.entries(priorityDistribution).map(([priority, count]) => {
            const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
            return (
              <div key={priority} className="priority-row">
                <div className="priority-info">
                  <div className={`priority-dot ${priority}`} />
                  <span className="priority-name">{getPriorityLabel(priority)}</span>
                </div>
                <div className="priority-bar-container">
                  <div className="priority-bar-fill" style={{ width:`${pct}%`, background: getPriorityColor(priority) }}>
                    <span className="priority-count">{count}</span>
                  </div>
                  <span className="priority-percentage">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Insights ─────────────────────────────────
function InsightsSection({ analytics, aiInsights, aiLoading }) {
  const { assignmentPeakHour, duePeakDay, duePeakHour, scheduleCoverageRate, plannedCompletionRate, overdueTasks, inferredScheduledTasks, topCategories } = analytics;
  const topCat = topCategories[0];
  const inferredNote = inferredScheduledTasks > 0
    ? ` Часть сроков восстановлена автоматически (${inferredScheduledTasks}).`
    : '';
  const texts = aiInsights || {
    productivity: `Чаще всего ты назначаешь задачи около ${assignmentPeakHour}:00. Это главное окно планирования.`,
    bestDay: `Самая плотная точка по срокам сейчас — ${duePeakDay} в ${duePeakHour}:00.`,
    completionTime: `Сроки стоят у ${scheduleCoverageRate}% задач, выполнено среди них ${plannedCompletionRate}%. Просроченных активных: ${overdueTasks}.${inferredNote}`,
    topCategory: topCat ? `«${topCat.name}» занимает ${topCat.percentage}% задач (${topCat.count} шт).` : 'Добавь задачи с категориями.',
  };

  const cards = [
    { type:'success', icon:'⏰', title:'Окно планирования',         text:texts.productivity },
    { type:'info',    icon:'📅', title:'Пиковый слот по срокам',    text:texts.bestDay },
    { type:'warning', icon:'🗂️', title:'План и статусы',           text:texts.completionTime },
    { type:'error',   icon:'🏆', title:'Топ-категория',            text:texts.topCategory },
  ];
  return (
    <div className="insights-section">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>💡 AI Insights</h3>
        {aiLoading && (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            Генерация инсайтов...
          </div>
        )}
        {aiInsights && (
          <span style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 12, fontWeight: 700 }}>
            ✨ AI
          </span>
        )}
      </div>
      <div className="insights-grid">
        {cards.map(c => (
          <div key={c.title} className={`insight-card insight-${c.type}`}>
            <span className="insight-icon">{c.icon}</span>
            <div className="insight-content">
              <strong>{c.title}</strong>
              <p>{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Predictions ──────────────────────────────
function PredictionsSection({ analytics, aiPredictions, aiLoading }) {
  const { totalTasks, activeTasks, upcomingTasks7Days, overdueTasks, plannedCompletionRate, duePeakHour } = analytics;
  const burnoutRisk  = activeTasks > totalTasks * 0.7 ? 'high' : activeTasks > totalTasks * 0.4 ? 'medium' : 'low';
  const burnoutLabel = { high:'🔴 Высокий', medium:'🟡 Средний', low:'🟢 Низкий' }[burnoutRisk];
  const burnoutCard  = { high:'danger',    medium:'warning',     low:'success'  }[burnoutRisk];
  const nextWeekEst  = Math.max(1, upcomingTasks7Days || Math.round((totalTasks / 30) * 7));
  const recommended  = Math.max(1, Math.round(nextWeekEst / 7));
  const optimalHours = [duePeakHour, (duePeakHour + 1) % 24].sort((a, b) => a - b);

  const texts = aiPredictions || {
    nextWeekForecast: 'Ожидаемая плановая нагрузка на ближайшую неделю по срокам задач.',
    burnoutRisk: overdueTasks > 0
      ? `Есть ${overdueTasks} просроченных активных задач. Сначала разгрузи их.`
      : burnoutRisk === 'high'
      ? 'Слишком много незакрытых задач. Постарайся завершить часть из них.'
      : burnoutRisk === 'medium'
      ? 'Умеренная нагрузка. Следи за балансом.'
      : 'Нагрузка в норме. Отличный ритм!',
    dailyRecommendation: 'Рекомендуемое количество задач в день для текущего темпа.',
    completionSpeed: plannedCompletionRate >= 70
      ? 'Большая часть задач со сроком уже доводится до нужного статуса.'
      : plannedCompletionRate >= 40
      ? 'Темп средний: часть плановых задач стоит выравнивать по дням.'
      : 'План перегружен: лучше ставить меньше задач на один день.',
  };

  const cards = [
    { type:'highlight', icon:'📆', value:nextWeekEst,   label:'Сроков на 7 дней',     desc:texts.nextWeekForecast },
    { type:burnoutCard, icon:'🔥', value:burnoutLabel,  label:'Риск перегрузки',      desc:texts.burnoutRisk },
    { type:'info',      icon:'✅', value:recommended,   label:'Задач в день (рек.)',  desc:texts.dailyRecommendation },
    { type:'success',   icon:'🏅', value:`${plannedCompletionRate}%`, label:'Выполнение по плану', desc:texts.completionSpeed },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>🔮 AI Прогнозы</h3>
        {aiLoading && (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            Генерация прогнозов...
          </div>
        )}
        {aiPredictions && (
          <span style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 12, fontWeight: 700 }}>
            ✨ AI
          </span>
        )}
      </div>

      <div className="predictions-grid">
        {cards.map(c => (
          <div key={c.label} className={`prediction-card ${c.type}`}>
            <div className="prediction-icon">{c.icon}</div>
            <div className="prediction-content">
              <div className="prediction-value">{c.value}</div>
              <div className="prediction-label">{c.label}</div>
              <div className="prediction-description">{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="section-header">
          <h3>⏰ Оптимальные часы работы</h3>
          <span className="section-badge">Рекомендации</span>
        </div>
        <div className="optimal-hours">
          {optimalHours.map(h => (
            <div key={h} className="optimal-hour-badge">
              <span className="optimal-hour-icon">🕐</span>
              <span className="optimal-hour-time">{h}:00 – {h + 1}:00</span>
            </div>
          ))}
        </div>
        <div className="optimal-hours-description">
          На основе того, на какие часы у тебя чаще ставятся сроки, ключевой слот нагрузки — <strong>{duePeakHour}:00</strong>.
          Не перегружай эти часы и распределяй приоритетные задачи ровнее.
        </div>
      </div>
    </>
  );
}

// ─── Recent Activities Table ──────────────────
function RecentActivities({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="section-card">
        <div className="section-header"><h3>🕒 Последние активности</h3></div>
        <p style={{ color:'var(--text-secondary)', textAlign:'center', padding:'2rem' }}>Нет данных</p>
      </div>
    );
  }
  return (
    <div className="section-card">
      <div className="section-header">
        <h3>🕒 Последние активности</h3>
        <span className="section-badge">{activities.length} задач</span>
      </div>
      <div className="activity-table-wrapper">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Задача</th>
              <th>Статус</th>
              <th>Категория</th>
              <th>Приоритет</th>
              <th>Срок / назначение</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(a => (
              <tr key={a.id}>
                <td className="task-cell">{a.text}</td>
                <td><span className={`status-tag ${a.action}`}>{a.action === 'completed' ? '✅ Завершено' : '⚡ Активно'}</span></td>
                <td><span className="category-tag">{a.category}</span></td>
                <td><span className={`priority-tag ${a.priority}`}>{getPriorityLabel(a.priority)}</span></td>
                <td className="date-cell">
                  {a.dueDate
                    ? `${a.dueDate}${a.dueTime ? ` ${a.dueTime}` : ''}`
                    : formatDate(a.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN DataPage
// ─────────────────────────────────────────────

function DataPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  const [aiInsights, setAiInsights] = useState(null);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUpdatedAt, setAiUpdatedAt] = useState(null);
  const [isAiFromCache, setIsAiFromCache] = useState(false);
  const lastAiCallRef = useRef(0);

  const loadAiInsights = useCallback(async (analyticsData, force = false) => {
    if (!analyticsData) return;

    const MIN_AI_INTERVAL = 5 * 60 * 1000;
    const now = Date.now();
    if (!force && now - lastAiCallRef.current < MIN_AI_INTERVAL) {
      console.log('⏳ Слишком частый вызов AI (< 5 мин)');
      return;
    }

    lastAiCallRef.current = now;
    setAiLoading(true);
    setIsAiFromCache(false);

    try {
      const startTime = performance.now();
      const [insights, predictions] = await Promise.all([
        generateInsights(analyticsData),
        generatePredictions(analyticsData),
      ]);
      const duration = performance.now() - startTime;
      const fromCache = duration < 100;

      setAiInsights(insights);
      setAiPredictions(predictions);
      setAiUpdatedAt(new Date().toISOString());
      setIsAiFromCache(fromCache);

      if (fromCache) {
        console.log(`✅ AI загружен из кэша за ${duration.toFixed(0)}ms (экономия $0.00035)`);
      } else {
        console.log(`🤖 AI сгенерирован за ${duration.toFixed(0)}ms (потрачено $0.00035)`);
      }
    } catch (aiError) {
      console.error('❌ Ошибка AI генерации:', aiError);
    } finally {
      setAiLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async (forceAiRefresh = false) => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await api.getDashboardAnalytics(currentUser.id);
      if (result.success) {
        setAnalytics(result.analytics);
        loadAiInsights(result.analytics, forceAiRefresh);
      } else {
        setError(result.error || 'Не удалось загрузить аналитику');
      }
    } catch (err) {
      console.error('❌ Ошибка аналитики:', err);
      setError('Не удалось подключиться к серверу. Убедись что backend запущен на порту 5001.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, loadAiInsights]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  if (loading)  return <LoadingState />;
  if (error)    return <ErrorState error={error} retry={loadAnalytics} />;
  if (!analytics || analytics.totalTasks === 0) return <EmptyState navigate={navigate} />;

  const VIEWS = [
    { id:'overview',     label:'📊 Обзор' },
    { id:'distribution', label:'📁 Распределение' },
    { id:'predictions',  label:'🔮 Прогнозы' },
    { id:'activities',   label:'🕒 Активности' },
  ];

  return (
    <div className="data-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-header-title">
            <div className="title-icon-wrapper">
              <svg
                className="title-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 3v18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 17V9m-5 8v-5m-5 5v-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1>Аналитика</h1>
          </div>
          <p>Статистика и инсайты по твоим задачам • {analytics.totalTasks} задач всего</p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => loadAnalytics()}
            style={{ padding:'0.625rem 1.25rem', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:'0.875rem', cursor:'pointer' }}
          >
            🔄 Обновить
          </button>
          <button
            onClick={() => loadAiInsights(analytics, true)}
            disabled={aiLoading}
            style={{ padding:'0.625rem 1.25rem', background:'linear-gradient(135deg,#4facfe,#00f2fe)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:'0.875rem', cursor:'pointer', opacity: aiLoading ? 0.7 : 1 }}
          >
            {aiLoading ? '⏳ AI...' : '✨ AI Обновить'}
          </button>
        </div>
      </div>

      {aiUpdatedAt && (
        <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
            AI обновлено: {formatDate(aiUpdatedAt)}
          </span>
          {isAiFromCache && (
            <span style={{ fontSize: '0.75rem', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              ⚡ Из кэша
              <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                (экономия $0.00035)
              </span>
            </span>
          )}
        </div>
      )}

      {analytics.inferredScheduledTasks > 0 && (
        <div style={{ marginBottom: '1rem', padding: '0.875rem 1rem', borderRadius: 12, border: '1px solid rgba(249, 115, 22, 0.25)', background: 'rgba(249, 115, 22, 0.08)', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
          Для {analytics.inferredScheduledTasks} задач сроки были восстановлены автоматически по дате создания, чтобы legacy-данные корректно участвовали в аналитике.
        </div>
      )}

      {/* View Tabs */}
      <div className="view-tabs">
        {VIEWS.map(v => (
          <button key={v.id} className={selectedView === v.id ? 'active' : ''} onClick={() => setSelectedView(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Always visible: 4 stat cards */}
      <MainStats analytics={analytics} />

      {/* Overview */}
      {selectedView === 'overview' && (
        <>
          <InsightsSection analytics={analytics} aiInsights={aiInsights} aiLoading={aiLoading} />
          <TrendChart last30Days={analytics.last30Days} />
          <Heatmap
            heatmapData={analytics.heatmapData}
            dueHeatmapData={analytics.dueHeatmapData}
            dueStatusHeatmapData={analytics.dueStatusHeatmapData}
          />
        </>
      )}

      {/* Distribution */}
      {selectedView === 'distribution' && (
        <DistributionSection analytics={analytics} />
      )}

      {/* Predictions */}
      {selectedView === 'predictions' && (
        <PredictionsSection analytics={analytics} aiPredictions={aiPredictions} aiLoading={aiLoading} />
      )}

      {/* Activities */}
      {selectedView === 'activities' && (
        <RecentActivities activities={analytics.recentActivities} />
      )}
    </div>
  );
}

export default DataPage;
