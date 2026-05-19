import React from 'react';
import { useScreenProtectionContext } from '@features/screen-protection/model/ScreenProtectionContext';
import styles from './ScreenshotButton.module.css';

function ScreenshotButton() {
  const { isProtectionActive, activate } = useScreenProtectionContext();

  const handleClick = () => {
    activate('Содержимое скрыто. Снимки экрана ограничены политикой безопасности.');
  };

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={isProtectionActive}
      title="Скрыть содержимое от скриншота"
    >
      {isProtectionActive ? '🔒 Защита активна' : '🛡 Скрыть экран'}
    </button>
  );
}

export default ScreenshotButton;
