import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddItemModal from '../AddItemModal';

describe('AddItemModal', () => {
  it('shows validation error when title is empty', async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(<AddItemModal onAdd={onAdd} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /создать задачу/i }));

    expect(await screen.findByText(/введите название задачи/i)).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('submits a valid task and renders preview while typing', async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(<AddItemModal onAdd={onAdd} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/название задачи/i), {
      target: { value: 'Подготовить демо' },
    });

    expect(screen.getByText(/превью задачи/i)).toBeInTheDocument();
    expect(screen.getByText('Подготовить демо')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/категория/i), {
      target: { value: 'work' },
    });

    fireEvent.click(screen.getByRole('button', { name: /создать задачу/i }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith({
        title: 'Подготовить демо',
        category: 'work',
        priority: 'medium',
        status: 'active',
        dueDate: '',
        dueTime: '',
      });
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
