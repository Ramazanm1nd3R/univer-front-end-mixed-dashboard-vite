import React from 'react';
import { useScreenProtectionContext } from '@features/screen-protection/model/ScreenProtectionContext';
import styles from './ScreenshotGuard.module.css';

function ScreenshotGuard({ children }) {
  const { isProtectionActive, protectionReason, deactivate } = useScreenProtectionContext();

  return (
    <div className={`${styles.root} ${isProtectionActive ? styles.protected : ''}`}>
      <div className={styles.content} aria-hidden={isProtectionActive}>
        {children}
      </div>

      {isProtectionActive && (
        <div className={styles.lockOverlay} role="alert" aria-live="assertive">
          <div className={styles.lockCard}>
            <span className={styles.lockBadge}>Screen Protected</span>
            <h2 className={styles.lockTitle}>Содержимое скрыто</h2>
            <p className={styles.lockText}>
              {protectionReason || 'Контент временно скрыт из соображений безопасности.'}
            </p>
            <button type="button" className={styles.unlockButton} onClick={deactivate}>
              Показать содержимое
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScreenshotGuard;
