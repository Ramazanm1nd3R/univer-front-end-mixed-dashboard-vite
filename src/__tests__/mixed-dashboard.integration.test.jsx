/* eslint-env vitest */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NotificationProvider } from '../context/NotificationContext';
import { ItemsProvider } from '../context/ItemsContext';
import { FilterProvider } from '../context/FilterContext';
import TasksPage from '../pages/TasksPage';
import mockApi from '../api/mockApi';

vi.mock('../api/mockApi', () => {
  const initialStore = {
    tasks: [
      {
        id: 'task-1',
        title: 'Build overview section',
        description: 'Create a clear dashboard summary with task, recipe and movie cards.',
        category: 'design',
        status: 'active',
        priority: 'high',
        dueDate: '2026-04-05',
        notes: 'Use a warm but professional visual direction.',
        createdAt: '2026-03-26T00:00:00.000Z',
        updatedAt: '2026-03-30T00:00:00.000Z',
      },
    ],
    recipes: [],
    movies: [],
  };

  let store = JSON.parse(JSON.stringify(initialStore));

  const clone = (value) => JSON.parse(JSON.stringify(value));

  return {
    default: {
      getAllData: vi.fn(async () => ({ success: true, data: clone(store) })),
      createItem: vi.fn(async (type, payload) => {
        const item = {
          id: `${type}-${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        store = {
          ...store,
          [type]: [item, ...store[type]],
        };

        return { success: true, item, data: clone(store) };
      }),
      updateItem: vi.fn(async (type, id, payload) => {
        store = {
          ...store,
          [type]: store[type].map((item) => (item.id === id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item)),
        };

        const item = store[type].find((entry) => entry.id === id);
        return item
          ? { success: true, item, data: clone(store) }
          : { success: false, error: 'Item not found' };
      }),
      deleteItem: vi.fn(async (type, id) => {
        store = {
          ...store,
          [type]: store[type].filter((item) => item.id !== id),
        };

        return { success: true, data: clone(store) };
      }),
      reset: vi.fn(() => {
        store = clone(initialStore);
        return { success: true };
      }),
    },
  };
});

describe('Mixed dashboard integration', () => {
  beforeEach(() => {
    mockApi.reset();
  });

  it('adds and removes a task through the Tasks page flow', async () => {
    render(
      <NotificationProvider>
        <ItemsProvider>
          <FilterProvider>
            <TasksPage />
          </FilterProvider>
        </ItemsProvider>
      </NotificationProvider>,
    );

    expect(await screen.findByText(/build overview section/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add task/i }));

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Plan the launch demo' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Prepare a concise walkthrough for the mixed dashboard.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(screen.getByText(/plan the launch demo/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'launch demo' },
    });

    await waitFor(() => {
      expect(screen.getByText(/plan the launch demo/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/plan the launch demo/i));
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));

    const newItemTitle = await screen.findByText(/plan the launch demo/i);
    const card = newItemTitle.closest('article');
    const deleteButton = within(card).getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText(/plan the launch demo/i)).not.toBeInTheDocument();
    });
  });
});
