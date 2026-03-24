/* eslint-env vitest */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TaskCollection from '../TaskCollection';

describe('TaskCollection', () => {
  const items = [
    { id: 1, title: 'Bravo task', category: 'work', status: 'active', priority: 'high', tags: [], date: '2026-03-18T10:00:00.000Z' },
    { id: 2, title: 'Alpha task', category: 'personal', status: 'completed', priority: 'medium', tags: [], date: '2026-03-17T10:00:00.000Z' },
    { id: 3, title: 'Charlie task', category: 'work', status: 'active', priority: 'low', tags: [], date: '2026-03-16T10:00:00.000Z' },
  ];

  it('calls render function with filtered and sorted data', async () => {
    const renderSpy = vi.fn();

    render(
      <TaskCollection items={items}>
        {(state) => {
          renderSpy(state);

          return (
            <>
              <button onClick={() => state.updateFilter('category', 'work')}>Filter work</button>
              <button onClick={() => state.setSortBy('title')}>Sort title</button>
              <div data-testid="titles">{state.items.map((item) => item.title).join(', ')}</div>
              <div data-testid="counts">{state.filteredCount}/{state.totalCount}</div>
            </>
          );
        }}
      </TaskCollection>,
    );

    expect(screen.getByTestId('titles')).toHaveTextContent('Bravo task, Alpha task, Charlie task');
    expect(renderSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Filter work'));

    await waitFor(() => {
      expect(screen.getByTestId('titles')).toHaveTextContent('Bravo task, Charlie task');
    });

    fireEvent.click(screen.getByText('Sort title'));

    await waitFor(() => {
      expect(screen.getByTestId('titles')).toHaveTextContent('Bravo task, Charlie task');
      expect(screen.getByTestId('counts')).toHaveTextContent('2/3');
    });

    const latestCall = renderSpy.mock.calls.at(-1)[0];
    expect(latestCall.filters.category).toBe('work');
    expect(latestCall.sortBy).toBe('title');
    expect(latestCall.filteredCount).toBe(2);
  });
});
