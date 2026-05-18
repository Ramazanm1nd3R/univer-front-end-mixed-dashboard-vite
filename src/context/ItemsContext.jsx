import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import mockApi from '../api/mockApi';
import { useFetch } from '../hooks/useFetch';
import { useNotification } from './NotificationContext';

const ItemsContext = createContext(null);

const EMPTY_DATA = {
  tasks: [],
  recipes: [],
  movies: [],
};

const INITIAL_RESPONSE = {
  success: true,
  data: EMPTY_DATA,
};

function useRequiredContext() {
  const value = useContext(ItemsContext);
  if (!value) {
    throw new Error('useItems must be used within ItemsProvider');
  }
  return value;
}

function pluralLabel(type) {
  if (type === 'tasks') return 'Task';
  if (type === 'recipes') return 'Recipe';
  return 'Movie';
}

export function ItemsProvider({ children }) {
  const { notifySuccess, notifyError } = useNotification();
  const {
    data,
    loading,
    error,
    execute: loadAll,
    setData,
  } = useFetch(mockApi.getAllData, {
    initialData: INITIAL_RESPONSE,
  });

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const collections = data?.data || EMPTY_DATA;

  const commitStore = useCallback((nextStore) => {
    setData({ success: true, data: nextStore });
  }, [setData]);

  const refresh = useCallback(async () => {
    const result = await loadAll();
    return result?.data || EMPTY_DATA;
  }, [loadAll]);

  const createItem = useCallback(async (type, payload) => {
    try {
      const result = await mockApi.createItem(type, payload);
      if (!result.success) {
        notifyError(result.error || 'Failed to create item');
        return false;
      }

      commitStore(result.data || collections);
      notifySuccess(`${pluralLabel(type)} created`);
      return result.item;
    } catch (err) {
      notifyError(err.message || 'Failed to create item');
      return false;
    }
  }, [collections, commitStore, notifyError, notifySuccess]);

  const updateItem = useCallback(async (type, id, payload) => {
    try {
      const result = await mockApi.updateItem(type, id, payload);
      if (!result.success) {
        notifyError(result.error || 'Failed to update item');
        return false;
      }

      commitStore(result.data || collections);
      notifySuccess(`${pluralLabel(type)} updated`);
      return result.item;
    } catch (err) {
      notifyError(err.message || 'Failed to update item');
      return false;
    }
  }, [collections, commitStore, notifyError, notifySuccess]);

  const deleteItem = useCallback(async (type, id) => {
    try {
      const result = await mockApi.deleteItem(type, id);
      if (!result.success) {
        notifyError(result.error || 'Failed to delete item');
        return false;
      }

      commitStore(result.data || collections);
      notifySuccess(`${pluralLabel(type)} deleted`);
      return true;
    } catch (err) {
      notifyError(err.message || 'Failed to delete item');
      return false;
    }
  }, [collections, commitStore, notifyError, notifySuccess]);

  const getCollection = useCallback((type) => collections[type] || [], [collections]);

  const value = useMemo(() => ({
    tasks: collections.tasks,
    recipes: collections.recipes,
    movies: collections.movies,
    loading,
    error,
    refresh,
    createItem,
    updateItem,
    deleteItem,
    getCollection,
  }), [collections.movies, collections.recipes, collections.tasks, createItem, deleteItem, error, getCollection, loading, refresh, updateItem]);

  return (
    <ItemsContext.Provider value={value}>
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  return useRequiredContext();
}
