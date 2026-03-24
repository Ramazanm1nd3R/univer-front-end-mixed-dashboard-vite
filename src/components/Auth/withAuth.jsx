/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { useAuth } from '../../context/AuthContext';

function AccessDenied({ message }) {
  return (
    <div className="dashboard-container">
      <div className="empty-state modern">
        <div className="empty-icon">🔒</div>
        <h3>Доступ ограничен</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

export function withAuth(
  WrappedComponent,
  {
    fallbackMessage = 'Эта страница доступна только авторизованным пользователям.',
  } = {},
) {
  function WithAuthComponent(props) {
    const { currentUser, loading } = useAuth();

    if (loading) {
      return (
        <div className="dashboard-container">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Проверяем доступ...</p>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return <AccessDenied message={fallbackMessage} />;
    }

    return <WrappedComponent {...props} />;
  }

  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithAuthComponent.displayName = `withAuth(${wrappedName})`;

  return WithAuthComponent;
}

export default withAuth;
