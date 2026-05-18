import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import styles from '../styles/mixedDashboard.module.css';

function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { tasks, recipes, movies } = useItems();
  const [preferences, setPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mixed-dashboard-preferences') || 'null') || {
        compactCards: false,
        highlightFavorites: true,
      };
    } catch {
      return {
        compactCards: false,
        highlightFavorites: true,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('mixed-dashboard-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const metrics = useMemo(() => [
    { label: 'Tasks', value: tasks.length },
    { label: 'Recipes', value: recipes.length },
    { label: 'Movies', value: movies.length },
  ], [movies.length, recipes.length, tasks.length]);

  if (!currentUser) {
    return (
      <div className={styles.pageSection}>
        <div className={styles.emptyState}>
          <p className={styles.emptyIcon}>🔒</p>
          <h3 className={styles.emptyTitle}>Profile is protected</h3>
          <p className={styles.emptyText}>This page is wrapped with the withAuth HOC and needs an authenticated session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageSection}>
      <div className={styles.profileBanner}>
        <div className={styles.profileAvatar}>{currentUser.firstName?.[0] || 'U'}</div>
        <div>
          <p className={styles.heroKicker}>Profile</p>
          <h2 className={styles.sectionTitle}>{currentUser.firstName} {currentUser.lastName}</h2>
          <p className={styles.sectionLead}>{currentUser.email}</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.statCard}>
            <span className={styles.statLabel}>{metric.label}</span>
            <strong className={styles.statValue}>{metric.value}</strong>
          </div>
        ))}
      </div>

      <section className={styles.pageSection}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.heroKicker}>Preferences</p>
            <h3 className={styles.sectionTitle}>Dashboard behavior</h3>
          </div>
        </header>

        <div className={styles.settingsGrid}>
          <label className={styles.toggleRow}>
            <span>Compact cards</span>
            <input
              type="checkbox"
              checked={preferences.compactCards}
              onChange={() => setPreferences((prev) => ({ ...prev, compactCards: !prev.compactCards }))}
            />
          </label>

          <label className={styles.toggleRow}>
            <span>Highlight favorites</span>
            <input
              type="checkbox"
              checked={preferences.highlightFavorites}
              onChange={() => setPreferences((prev) => ({ ...prev, highlightFavorites: !prev.highlightFavorites }))}
            />
          </label>
        </div>
      </section>

      <button type="button" className={styles.destructiveButton} onClick={logout}>
        Sign out
      </button>
    </div>
  );
}

export default ProfilePage;

