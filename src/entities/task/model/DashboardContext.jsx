/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@features/auth/model/AuthContext';
import api from '@shared/api/api';
import { useModal } from '@shared/lib/useModal';

// Главный стор задач. Намеренно разнесён на три контекста, а не один большой —
// иначе любое изменение фильтра тянуло бы перерисовку всей сетки карточек.
//   Data           — items + CRUD-методы (подписаны карточки и статистика)
//   UI             — фильтры, сорт, состояние модалок (подписаны фильтр-панель, кнопки)
//   Notifications  — toast'ы (подписан только Notifications viewport)
const DashboardDataContext = createContext(null);
const DashboardUIContext = createContext(null);
const DashboardNotificationsContext = createContext(null);

function useRequiredContext(context, hookName) {
  const value = useContext(context);
  if (!value) {
    throw new Error(`${hookName} must be used within DashboardProvider`);
  }
  return value;
}

// Бэкенд хранит дату и время раздельно (dueDate, dueTime), но UI работает
// с одной datetime-строкой. Склеиваем их через 'T' для ISO-совместимости.
function mapApiItem(item) {
  const normalizedDueDate = item.dueDate
    ? item.dueTime
      ? `${item.dueDate}T${item.dueTime}`
      : item.dueDate
    : '';

  return {
    id: item.id,
    title: item.text,
    description: item.text,
    category: item.category || 'other',
    status: item.status || 'active',
    priority: item.priority || 'medium',
    date: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    dueDate: normalizedDueDate,
    dueTime: item.dueTime || '',
    likes: 0, // лайки храним только локально, на бэке для них пока нет колонки
  };
}

