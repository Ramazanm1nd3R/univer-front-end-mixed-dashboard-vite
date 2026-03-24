import React, { memo, useCallback, useMemo, useState } from 'react';
import { useFilter } from '../../hooks/useFilter';

const DEFAULT_FILTERS = {
  category: 'all',
  status: 'all',
  search: '',
  tags: [],
};

function TaskCollection({
  items,
  initialFilters = DEFAULT_FILTERS,
  initialSortBy = 'date',
  children,
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState(initialSortBy);

  const filteredItems = useFilter(items, filters, sortBy);

  const updateFilter = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSortBy(initialSortBy);
  }, [initialFilters, initialSortBy]);

  const hasActiveFilters = Boolean(
    filters.category !== initialFilters.category
      || filters.status !== initialFilters.status
      || filters.search !== initialFilters.search
      || sortBy !== initialSortBy
      || (filters.tags?.length || 0) > (initialFilters.tags?.length || 0),
  );

  const renderState = useMemo(() => ({
    items: filteredItems,
    sourceItems: items,
    filters,
    sortBy,
    setFilters,
    setSortBy,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    totalCount: items.length,
    filteredCount: filteredItems.length,
  }), [
    filteredItems,
    items,
    filters,
    sortBy,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  ]);

  if (typeof children !== 'function') {
    throw new Error('TaskCollection expects a render function as children');
  }

  return children(renderState);
}

export default memo(TaskCollection);
