import React, { useState } from 'react';

function TaskForm({ onAdd }) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    onAdd(text, priority, category || null);
    setText('');
    setPriority('medium');
    setCategory('');
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="task-form-main">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Добавить новую задачу..."
          className="task-input"
        />
        <button type="submit" className="btn btn-primary">
          Добавить
        </button>
      </div>
      
      <div className="task-form-options">
        <div className="form-field-inline">
          <label>Приоритет:</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>

        <div className="form-field-inline">
          <label>Категория:</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Опционально"
            className="category-input"
          />
        </div>
      </div>
    </form>
  );
}

export default TaskForm;