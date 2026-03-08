import React, { memo, useCallback, useMemo, useState } from 'react';
import '../../styles/Dashboard.css';

const MAX_TITLE = 100;

function AddItemModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'other',
    priority: 'medium',
    status: 'active',
    dueDate: '',
    dueTime: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((name, value, nextFormData) => {
    if (name === 'title') {
      const title = value.trim();
      if (!title) return 'Введите название задачи';
      if (title.length > MAX_TITLE) return `Максимум ${MAX_TITLE} символов`;
      return '';
    }

    if ((name === 'dueDate' || name === 'dueTime') && nextFormData.dueTime && !nextFormData.dueDate) {
      return 'Укажите дату, если задано время';
    }

    return '';
  }, []);

  const validateAll = useCallback((data) => {
    const nextErrors = {};
    const titleError = validateField('title', data.title, data);
    if (titleError) nextErrors.title = titleError;

    const dueDateError = validateField('dueDate', data.dueDate, data);
    if (dueDateError) nextErrors.dueDate = dueDateError;

    return nextErrors;
  }, [validateField]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const nextFormData = { ...prev, [name]: nextValue };

      if (touched[name]) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: validateField(name, nextValue, nextFormData),
        }));
      }

      if (name === 'dueDate' || name === 'dueTime') {
        const dueDateError = validateField('dueDate', nextFormData.dueDate, nextFormData);
        setErrors((prevErrors) => ({ ...prevErrors, dueDate: dueDateError }));
      }

      return nextFormData;
    });
  }, [touched, validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, formData),
    }));
  }, [formData, validateField]);

  const setPriority = useCallback((priority) => {
    setFormData((prev) => ({ ...prev, priority }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const nextErrors = validateAll(formData);
    setTouched({ title: true, dueDate: true, dueTime: true });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    const success = await onAdd(formData);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  }, [formData, onAdd, onClose, validateAll]);

  const priorityConfig = useMemo(() => ({
    low: { label: '🟢 Низкий' },
    medium: { label: '🟡 Средний' },
    high: { label: '🔴 Высокий' },
  }), []);

  const categoryOptions = useMemo(() => ([
    { value: 'work', label: '💼 Работа' },
    { value: 'personal', label: '👤 Личное' },
    { value: 'health', label: '💪 Здоровье' },
    { value: 'other', label: '📌 Другое' },
  ]), []);

  const categoryLabel = categoryOptions.find((c) => c.value === formData.category)?.label || '📌 Другое';
  const titleLen = formData.title.length;
  const titleNear = titleLen > MAX_TITLE * 0.8;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-modern" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-modern">
          <div className="modal-header-text">
            <h2>✨ Новая задача</h2>
            <p>Заполните детали для создания задачи</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Закрыть" disabled={isSubmitting}>✕</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="add-title" className="form-label">
                Название задачи <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                id="add-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Что нужно сделать?"
                autoFocus
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                maxLength={MAX_TITLE + 10}
              />
              <div className="form-meta">
                {errors.title
                  ? <span className="form-error">⚠ {errors.title}</span>
                  : <span className="form-hint">Кратко опишите задачу</span>}
                <span className={`char-counter ${titleNear ? 'near-limit' : ''}`}>
                  {titleLen}/{MAX_TITLE}
                </span>
              </div>
            </div>

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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="add-category" className="form-label">Категория</label>
                <select id="add-category" name="category" value={formData.category} onChange={handleChange} className="form-select">
                  {categoryOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="add-status" className="form-label">Статус</label>
                <select id="add-status" name="status" value={formData.status} onChange={handleChange} className="form-select">
                  <option value="active">⏳ Активная</option>
                  <option value="completed">✅ Завершённая</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="add-dueDate" className="form-label">📅 Срок — дата</label>
                <input
                  type="date"
                  id="add-dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.dueDate ? 'input-error' : ''}`}
                />
                {errors.dueDate && <span className="form-error">⚠ {errors.dueDate}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="add-dueTime" className="form-label">⏰ Срок — время</label>
                <input
                  type="time"
                  id="add-dueTime"
                  name="dueTime"
                  value={formData.dueTime}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-input"
                />
              </div>
            </div>

            {formData.title.trim() && (
              <div className="task-preview">
                <div className="preview-label">👁 Превью задачи</div>
                <div className="preview-card">
                  <div className="preview-card-top">
                    <span className={`preview-priority-badge priority-badge-${formData.priority}`}>
                      {priorityConfig[formData.priority]?.label}
                    </span>
                    <span className="preview-category-badge">{categoryLabel}</span>
                    {formData.status === 'completed' && <span className="preview-status-badge">✅ Завершена</span>}
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

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Отмена</button>
          <button type="submit" className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : '✨ Создать задачу'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(AddItemModal);
