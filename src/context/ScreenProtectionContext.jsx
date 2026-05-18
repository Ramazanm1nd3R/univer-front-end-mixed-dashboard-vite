/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { useScreenProtection } from '../hooks/useScreenProtection';

const ScreenProtectionContext = createContext(null);

export function ScreenProtectionProvider({ children }) {
  const protection = useScreenProtection();

  const value = useMemo(() => protection, [protection]);

  return (
    <ScreenProtectionContext.Provider value={value}>
      {children}
    </ScreenProtectionContext.Provider>
  );
}

export function useScreenProtectionContext() {
  const ctx = useContext(ScreenProtectionContext);
  if (!ctx) {
    throw new Error('useScreenProtectionContext must be used within ScreenProtectionProvider');
  }
  return ctx;
}

export default ScreenProtectionContext;
