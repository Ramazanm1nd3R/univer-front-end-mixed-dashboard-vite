/* eslint-env vitest */
import { fireEvent, render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card compound components', () => {
  const item = {
    id: 'task-99',
    title: 'Write test plan',
    description: 'Make sure the UI and API layers are covered.',
    status: 'active',
    category: 'study',
    priority: 'high',
  };

  it('renders slot components and forwards actions', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onToggleStatus = vi.fn();

    render(
      <Card
        item={item}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
      >
        <Card.Header />
        <Card.Body />
        <Card.Footer />
      </Card>,
    );

    expect(screen.getByText('Write test plan')).toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mark done/i }));
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(onToggleStatus).toHaveBeenCalledWith('task-99');
    expect(onEdit).toHaveBeenCalledWith(item);
    expect(onDelete).toHaveBeenCalledWith('task-99');
  });
});

