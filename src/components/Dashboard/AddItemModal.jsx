import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import '../../styles/Dashboard.css';
import { useForm } from '../../hooks/useForm';
import {
  MAX_TITLE,
  buildTaskPayload,
  categoryOptions,
  priorityConfig,
  validateControlledTaskFields,
  validateScheduleFields,
} from './taskFormConfig';

function AddItemModal({ onClose, onAdd }) {
  const initialValues = useMemo(() => ({
    title: '',
    category: 'other',
    priority: 'medium',
    status: 'active',
  }), []);
  const initialSchedule = useMemo(() => ({ dueDate: '', dueTime: '' }), []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleState, setScheduleState] = useState(initialSchedule);
  const [scheduleErrors, setScheduleErrors] = useState({});
  const [scheduleTouched, setScheduleTouched] = useState({});
  const dueDateRef = useRef(null);
  const dueTimeRef = useRef(null);

  const {
    values: formData,
    errors,
    handleChange,
    handleBlur,
    setValue,
    setErrors,
    setTouched,
    reset,
  } = useForm({
    initialValues,
    validate: validateControlledTaskFields,
  });

  const setPriority = useCallback((priority) => {
    setValue('priority', priority);
  }, [setValue]);

  const readScheduleFields = useCallback(() => ({
    dueDate: dueDateRef.current?.value || '',
    dueTime: dueTimeRef.current?.value || '',
  }), []);

  const syncScheduleState = useCallback((nextTouched = scheduleTouched) => {
    const nextSchedule = readScheduleFields();
    setScheduleState(nextSchedule);
    setScheduleErrors(validateScheduleFields(nextSchedule, nextTouched));
    return nextSchedule;
  }, [readScheduleFields, scheduleTouched]);

  const handleScheduleChange = useCallback(() => {
    syncScheduleState();
  }, [syncScheduleState]);

  const handleScheduleBlur = useCallback((field) => {
    setScheduleTouched((prev) => {
      const nextTouched = { ...prev, [field]: true };
      syncScheduleState(nextTouched);
      return nextTouched;
    });
  }, [syncScheduleState]);

  const resetHybridForm = useCallback(() => {
    reset(initialValues);
    setScheduleTouched({});
    setScheduleErrors({});
    setScheduleState(initialSchedule);

    if (dueDateRef.current) {
      dueDateRef.current.value = initialSchedule.dueDate;
    }

    if (dueTimeRef.current) {
      dueTimeRef.current.value = initialSchedule.dueTime;
    }
  }, [initialSchedule, initialValues, reset]);

  const submitForm = useCallback(async () => {
    const submitTouched = Object.keys(initialValues).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    const nextControlledErrors = validateControlledTaskFields(formData, submitTouched);
    const submitScheduleTouched = { dueDate: true, dueTime: true };
    const nextSchedule = readScheduleFields();
    const nextScheduleErrors = validateScheduleFields(nextSchedule, submitScheduleTouched);

    setTouched(submitTouched);
    setErrors(nextControlledErrors);
    setScheduleTouched(submitScheduleTouched);
    setScheduleState(nextSchedule);
    setScheduleErrors(nextScheduleErrors);

    if (Object.keys(nextControlledErrors).length > 0 || Object.keys(nextScheduleErrors).length > 0) {
      return false;
    }

    setIsSubmitting(true);
    const success = await onAdd(buildTaskPayload(formData, nextSchedule));
    setIsSubmitting(false);

    if (success) {
      resetHybridForm();
      onClose();
    }

    return success;
  }, [formData, initialValues, onAdd, onClose, readScheduleFields, resetHybridForm, setErrors, setTouched]);

  const categoryLabel = categoryOptions.find((c) => c.value === formData.category)?.label || '📌 Другое';
  const titleLen = formData.title.length;
  const titleNear = titleLen > MAX_TITLE * 0.8;
  const mergedErrors = { ...errors, ...scheduleErrors };

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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitForm();
            }}
            className="modal-form"
          >
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
                  ref={dueDateRef}
                  defaultValue={initialSchedule.dueDate}
                  onChange={handleScheduleChange}
                  onBlur={() => handleScheduleBlur('dueDate')}
                  className={`form-input ${mergedErrors.dueDate ? 'input-error' : ''}`}
                />
                {mergedErrors.dueDate && <span className="form-error">⚠ {mergedErrors.dueDate}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="add-dueTime" className="form-label">⏰ Срок — время</label>
                <input
                  type="time"
                  id="add-dueTime"
                  ref={dueTimeRef}
                  defaultValue={initialSchedule.dueTime}
                  onChange={handleScheduleChange}
                  onBlur={() => handleScheduleBlur('dueTime')}
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
                  {(scheduleState.dueDate || scheduleState.dueTime) && (
                    <div className="preview-card-due">
                      📅 {scheduleState.dueDate}{scheduleState.dueTime ? ` · ⏰ ${scheduleState.dueTime}` : ''}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={resetHybridForm} disabled={isSubmitting}>Очистить</button>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Отмена</button>
          <button type="button" className="btn-primary" onClick={submitForm} disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : '✨ Создать задачу'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(AddItemModal);
