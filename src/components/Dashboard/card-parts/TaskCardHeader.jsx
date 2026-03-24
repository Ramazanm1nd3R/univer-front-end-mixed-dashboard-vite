import React from 'react';
import { useTaskCard } from './taskCardContext.jsx';

const CATEGORY_CONFIG = {
  work: { emoji: '💼', label: 'Работа' },
  personal: { emoji: '👤', label: 'Личное' },
  health: { emoji: '💪', label: 'Здоровье' },
  other: { emoji: '📌', label: 'Другое' },
};

const PRIORITY_LABELS = {
  high: '🔴 Высокий',
  medium: '🟡 Средний',
  low: '🟢 Низкий',
};

function TaskCardHeader() {
  const { item } = useTaskCard();
  const category = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;

  return (
    <div className="card-header">
      <span className="card-category">
        <span className="category-emoji">{category.emoji}</span>
        <span className="category-name">{category.label}</span>
      </span>
      <span className={`priority-badge priority-${item.priority || 'medium'}`}>
        {PRIORITY_LABELS[item.priority] || PRIORITY_LABELS.medium}
      </span>
    </div>
  );
}

export default TaskCardHeader;
