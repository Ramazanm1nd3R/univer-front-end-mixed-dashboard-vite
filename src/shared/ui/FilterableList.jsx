import React from 'react';
import styles from '@shared/styles/mixedDashboard.module.css';

function FilterableList({ items, renderItem, emptyState, className = '' }) {
  if (!items.length) {
    return emptyState || (
      <div className={styles.emptyState}>
        <p className={styles.emptyIcon}>◌</p>
        <h3 className={styles.emptyTitle}>Nothing to show yet</h3>
        <p className={styles.emptyText}>Try adjusting filters or add a new item.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.listGrid} ${className}`.trim()}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
}

export default FilterableList;

