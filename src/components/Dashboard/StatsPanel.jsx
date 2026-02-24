import React from 'react';
import { useDashboard } from './Dashboard';

function StatsPanel() {
  const { items } = useDashboard();

  const active = items.filter(i => i.status === 'active').length;
  const completed = items.filter(i => i.status === 'completed').length;
  const work = items.filter(i => i.category === 'work').length;

  return (
    <div className="dashboard-stats">
      <div className="stat-card"><h4>Всего</h4><p className="stat-number">{items.length}</p></div>
      <div className="stat-card"><h4>Активных</h4><p className="stat-number active">{active}</p></div>
      <div className="stat-card"><h4>Завершенных</h4><p className="stat-number completed">{completed}</p></div>
      <div className="stat-card"><h4>Работа</h4><p className="stat-number">{work}</p></div>
    </div>
  );
}

export default StatsPanel;