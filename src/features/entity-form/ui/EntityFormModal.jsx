import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@shared/lib/useForm';
import Modal from '@shared/ui/Modal';
import styles from '@shared/styles/mixedDashboard.module.css';

function getFormValues(config, item) {
  return config.fields.reduce((acc, field) => {
    if (field.type === 'number') {
      acc[field.name] = item?.[field.name] ?? config.initialValues[field.name] ?? 0;
      return acc;
    }

    acc[field.name] = item?.[field.name] ?? config.initialValues[field.name] ?? '';
    return acc;
  }, {});
}

function EntityFormModal({ isOpen, mode, entityConfig, item, onClose, onSubmit }) {
  const notesRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = useMemo(() => getFormValues(entityConfig, item), [entityConfig, item]);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setTouched,
    setErrors,
    reset,
  } = useForm({
    initialValues,
    validate: entityConfig.validate,
  });

  useEffect(() => {
    if (notesRef.current) {
      notesRef.current.value = entityConfig.getInitialRefValue(item);
    }
  }, [entityConfig, item, isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const submitTouched = entityConfig.fields.reduce((acc, field) => {
      acc[field.name] = true;
      return acc;
    }, {});

    const nextErrors = entityConfig.validate(values, submitTouched);
    setTouched(submitTouched);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    const payload = entityConfig.buildPayload(values, notesRef.current?.value || '');
    const result = await onSubmit(payload);
    setIsSubmitting(false);

    if (result !== false) {
      reset(initialValues);
      onClose();
    }
  };

  const footer = (
    <>
      <button type="button" className={styles.ghostButton} onClick={onClose} disabled={isSubmitting}>
        Cancel
      </button>
      <button type="submit" className={styles.primaryButton} form={`entity-form-${entityConfig.label}`} disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : mode === 'edit' ? `Update ${entityConfig.singularLabel}` : `Create ${entityConfig.singularLabel}`}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? `Edit ${entityConfig.singularLabel}` : `Create ${entityConfig.singularLabel}`}
      footer={footer}
    >
      <form id={`entity-form-${entityConfig.label}`} className={styles.formGrid} onSubmit={handleSubmit}>
        {entityConfig.fields.map((field) => (
          <label key={field.name} className={styles.field}>
            <span className={styles.fieldLabel}>{field.label}</span>
            {field.type === 'textarea' ? (
              <textarea
                name={field.name}
                value={values[field.name]}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.textarea} ${errors[field.name] ? styles.fieldError : ''}`.trim()}
                placeholder={field.placeholder}
              />
            ) : field.type === 'select' ? (
              <select
                name={field.name}
                value={values[field.name]}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.select} ${errors[field.name] ? styles.fieldError : ''}`.trim()}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                value={values[field.name]}
                min={field.min}
                max={field.max}
                step={field.step}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={field.placeholder}
                className={`${styles.input} ${errors[field.name] ? styles.fieldError : ''}`.trim()}
              />
            )}
            {touched[field.name] && errors[field.name] ? <span className={styles.fieldErrorText}>{errors[field.name]}</span> : null}
          </label>
        ))}

        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>{entityConfig.refField.label}</span>
          <textarea
            ref={notesRef}
            defaultValue={entityConfig.getInitialRefValue(item)}
            className={styles.textarea}
            placeholder={entityConfig.refField.placeholder}
          />
        </label>
      </form>
    </Modal>
  );
}

export default EntityFormModal;

