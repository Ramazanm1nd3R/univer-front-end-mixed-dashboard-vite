import React from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '../../context/NotificationContext';
import styles from '../../styles/mixedDashboard.module.css';

const ICON_BY_TYPE = {
  success: '✓',
  error: '!',
  info: 'i',
};

function ToastViewport() {
  const { toasts, dismiss } = useNotification();

  if (!toasts.length) {
    return null;
  }

  return createPortal(
    <div className={styles.toastViewport} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[`toast${toast.type[0].toUpperCase()}${toast.type.slice(1)}`]}`}>
          <div className={styles.toastIcon}>{ICON_BY_TYPE[toast.type] || 'i'}</div>
          <div className={styles.toastContent}>
            {toast.title ? <strong className={styles.toastTitle}>{toast.title}</strong> : null}
            <p className={styles.toastMessage}>{toast.message}</p>
          </div>
          <button type="button" className={styles.toastDismiss} onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export default ToastViewport;

