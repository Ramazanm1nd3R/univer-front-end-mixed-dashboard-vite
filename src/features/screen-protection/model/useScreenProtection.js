import { useCallback, useState } from 'react';

const DEFAULT_REASON = 'Содержимое скрыто пользователем.';

// Состояние защиты экрана. Храним reason как строку, а не отдельный bool —
// один источник правды: пустая строка ⇒ выключено, заполнена ⇒ включено.
// Это помогает не рассинхронизировать isActive и reason.
export function useScreenProtection() {
  const [protectionReason, setProtectionReason] = useState('');

  const activate = useCallback((reason = DEFAULT_REASON) => {
    setProtectionReason(reason);
  }, []);

  const deactivate = useCallback(() => {
    setProtectionReason('');
  }, []);

  const toggle = useCallback((reason = DEFAULT_REASON) => {
    setProtectionReason((prev) => (prev ? '' : reason));
  }, []);

  return {
    isProtectionActive: Boolean(protectionReason),
    protectionReason,
    activate,
    deactivate,
    toggle,
  };
}

export default useScreenProtection;
