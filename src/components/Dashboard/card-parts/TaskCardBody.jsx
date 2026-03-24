import React from 'react';
import { useTaskCard } from './taskCardContext.jsx';

function TaskCardBody() {
  const {
    item,
    formattedDue,
    isOverdue,
    openDetails,
  } = useTaskCard();

  return (
    <div className="card-body-content">
      <button type="button" className="card-body-button" onClick={openDetails}>
        <div className="card-title">{item.title}</div>

        {item.description && item.description !== item.title && (
          <div className="card-description">{item.description}</div>
        )}

        {formattedDue && (
          <div className={`card-due-date${isOverdue ? ' overdue-text' : ''}`}>
            <span className="due-icon">{isOverdue ? '⚠️' : '📅'}</span>
            <span>{formattedDue}</span>
            {isOverdue && <span className="overdue-badge">Просрочено</span>}
          </div>
        )}

        <div className="card-hint">Нажмите, чтобы открыть детали задачи</div>
      </button>
    </div>
  );
}

export default TaskCardBody;
