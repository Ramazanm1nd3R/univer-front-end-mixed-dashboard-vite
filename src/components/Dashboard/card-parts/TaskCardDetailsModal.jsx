import React from 'react';
import { useTaskCard } from './taskCardContext.jsx';

function TaskCardDetailsModal() {
  const {
    item,
    formattedDue,
    isCompleted,
    isOverdue,
    closeDetails,
    handleToggleStatus,
    handleEdit,
  } = useTaskCard();

  return (
    <div className="modal-overlay" onClick={closeDetails}>
      <div className="modal-content modal-modern" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header-modern">
          <div className="modal-header-text">
            <h2>{item.title}</h2>
            <p>Детали задачи и быстрые действия</p>
          </div>
          <button className="modal-close-btn" onClick={closeDetails} title="Закрыть">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="task-preview">
            <div className="preview-label">Сводка</div>
            <div className="preview-card">
              <div className="preview-card-top">
                <span className={`preview-priority-badge priority-badge-${item.priority || 'medium'}`}>
                  {item.priority || 'medium'}
                </span>
                <span className="preview-category-badge">{item.category || 'other'}</span>
                {isCompleted && <span className="preview-status-badge">✅ Завершена</span>}
                {isOverdue && !isCompleted && <span className="preview-status-badge">⚠️ Просрочена</span>}
              </div>
              <div className="preview-card-title">{item.title}</div>
              <div className="card-description">{item.description || 'Описание отсутствует'}</div>
              {formattedDue && <div className="preview-card-due">📅 {formattedDue}</div>}
              <div className="preview-card-due">❤️ Лайков: {item.likes || 0}</div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={closeDetails}>
            Закрыть
          </button>
          <button type="button" className="btn-secondary" onClick={handleEdit}>
            Редактировать
          </button>
          <button type="button" className="btn-primary btn-edit" onClick={handleToggleStatus}>
            {isCompleted ? 'Вернуть в активные' : 'Отметить выполненной'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskCardDetailsModal;
