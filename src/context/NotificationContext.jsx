import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const NotificationContext = createContext(null);

function useRequiredContext() {
  const value = useContext(NotificationContext);
  if (!value) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return value;
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast = {
      id,
      type: 'info',
      title: '',
      message: '',
      ...toast,
    };

    setToasts((prev) => [...prev, nextToast]);

    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
      timersRef.current.delete(id);
    }, nextToast.duration || 3500);

    timersRef.current.set(id, timer);
    return id;
  }, []);

  const notifySuccess = useCallback((message, title = 'Success') => pushToast({ type: 'success', title, message }), [pushToast]);
  const notifyError = useCallback((message, title = 'Error') => pushToast({ type: 'error', title, message, duration: 5000 }), [pushToast]);
  const notifyInfo = useCallback((message, title = 'Info') => pushToast({ type: 'info', title, message }), [pushToast]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const value = useMemo(() => ({
    toasts,
    pushToast,
    notifySuccess,
    notifyError,
    notifyInfo,
    dismiss,
  }), [dismiss, notifyError, notifyInfo, notifySuccess, pushToast, toasts]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useRequiredContext();
}

