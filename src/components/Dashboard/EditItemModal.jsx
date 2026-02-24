import React, { useState } from 'react';
import '../../styles/Dashboard.css';

function EditItemModal({ item, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    category: item?.category || 'other',
    priority: item?.priority || 'medium',
    status: item?.status || 'active',
    dueDate: item?.dueDate ? item.dueDate.split('T')[0] : '',
    dueTime: item?.dueDate ? item.dueDate.split('T')[1]?.slice(0, 5) : '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const MAX_TITLE = 100;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (submitted && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const setPriority = (p) => setFormData(prev => ({ ...prev, priority: p }));

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Введите название задачи';
    else if (formData.title.trim().length > MAX_TITLE) newErrors.title = `Максимум ${MAX_TITLE} символов`;
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onUpdate({ ...item, ...formData });
    onClose();
  };

  const priorityConfig = {
    low:    { label: '🟢 Низкий',  color: '#22c55e' },
    medium: { label: '🟡 Средний', color: '#f59e0b' },
    high:   { label: '🔴 Высокий', color: '#ef4444' },
  };

  const categoryOptions = [
    { value: 'work',     label: '💼 Работа' },
    { value: 'personal', label: '👤 Личное' },
    { value: 'health',   label: '💪 Здоровье' },
    { value: 'other',    label: '📌 Другое' },
  ];

  const categoryLabel = categoryOptions.find(c => c.value === formData.category)?.label || '📌 Другое';
  const titleLen = formData.title.length;
  const titleNear = titleLen > MAX_TITLE * 0.8;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-modern" onClick={(e) => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className="modal-header-modern modal-header-edit">
          <div className="modal-header-text">
            <h2>✏️ Редактировать задачу</h2>
            <p>Измените детали задачи</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Закрыть">✕</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="modal-form">

            {/* Название */}
            <div className="form-group">
              <label htmlFor="edit-title" className="form-label">
                Название задачи <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Название задачи"
                autoFocus
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                maxLength={MAX_TITLE + 10}
              />
              <div className="form-meta">
                {errors.title
                  ? <span className="form-error">⚠ {errors.title}</span>
                  : <span className="form-hint">Кратко опишите задачу</span>
                }
                <span className={`char-counter ${titleNear ? 'near-limit' : ''}`}>
                  {titleLen}/{MAX_TITLE}
                </span>
              </div>
            </div>

            {/* Приоритет */}
            <div className="form-group">
              <label className="form-label">Приоритет</label>
              <div className="priority-selector">
                {Object.entries(priorityConfig).map(([val, cfg]) => (
                  <button
                    key={val}
                    type="button"
                    className={`priority-option priority-${val} ${formData.priority === val ? `selected-${val}` : ''}`}
                    onClick={() => setPriority(val)}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Категория + Статус */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-category" className="form-label">Категория</label>
                <select
                  id="edit-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-select"
                >
                  {categoryOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-status" className="form-label">Статус</label>
                <select
                  id="edit-status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="active">⏳ Активная</option>
                  <option value="completed">✅ Завершённая</option>
                </select>
              </div>
            </div>

            {/* Дата + Время */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-dueDate" className="form-label">📅 Срок — дата</label>
                <input
                  type="date"
                  id="edit-dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-dueTime" className="form-label">⏰ Срок — время</label>
                <input
                  type="time"
                  id="edit-dueTime"
                  name="dueTime"
                  value={formData.dueTime}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Превью */}
            {formData.title.trim() && (
              <div className="task-preview">
                <div className="preview-label">👁 Превью задачи</div>
                <div className="preview-card">
                  <div className="preview-card-top">
                    <span className={`preview-priority-badge priority-badge-${formData.priority}`}>
                      {priorityConfig[formData.priority]?.label}
                    </span>
                    <span className="preview-category-badge">{categoryLabel}</span>
                    {formData.status === 'completed' && (
                      <span className="preview-status-badge">✅ Завершена</span>
                    )}
                  </div>
                  <div className="preview-card-title">{formData.title}</div>
                  {(formData.dueDate || formData.dueTime) && (
                    <div className="preview-card-due">
                      📅 {formData.dueDate}{formData.dueTime ? ` · ⏰ ${formData.dueTime}` : ''}
                    </div>
                  )}
                </div>
              </div>
            )}

          </form>
        </div>

        {/* ── FOOTER ── */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn-primary btn-edit" onClick={handleSubmit}>
            ✔ Сохранить изменения
          </button>
        </div>

      </div>
    </div>
  );
}

export default EditItemModal;
