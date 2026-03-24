/* eslint-env vitest */
import { renderHook } from '@testing-library/react';
import { useFilter } from '../useFilter';

describe('useFilter', () => {
  const items = [
    { id: 1, title: 'Write docs', category: 'work', status: 'active', priority: 'high', tags: ['docs'], date: '2026-03-17T10:00:00.000Z' },
    { id: 2, title: 'Gym session', category: 'health', status: 'completed', priority: 'medium', tags: ['wellness'], date: '2026-03-18T10:00:00.000Z' },
    { id: 3, title: 'Weekly review', category: 'work', status: 'active', priority: 'low', tags: ['docs', 'review'], date: '2026-03-16T10:00:00.000Z' },
  ];

  it('filters by category and status', () => {
    const { result } = renderHook(() => useFilter(items, {
      category: 'work',
      status: 'active',
      search: '',
      tags: [],
    }, 'date'));

    expect(result.current).toHaveLength(2);
    expect(result.current.every((item) => item.category === 'work')).toBe(true);
    expect(result.current.every((item) => item.status === 'active')).toBe(true);
  });

  it('filters by search and tags', () => {
    const { result } = renderHook(() => useFilter(items, {
      category: 'all',
      status: 'all',
      search: 'review',
      tags: ['review'],
    }, 'date'));

    expect(result.current).toEqual([items[2]]);
  });

  it('sorts by priority weight', () => {
    const { result } = renderHook(() => useFilter(items, {
      category: 'all',
      status: 'all',
      search: '',
      tags: [],
    }, 'priority'));

    expect(result.current.map((item) => item.priority)).toEqual(['high', 'medium', 'low']);
  });
});
