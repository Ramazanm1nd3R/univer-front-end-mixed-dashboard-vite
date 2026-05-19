import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@shared/styles/mixedDashboard.module.css';

function Modal({ isOpen, onClose, title, children, footer = null }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div className={styles.modalPanel} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.sectionLead}>Mixed Dashboard</p>
            <h3 className={styles.sectionTitle}>{title}</h3>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>{children}</div>

        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;

