import { useCallback, useState } from 'react';

const DEFAULT_REASON = 'Содержимое скрыто пользователем.';

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
