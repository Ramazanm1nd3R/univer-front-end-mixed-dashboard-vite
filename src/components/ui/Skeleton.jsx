import React from 'react';
import styles from '../../styles/mixedDashboard.module.css';

export function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={styles.skeletonLineWide} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLineShort} />
      <div className={styles.skeletonPillRow}>
        <span className={styles.skeletonPill} />
        <span className={styles.skeletonPill} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className={styles.listGrid}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={`skeleton-${index}`} />
      ))}
    </div>
  );
}

export default SkeletonGrid;

