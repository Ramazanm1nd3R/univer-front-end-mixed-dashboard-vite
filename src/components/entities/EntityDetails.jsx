import React from 'react';
import styles from '../../styles/mixedDashboard.module.css';

function EntityDetails({ entityConfig, item }) {
  const metaPairs = Object.entries(item)
    .filter(([key, value]) => !['id', 'title', 'description', 'notes', 'createdAt', 'updatedAt'].includes(key) && value !== '' && value != null)
    .slice(0, 8);

  return (
    <div className={styles.detailsPanel}>
      <p className={styles.heroKicker}>{entityConfig.singularLabel}</p>
      <h3 className={styles.sectionTitle}>{item.title}</h3>
      <p className={styles.sectionLead}>{item.description}</p>

      <div className={styles.detailsGrid}>
        {metaPairs.map(([key, value]) => (
          <div key={key} className={styles.detailsItem}>
            <span className={styles.detailsLabel}>{key}</span>
            <span className={styles.detailsValue}>
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </span>
          </div>
        ))}
      </div>

      {item.notes ? (
        <div className={styles.detailsNotes}>
          <span className={styles.detailsLabel}>Notes</span>
          <p className={styles.sectionLead}>{item.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

export default EntityDetails;