export function DashboardProvider({ children }) {
  const { currentUser } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ category: 'all', status: 'all', search: '' });
  const [sortBy, setSortBy] = useState('date');
  const addModal = useModal(false);
  const editModal = useModal(false);
  const [editingItem, setEditingItem] = useState(null);

  // Тост-уведомления.
  // Таймеры храним в useRef, а не state, потому что:
  //   1) их изменение не должно вызывать перерисовку;
  //   2) при unmount компонента нужно гарантированно их зачистить,
  //      иначе setNotifications в setTimeout стрельнет в размонтированный дерево.
  const [notifications, setNotifications] = useState([]);
  const notificationTimeouts = useRef(new Map());

  const removeNotification = useCallback((id) => {
    const timeoutId = notificationTimeouts.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      notificationTimeouts.current.delete(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const pushNotification = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
    const timeoutId = setTimeout(() => {
      notificationTimeouts.current.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
    notificationTimeouts.current.set(id, timeoutId);
    return id;
  }, []);

  // Cleanup всех висящих таймеров при размонтировании провайдера.
  useEffect(() => {
    const timeouts = notificationTimeouts.current;
    return () => {
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, []);

  const notifySuccess = useCallback((message) => pushNotification(message, 'success'), [pushNotification]);
  const notifyError = useCallback((message) => pushNotification(message, 'error'), [pushNotification]);
  const notifyInfo = useCallback((message) => pushNotification(message, 'info'), [pushNotification]);

  // Защита от race conditions при загрузке:
  //   isMountedRef    — не пишем в state, если компонент уже размонтирован
  //   loadRequestIdRef — игнорируем ответ, если за время запроса успел стартовать новый
  // Это важно, когда пользователь быстро logout → login: старый ответ с задачами
  // прошлого пользователя не должен перетереть актуальные данные.
  const isMountedRef = useRef(true);
  const loadRequestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDashboardItems = useCallback(async () => {
    // Без пользователя нечего грузить — просто чистим стейт.
    if (!currentUser?.id) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    // Берём номер своего запроса. Если придёт более новый — этот результат игнорируется.
    const requestId = ++loadRequestIdRef.current;

    try {
      setLoading(true);
      setError(null);
      const result = await api.getDashboardItems(currentUser.id);
      if (!isMountedRef.current || requestId !== loadRequestIdRef.current) return;
      if (result.success) {
        setItems(result.items.map(mapApiItem));
      } else {
        setError(result.error || 'Ошибка загрузки данных');
        setItems([]);
      }
    } catch {
      if (!isMountedRef.current || requestId !== loadRequestIdRef.current) return;
      setError('Не удалось загрузить задачи');
      setItems([]);
    } finally {
      if (isMountedRef.current && requestId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadDashboardItems();
  }, [loadDashboardItems]);

  const addItem = useCallback(async (newItem) => {
    if (!currentUser?.id) return false;

    try {
      const result = await api.createDashboardItem(currentUser.id, {
        text: newItem.title,
        status: newItem.status || 'active',
        priority: newItem.priority || 'medium',
        category: newItem.category || 'other',
        dueDate: newItem.dueDate || null,
        dueTime: newItem.dueTime || null,
      });

      if (!result.success) {
        notifyError(`Ошибка создания: ${result.error || 'неизвестная ошибка'}`);
        return false;
      }

      await loadDashboardItems();
      notifySuccess('Задача создана');
      return true;
    } catch {
      notifyError('Не удалось создать задачу');
      return false;
    }
  }, [currentUser?.id, loadDashboardItems, notifyError, notifySuccess]);

  const updateItem = useCallback(async (updatedItem) => {
    if (!currentUser?.id || !updatedItem?.id) return false;

    try {
      const result = await api.updateDashboardItem(currentUser.id, updatedItem.id, {
        text: updatedItem.title,
        status: updatedItem.status,
        priority: updatedItem.priority,
        category: updatedItem.category,
        dueDate: updatedItem.dueDate || null,
        dueTime: updatedItem.dueTime || null,
      });

      if (!result.success) {
        notifyError(`Ошибка обновления: ${result.error || 'неизвестная ошибка'}`);
        return false;
      }

      await loadDashboardItems();
      notifySuccess('Изменения сохранены');
      return true;
    } catch {
      notifyError('Не удалось обновить задачу');
      return false;
    }
  }, [currentUser?.id, loadDashboardItems, notifyError, notifySuccess]);

  const deleteItem = useCallback(async (id) => {
    if (!currentUser?.id || !id) return false;

    try {
      const result = await api.deleteDashboardItem(currentUser.id, id);
      if (!result.success) {
        notifyError(`Ошибка удаления: ${result.error || 'неизвестная ошибка'}`);
        return false;
      }

      await loadDashboardItems();
      notifySuccess('Задача удалена');
      return true;
    } catch {
      notifyError('Не удалось удалить задачу');
      return false;
    }
  }, [currentUser?.id, loadDashboardItems, notifyError, notifySuccess]);

  const toggleStatus = useCallback(async (id) => {
    if (!currentUser?.id || !id) return false;

    const item = items.find((i) => i.id === id);
    if (!item) return false;

    const newStatus = item.status === 'active' ? 'completed' : 'active';

    try {
      const result = await api.updateDashboardItem(currentUser.id, id, {
        text: item.title,
        status: newStatus,
        priority: item.priority,
        category: item.category,
        dueDate: item.dueDate ? item.dueDate.split('T')[0] : null,
        dueTime: item.dueTime || null,
      });

      if (!result.success) {
        notifyError(`Ошибка обновления: ${result.error || 'неизвестная ошибка'}`);
        return false;
      }

      await loadDashboardItems();
      return true;
    } catch {
      notifyError('Не удалось изменить статус');
      return false;
    }
  }, [currentUser?.id, items, loadDashboardItems, notifyError]);

  // Лайки только на фронте — на бэке такой колонки нет.
  // Поэтому никакого API-вызова, просто обновляем локальный state.
  const toggleLike = useCallback((id) => {
    setItems((prev) => prev.map((item) => (
      item.id === id ? { ...item, likes: (item.likes || 0) + 1 } : item
    )));
  }, []);

  const openAddModal = useCallback(() => addModal.open(), [addModal]);
  const closeAddModal = useCallback(() => addModal.close(), [addModal]);

  const openEditModal = useCallback((item) => {
    setEditingItem(item);
    editModal.open();
  }, [editModal]);

  const closeEditModal = useCallback(() => {
    editModal.close();
    setEditingItem(null);
  }, [editModal]);

  const resetFilters = useCallback(() => {
    setFilters({ category: 'all', status: 'all', search: '' });
  }, []);

  const dataValue = useMemo(() => ({
    items,
    loading,
    error,
    loadDashboardItems,
    addItem,
    updateItem,
    deleteItem,
    toggleStatus,
    toggleLike,
  }), [items, loading, error, loadDashboardItems, addItem, updateItem, deleteItem, toggleStatus, toggleLike]);

  const uiValue = useMemo(() => ({
    filters,
    sortBy,
    isAddModalOpen: addModal.isOpen,
    isEditModalOpen: editModal.isOpen,
    editingItem,
    setFilters,
    setSortBy,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    resetFilters,
  }), [
    filters,
    sortBy,
    addModal.isOpen,
    editModal.isOpen,
    editingItem,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    resetFilters,
  ]);

  const notificationsValue = useMemo(() => ({
    notifications,
    removeNotification,
    notifySuccess,
    notifyError,
    notifyInfo,
  }), [notifications, removeNotification, notifySuccess, notifyError, notifyInfo]);

  return (
    <DashboardNotificationsContext.Provider value={notificationsValue}>
      <DashboardDataContext.Provider value={dataValue}>
        <DashboardUIContext.Provider value={uiValue}>
          {children}
        </DashboardUIContext.Provider>
      </DashboardDataContext.Provider>
    </DashboardNotificationsContext.Provider>
  );
}

export function useDashboardData() {
  return useRequiredContext(DashboardDataContext, 'useDashboardData');
}

export function useDashboardUI() {
  return useRequiredContext(DashboardUIContext, 'useDashboardUI');
}

export function useDashboardNotifications() {
  return useRequiredContext(DashboardNotificationsContext, 'useDashboardNotifications');
}

// "Жирный" хук — даёт сразу всё. Удобен для компонентов вроде Dashboard,
// которые правда трогают и data, и UI, и уведомления одновременно.
// В остальных местах лучше брать узкий useDashboardData/UI/Notifications —
// меньше подписок = меньше лишних перерисовок.
export function useDashboard() {
  const data = useDashboardData();
  const ui = useDashboardUI();
  const notifications = useDashboardNotifications();

  return useMemo(() => ({
    ...data,
    ...ui,
    ...notifications,
  }), [data, ui, notifications]);
}
