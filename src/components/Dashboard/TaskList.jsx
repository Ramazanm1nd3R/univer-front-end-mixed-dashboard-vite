import React, { memo, useState } from 'react';

function TaskList({ items, onToggle, onDelete, onEdit, onDetails }) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editCategory, setEditCategory] = useState('');

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditPriority(item.priority || 'medium');
    setEditCategory(item.category || '');
  };

  const saveEdit = (id) => {
    if (editText.trim()) {
      onEdit(id, editText, editPriority, editCategory || null);
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditPriority('medium');
    setEditCategory('');
  };

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
      default: return '';
    }
  };

  if (items.length === 0) {
    return (
      <div className="card empty-state">
        <p>📭 Нет задач</p>
        <p className="empty-subtitle">Добавьте первую задачу чтобы начать</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {items.map(item => (
        <div key={item.id} className={`task-item ${item.status}`}>
          <div className="task-checkbox">
            <input
              type="checkbox"
              checked={item.status === 'completed'}
              onChange={() => onToggle(item.id)}
            />
          </div>

          <div className="task-content" onClick={() => onDetails(item)}>
            {editingId === item.id ? (
              <div className="task-edit-form" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                  className="task-edit-input"
                />
                <div className="task-edit-options">
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Категория"
                    className="task-edit-category"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="task-text">{item.text}</div>
                <div className="task-meta">
                  {item.priority && (
                    <span 
                      className="task-priority" 
                      style={{ color: getPriorityColor(item.priority) }}
                    >
                      {getPriorityLabel(item.priority)}
                    </span>
                  )}
                  {item.category && (
                    <span className="task-category">#{item.category}</span>
                  )}
                  <span className="task-date">
                    {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="task-actions">
            {editingId === item.id ? (
              <>
                <button onClick={() => saveEdit(item.id)} className="task-btn save">
                  ✓
                </button>
                <button onClick={cancelEdit} className="task-btn cancel">
                  ✕
                </button>
              </>
            ) : (
              <>
                <button onClick={() => startEdit(item)} className="task-btn edit">
                  ✏️
                </button>
                <button onClick={() => onDelete(item.id)} className="task-btn delete">
                  🗑️
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(TaskList);
