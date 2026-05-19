/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { useAuth } from '@features/auth/model/AuthContext';

// HOC-обёртка для защищённых страниц. Отличается от ProtectedRouteWrapper
// (App.jsx) тем, что не редиректит на /login, а показывает дружелюбный fallback —
// так удобнее, если пользователь пришёл по ссылке и должен видеть, ЧТО ему недоступно.

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

    // Пока сессия восстанавливается — не моргаем фоллбэком зря.
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

  // displayName в формате withAuth(Foo) — помогает в React DevTools
  // и stack-trace'ах ошибок отличать обёрнутые компоненты от обычных.
  const wrappedName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithAuthComponent.displayName = `withAuth(${wrappedName})`;

  return WithAuthComponent;
}

export default withAuth;
