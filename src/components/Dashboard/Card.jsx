import React from 'react';

const CATEGORY_CONFIG = {
  work:     { emoji: '💼', label: 'Работа' },
  personal: { emoji: '👤', label: 'Личное' },
  health:   { emoji: '💪', label: 'Здоровье' },
  other:    { emoji: '📌', label: 'Другое' },
};

const PRIORITY_LABELS = {
  high:   '🔴 Высокий',
  medium: '🟡 Средний',
  low:    '🟢 Низкий',
};

function formatDueDate(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isNaN(d)) return null;
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function Card({ item, onDelete, onToggleStatus, onToggleLike, onEdit }) {
  const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
  const isCompleted = item.status === 'completed';

  // Определяем просрочку
  const dueDate = item.dueDate ? new Date(item.dueDate) : null;
  const isOverdue = dueDate && !isCompleted && dueDate < new Date();
  const formattedDue = formatDueDate(item.dueDate);

  const cardDate = item.date
    ? new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '—';

  return (
    <div className={`card${isCompleted ? ' completed' : ''}${isOverdue ? ' overdue' : ''}`}>
      {/* Шапка */}
      <div className="card-header">
        <span className="card-category">
          <span className="category-emoji">{cat.emoji}</span>
          <span className="category-name">{cat.label}</span>
        </span>
        <span className={`priority-badge priority-${item.priority || 'medium'}`}>
          {PRIORITY_LABELS[item.priority] || PRIORITY_LABELS.medium}
        </span>
      </div>

      {/* Заголовок */}
      <div className="card-title">{item.title}</div>

      {/* Описание (если отличается от заголовка) */}
      {item.description && item.description !== item.title && (
        <div className="card-description">{item.description}</div>
      )}

      {/* Срок выполнения */}
      {formattedDue && (
        <div className={`card-due-date${isOverdue ? ' overdue-text' : ''}`}>
          <span className="due-icon">{isOverdue ? '⚠️' : '📅'}</span>
          <span>{formattedDue}</span>
          {isOverdue && <span className="overdue-badge">Просрочено</span>}
        </div>
      )}

      {/* Footer */}
      <div className="card-footer">
        <div className="card-meta">
          <span className="card-date">📅 {cardDate}</span>
          <button className="like-button" onClick={() => onToggleLike(item.id)}>
            ❤️ {item.likes || 0}
          </button>
        </div>

        <div className="card-actions">
          <button
            className={`status-button${isCompleted ? ' completed-status' : ''}`}
            onClick={() => onToggleStatus(item.id)}
            title={isCompleted ? 'Сделать активным' : 'Завершить'}
          >
            {isCompleted ? '↩️' : '✓'}
          </button>
          <button
            className="edit-button"
            onClick={() => onEdit(item)}
            title="Редактировать"
          >
            ✏️
          </button>
          <button
            className="delete-button"
            onClick={() => onDelete(item.id)}
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

export default Card;