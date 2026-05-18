import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const FilterContext = createContext(null);

const DEFAULT_FILTERS = {
  tasks: {
    search: '',
    category: 'all',
    status: 'all',
    sortBy: 'updatedAt',
  },
  recipes: {
    search: '',
    cuisine: 'all',
    difficulty: 'all',
    status: 'all',
    sortBy: 'updatedAt',
  },
  movies: {
    search: '',
    genre: 'all',
    status: 'all',
    sortBy: 'rating',
  },
};

function cloneFilters() {
  return JSON.parse(JSON.stringify(DEFAULT_FILTERS));
}

function useRequiredContext() {
  const value = useContext(FilterContext);
  if (!value) {
    throw new Error('useFilterState must be used within FilterProvider');
  }
  return value;
}

export function FilterProvider({ children }) {
  const [filtersByType, setFiltersByType] = useState(cloneFilters);

  const updateFilters = useCallback((type, patch) => {
    setFiltersByType((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...patch,
      },
    }));
  }, []);

  const setSortBy = useCallback((type, sortBy) => {
    updateFilters(type, { sortBy });
  }, [updateFilters]);

  const resetFilters = useCallback((type) => {
    setFiltersByType((prev) => ({
      ...prev,
      [type]: cloneFilters()[type],
    }));
  }, []);

  const value = useMemo(() => ({
    filtersByType,
    updateFilters,
    setSortBy,
    resetFilters,
  }), [filtersByType, resetFilters, setSortBy, updateFilters]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterState() {
  return useRequiredContext();
}

