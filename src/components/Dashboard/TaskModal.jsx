import React from 'react';

function TaskModal({ task, onClose, onToggle, onDelete }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Не указан';
    }
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Детали задачи</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="task-detail-section">
            <h3>Описание</h3>
            <p className="task-detail-text">{task.text}</p>
          </div>

          <div className="task-detail-grid">
            <div className="task-detail-item">
              <label>Статус</label>
              <span className={`status-badge ${task.status}`}>
                {task.status === 'completed' ? '✓ Завершено' : '○ Активно'}
              </span>
            </div>

            <div className="task-detail-item">
              <label>Приоритет</label>
              <span style={{ color: getPriorityColor(task.priority) }}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>

            {task.category && (
              <div className="task-detail-item">
                <label>Категория</label>
                <span>#{task.category}</span>
              </div>
            )}

            <div className="task-detail-item">
              <label>Создано</label>
              <span>{new Date(task.createdAt).toLocaleString('ru-RU')}</span>
            </div>

            <div className="task-detail-item">
              <label>Обновлено</label>
              <span>{new Date(task.updatedAt).toLocaleString('ru-RU')}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            onClick={() => { onToggle(task.id); onClose(); }}
            className="btn btn-primary"
          >
            {task.status === 'completed' ? 'Вернуть в активные' : 'Завершить'}
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            Удалить
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;