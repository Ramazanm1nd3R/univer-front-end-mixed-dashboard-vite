import { useMemo } from 'react';

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

export function useFilter(items, filters, sortBy = 'date') {
  return useMemo(() => {
    let result = [...items];

    if (filters.category && filters.category !== 'all') {
      result = result.filter((item) => item.category === filters.category);
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((item) => item.status === filters.status);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter((item) => item.title.toLowerCase().includes(query));
    }

    if (Array.isArray(filters.tags) && filters.tags.length > 0) {
      result = result.filter((item) => {
        const itemTags = Array.isArray(item.tags) ? item.tags : [];
        return filters.tags.every((tag) => itemTags.includes(tag));
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'priority') {
        return (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
      }
      return 0;
    });

    return result;
  }, [filters, items, sortBy]);
}

export default useFilter;
