import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import ServerError from '../shared/ServerError';
import './ProfilePage.css';

function LoadingState() {
  return (
    <div className="profile-loading">
      <div className="loading-spinner" />
      <p>Loading profile...</p>
    </div>
  );
}

function ProfilePage() {
  const { currentUser, logout } = useAuth();

  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('taskflow-settings') || 'null') || {
        emailNotifications: true,
        weeklySummary: true,
      };
    } catch {
      return { emailNotifications: true, weeklySummary: true };
    }
  });

  const {
    data: analyticsResponse,
    loading,
    error,
    execute: loadAnalytics,
  } = useFetch(api.getDashboardAnalytics);

  const analytics = analyticsResponse?.analytics || null;

  const loadProfileData = useCallback(async () => {
    if (!currentUser?.id) {
      return;
    }
    await loadAnalytics(currentUser.id);
  }, [currentUser?.id, loadAnalytics]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const toggleSetting = (field) => {
    setSettings((prev) => {
      const next = { ...prev, [field]: !prev[field] };
      localStorage.setItem('taskflow-settings', JSON.stringify(next));
      return next;
    });
  };

  const profileStats = useMemo(() => {
    const totalTasks = analytics?.totalTasks || 0;
    const completedTasks = analytics?.completedTasks || 0;
    const focusHours = Math.max(1, Math.round((completedTasks * 35) / 60));

    const completionDays = new Set(
      (analytics?.recentActivities || [])
        .filter((activity) => activity.action === 'completed')
        .map((activity) => new Date(activity.timestamp).toISOString().slice(0, 10))
    );

    let streak = 0;
    const cursor = new Date();
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (!completionDays.has(key)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      totalTasks,
      completedTasks,
      streak,
      focusHours,
    };
  }, [analytics]);

  const activityBars = useMemo(() => {
    const data = (analytics?.last30Days || []).slice(-7);
    const maxValue = Math.max(1, ...data.map((item) => item.completed + item.active));

    return data.map((item) => ({
      date: item.date.slice(5),
      value: item.completed + item.active,
      pct: Math.round(((item.completed + item.active) / maxValue) * 100),
    }));
  }, [analytics]);

  const achievements = useMemo(() => {
    const total = profileStats.totalTasks;
    return [
      { icon: '🚀', name: 'First Task', unlocked: total >= 1 },
      { icon: '💯', name: '100 Tasks', unlocked: total >= 100 },
      { icon: '🔒', name: '1000 Tasks', unlocked: total >= 1000 },
    ];
  }, [profileStats.totalTasks]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading) return <LoadingState />;
  if (error) return <ServerError onRetry={loadProfileData} message={error} />;

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-icon">👤</span>
        </div>
        <div className="profile-info">
          <h1>{fullName || 'TaskFlow User'}</h1>
          <p className="profile-email">{currentUser?.email || 'No email'}</p>
          <span className="profile-badge">Pro Member</span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat-card">
          <span className="stat-icon">📊</span>
          <span className="stat-value">{profileStats.totalTasks}</span>
          <span className="stat-label">Tasks Created</span>
        </div>
        <div className="profile-stat-card">
          <span className="stat-icon">✅</span>
          <span className="stat-value">{profileStats.completedTasks}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="profile-stat-card">
          <span className="stat-icon">🔥</span>
          <span className="stat-value">{profileStats.streak}</span>
          <span className="stat-label">Day Streak</span>
        </div>
        <div className="profile-stat-card">
          <span className="stat-icon">⏱️</span>
          <span className="stat-value">{profileStats.focusHours}</span>
          <span className="stat-label">Focus Hours</span>
        </div>
      </div>

      <div className="section-card">
        <h2>🏆 Achievements</h2>
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div key={achievement.name} className={`achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
              <span className="achievement-icon">{achievement.icon}</span>
              <span className="achievement-name">{achievement.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <h2>📈 Activity Overview</h2>
        <div className="activity-chart">
          {activityBars.map((bar) => (
            <div key={bar.date} className="activity-bar-wrap" title={`${bar.value} tasks`}>
              <div className="activity-bar" style={{ height: `${Math.max(8, bar.pct)}%` }} />
              <span className="activity-label">{bar.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <h2>⚙️ Settings</h2>
        <div className="settings-list">
          <div className="setting-item">
            <span className="setting-label">Email Notifications</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.emailNotifications} onChange={() => toggleSetting('emailNotifications')} />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className="setting-item">
            <span className="setting-label">Weekly Summary</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.weeklySummary} onChange={() => toggleSetting('weeklySummary')} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>

      <button className="btn-logout" onClick={handleLogout}>🚪 Logout</button>
    </div>
  );
}

export default ProfilePage;
