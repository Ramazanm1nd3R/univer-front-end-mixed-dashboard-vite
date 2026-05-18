import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/mixedDashboard.module.css';

function NotFoundPage() {
  return (
    <div className={styles.notFound}>
      <div className={styles.notFoundCard}>
        <p className={styles.heroKicker}>404</p>
        <h2 className={styles.sectionTitle}>Page not found</h2>
        <p className={styles.sectionLead}>The route drifted off. Head back to the dashboard and continue from there.</p>
        <Link to="/" className={styles.primaryButton}>
          Return home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;

