/* eslint-env vitest */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { DashboardProvider } from '../../../context/DashboardContext';
import { AuthProvider } from '../../../context/AuthContext';
import api from '../../../services/api';

vi.mock('../../../services/api', () => ({
  default: {
    getDashboardItems: vi.fn(),
    createDashboardItem: vi.fn(),
    updateDashboardItem: vi.fn(),
    deleteDashboardItem: vi.fn(),
  },
}));

function toApiItem(item) {
  return {
    id: item.id,
    text: item.text,
    status: item.status,
    priority: item.priority,
    category: item.category,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    dueDate: item.dueDate || null,
    dueTime: item.dueTime || null,
  };
}

describe('Dashboard integration', () => {
  let store;
  let storage;

  beforeEach(() => {
    storage = {
      currentSession: JSON.stringify({
        user: { id: 'user-1', firstName: 'Demo', lastName: 'User', email: 'demo@example.com' },
        expiresAt: '2099-03-24T12:00:00.000Z',
      }),
    };

    const localStorageMock = {
      getItem: vi.fn((key) => storage[key] ?? null),
      setItem: vi.fn((key, value) => {
        storage[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete storage[key];
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });

    storage.currentSession = JSON.stringify({
      user: { id: 'user-1', firstName: 'Demo', lastName: 'User', email: 'demo@example.com' },
      expiresAt: '2099-03-24T12:00:00.000Z',
    });

    store = [
      {
        id: 'task-1',
        text: 'Bravo task',
        status: 'active',
        priority: 'high',
        category: 'work',
        createdAt: '2026-03-18T10:00:00.000Z',
        updatedAt: '2026-03-18T10:00:00.000Z',
      },
      {
        id: 'task-2',
        text: 'Alpha task',
        status: 'completed',
        priority: 'medium',
        category: 'personal',
        createdAt: '2026-03-17T10:00:00.000Z',
        updatedAt: '2026-03-17T10:00:00.000Z',
      },
    ];

    api.getDashboardItems.mockImplementation(async () => ({
      success: true,
      items: store.map(toApiItem),
    }));

    api.createDashboardItem.mockImplementation(async (_userId, payload) => {
      const nextItem = {
        id: `task-${store.length + 1}`,
        text: payload.text,
        status: payload.status,
        priority: payload.priority,
        category: payload.category,
        dueDate: payload.dueDate,
        dueTime: payload.dueTime,
        createdAt: '2026-03-24T10:00:00.000Z',
        updatedAt: '2026-03-24T10:00:00.000Z',
      };
      store = [...store, nextItem];
      return { success: true, item: toApiItem(nextItem) };
    });

    api.updateDashboardItem.mockImplementation(async (_userId, itemId, payload) => {
      store = store.map((item) => (
        item.id === itemId
          ? {
              ...item,
              text: payload.text,
              status: payload.status,
              priority: payload.priority,
              category: payload.category,
              dueDate: payload.dueDate,
              dueTime: payload.dueTime,
              updatedAt: '2026-03-24T11:00:00.000Z',
            }
          : item
      ));

      return { success: true };
    });

    api.deleteDashboardItem.mockImplementation(async (_userId, itemId) => {
      store = store.filter((item) => item.id !== itemId);
      return { success: true };
    });
  });

  it('handles add, filter, sort, details modal, edit and delete flows with mock API', async () => {
    render(
      <AuthProvider>
        <DashboardProvider>
          <Dashboard />
        </DashboardProvider>
      </AuthProvider>,
    );

    expect(await screen.findByText('Bravo task')).toBeInTheDocument();
    expect(screen.getByText('Alpha task')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /новая задача/i }));

    const createTitleInput = await screen.findByLabelText(/название задачи/i);
    const createModal = createTitleInput.closest('.modal-content');

    fireEvent.change(createTitleInput, {
      target: { value: 'Gamma task' },
    });
    fireEvent.change(within(createModal).getByLabelText(/категория/i), {
      target: { value: 'work' },
    });
    fireEvent.submit(createModal.querySelector('form'));

    await waitFor(() => {
      expect(api.createDashboardItem).toHaveBeenCalled();
    });

    expect(await screen.findByText('Gamma task')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/найти задачу/i), {
      target: { value: 'Gamma' },
    });

    await waitFor(() => {
      expect(screen.getByText('1 из 3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /сбросить/i }));
    fireEvent.change(screen.getAllByRole('combobox')[1], {
      target: { value: 'title' },
    });

    await waitFor(() => {
      const titles = Array.from(document.querySelectorAll('.card .card-title')).map((node) => node.textContent);
      expect(titles[0]).toBe('Alpha task');
    });

    const gammaTitle = await screen.findByText('Gamma task');
    fireEvent.click(gammaTitle.closest('button'));

    expect(await screen.findByText(/детали задачи и быстрые действия/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /закрыть/i }));

    const gammaCard = screen.getByText('Gamma task').closest('.card');
    fireEvent.click(within(gammaCard).getByTitle(/редактировать/i));
    const editTitleInput = await screen.findByLabelText(/название задачи/i);
    const editModal = editTitleInput.closest('.modal-content');

    fireEvent.change(editTitleInput, {
      target: { value: 'Aardvark task' },
    });
    fireEvent.submit(editModal.querySelector('form'));

    await waitFor(() => {
      expect(api.updateDashboardItem).toHaveBeenCalled();
    });

    expect(await screen.findByText('Aardvark task')).toBeInTheDocument();

    const updatedCard = screen.getByText('Aardvark task').closest('.card');
    fireEvent.click(within(updatedCard).getByTitle(/удалить/i));

    await waitFor(() => {
      expect(screen.queryByText('Aardvark task')).not.toBeInTheDocument();
      expect(screen.getByText('2 задач')).toBeInTheDocument();
    });
  });
});
