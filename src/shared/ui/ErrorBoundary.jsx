import React from 'react';
import styles from '@shared/styles/mixedDashboard.module.css';

// React пока не даёт ловить ошибки в функциональных компонентах,
// поэтому ErrorBoundary обязан быть class component'ом
// с getDerivedStateFromError + componentDidCatch.
//
// Оборачивает <Routes> в App.jsx — если страница падает в рендере,
// показывается fallback, а не белый экран.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Этот метод обновляет state на основе ошибки. Возвращаемое значение мерджится в state.
  // Не вызывается в SSR-фазе, только в render — поэтому здесь нет side-effects.
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // А вот тут уже можно делать side-effects — логирование, отправка в Sentry и т.п.
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  // Кнопка "Try again": сбрасываем error state и опционально дёргаем родительский retry
  // (например, перезагрузить данные, которые упали при первой загрузке).
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onRetry === 'function') {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorBoundaryCard}>
            <p className={styles.heroKicker}>Something went wrong</p>
            <h2 className={styles.sectionTitle}>We hit an unexpected error</h2>
            <p className={styles.sectionLead}>
              {this.state.error?.message || 'The dashboard could not render this view.'}
            </p>
            <button type="button" className={styles.primaryButton} onClick={this.handleRetry}>
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

