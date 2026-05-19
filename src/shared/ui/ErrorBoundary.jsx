import React from 'react';
import styles from '@shared/styles/mixedDashboard.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

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

