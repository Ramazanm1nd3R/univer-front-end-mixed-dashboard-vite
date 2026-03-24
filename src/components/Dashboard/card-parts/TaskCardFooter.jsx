import React from 'react';
import { useTaskCard } from './taskCardContext.jsx';

function TaskCardFooter() {
  const {
    item,
    cardDate,
    isCompleted,
    handleLike,
    handleToggleStatus,
    handleEdit,
    handleDelete,
    openDetails,
  } = useTaskCard();

  return (
    <div className="card-footer">
      <div className="card-meta">
        <span className="card-date">📅 {cardDate}</span>
        <button className="like-button" onClick={handleLike}>
          ❤️ {item.likes || 0}
        </button>
      </div>

      <div className="card-actions">
        <button className="details-button" onClick={openDetails} title="Подробнее">
          ℹ️
        </button>
        <button
          className={`status-button${isCompleted ? ' completed-status' : ''}`}
          onClick={handleToggleStatus}
          title={isCompleted ? 'Сделать активным' : 'Завершить'}
        >
          {isCompleted ? '↩️' : '✓'}
        </button>
        <button className="edit-button" onClick={handleEdit} title="Редактировать">
          ✏️
        </button>
        <button className="delete-button" onClick={handleDelete} title="Удалить">
          🗑️
        </button>
      </div>
    </div>
  );
}

export default TaskCardFooter;
