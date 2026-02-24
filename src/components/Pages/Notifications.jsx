import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';

function Notifications() {
  const { currentUser } = useAuth();
  const { notifications } = useDashboard();

  if (!currentUser) return null;

  return (
    <div className="notifications-container">
      {notifications.map(n => (
        <div key={n.id} className={`notification notification-${n.type}`}>
          <span className="notification-icon">
            {n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="notification-message">{n.message}</span>
        </div>
      ))}
    </div>
  );
}

export default Notifications;