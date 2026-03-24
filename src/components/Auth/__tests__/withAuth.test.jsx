/* eslint-env vitest */
import { render, screen } from '@testing-library/react';
import withAuth from '../withAuth';
import { useAuth } from '../../../context/AuthContext';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function SecretPanel() {
  return <div>Private dashboard content</div>;
}

describe('withAuth', () => {
  it('renders wrapped component for authenticated users', () => {
    useAuth.mockReturnValue({
      currentUser: { id: 'user-1' },
      loading: false,
    });

    const ProtectedPanel = withAuth(SecretPanel);
    render(<ProtectedPanel />);

    expect(screen.getByText('Private dashboard content')).toBeInTheDocument();
  });

  it('renders access denied state for unauthenticated users', () => {
    useAuth.mockReturnValue({
      currentUser: null,
      loading: false,
    });

    const ProtectedPanel = withAuth(SecretPanel, {
      fallbackMessage: 'Нужна авторизация для просмотра данных.',
    });

    render(<ProtectedPanel />);

    expect(screen.getByText(/доступ ограничен/i)).toBeInTheDocument();
    expect(screen.getByText('Нужна авторизация для просмотра данных.')).toBeInTheDocument();
    expect(screen.queryByText('Private dashboard content')).not.toBeInTheDocument();
  });
});
