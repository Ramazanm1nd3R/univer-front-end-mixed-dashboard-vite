/* eslint-env vitest */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Card from '../Card';

describe('TaskCard compound components', () => {
  const item = {
    id: 'task-1',
    title: 'Prepare demo',
    description: 'Collect screenshots and metrics',
    category: 'work',
    status: 'active',
    priority: 'high',
    date: '2026-03-18T10:00:00.000Z',
    updatedAt: '2026-03-18T10:00:00.000Z',
    dueDate: '2026-03-28T10:30',
    likes: 2,
  };

  it('coordinates child components through context and opens modal details', async () => {
    const onDelete = vi.fn();
    const onToggleStatus = vi.fn();
    const onToggleLike = vi.fn();
    const onEdit = vi.fn();

    render(
      <Card
        item={item}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        onToggleLike={onToggleLike}
        onEdit={onEdit}
      >
        <Card.Header />
        <Card.Body />
        <Card.Footer />
      </Card>,
    );

    expect(await screen.findByText('Prepare demo')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Prepare demo').closest('button'));

    expect(await screen.findByText(/детали задачи и быстрые действия/i)).toBeInTheDocument();
    expect(screen.getAllByText(/collect screenshots and metrics/i)).toHaveLength(2);

    fireEvent.click(screen.getByTitle(/завершить/i));
    expect(onToggleStatus).toHaveBeenCalledWith('task-1');

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }));

    await waitFor(() => {
      expect(onEdit).toHaveBeenCalledWith(item);
    });

    fireEvent.click(screen.getByText(/❤️ 2/i));
    expect(onToggleLike).toHaveBeenCalledWith('task-1');
    expect(onDelete).not.toHaveBeenCalled();
  });
});
