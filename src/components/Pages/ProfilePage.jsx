import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ServerError from '../shared/ServerError';
import './ProfilePage.css';

function ProfilePage() {
  const { currentUser } = useAuth();

  // ─── Состояние загрузки/ошибки ───────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile State
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    company: '',
    position: '',
    location: '',
    website: '',
    github: '',
    linkedin: '',
    twitter: ''
  });

  // Settings State
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    language: 'ru',
    timezone: 'Asia/Almaty',
    dateFormat: 'DD.MM.YYYY',
    theme: 'auto'
  });

  const [activities, setActivities] = useState([]);

  const [stats, setStats] = useState({
    tasksCompleted: 0,
    projectsActive: 0,
    hoursWorked: 0,
    achievements: 0
  });

  const [errors, setErrors] = useState({});

  // ─── Загрузка данных (имитируем зависимость от бэка) ─────────────────────
  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Запрос к бэку — если он упадёт, покажем ServerError
      const result = await api.getUser(currentUser.id);

      if (!result.success) {
        setError(result.error || 'Не удалось загрузить данные профиля');
        return;
      }

      // Бэк ответил — грузим остальное из localStorage
      const safeLoad = (key, fallback) => {
        try {
          const saved = localStorage.getItem(key);
          return saved ? JSON.parse(saved) : fallback;
        } catch {
          localStorage.removeItem(key);
          return fallback;
        }
      };

      // Приоритет: localStorage > данные с бэка
      const savedProfile = safeLoad('userProfile', null);
      setProfile(savedProfile || {
        firstName: result.user.firstName || '',
        lastName: result.user.lastName || '',
        email: result.user.email || '',
        phone: '',
        bio: '',
        company: '',
        position: '',
        location: '',
        website: '',
        github: '',
        linkedin: '',
        twitter: ''
      });

      setSettings(safeLoad('userSettings', settings));
      setActivities(safeLoad('userActivities', []));
      setStats(safeLoad('userStats', { tasksCompleted: 0, projectsActive: 0, hoursWorked: 0, achievements: 0 }));

    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
      setError('Не удалось загрузить профиль. Проверьте подключение к серверу.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadProfileData();
    }
  }, [currentUser?.id]);

  // ─── Валидация ────────────────────────────────────────────────────────────
  const validateProfile = () => {
    const newErrors = {};
    if (!profile.firstName.trim()) newErrors.firstName = 'Имя обязательно';
    if (!profile.lastName.trim()) newErrors.lastName = 'Фамилия обязательна';
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) newErrors.email = 'Неверный формат email';
    if (profile.phone && !/^\+?[\d\s\-()]+$/.test(profile.phone)) newErrors.phone = 'Неверный формат телефона';
    if (profile.website && !/^https?:\/\/.+/.test(profile.website)) newErrors.website = 'URL должен начинаться с http:// или https://';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    }
  };

  const saveProfile = () => {
    if (validateProfile()) {
      localStorage.setItem('userProfile', JSON.stringify(profile));
      addActivity('Профиль обновлен');
      alert('Профиль успешно сохранен!');
    }
  };

  const handleSettingChange = (field, value) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    addActivity(`Настройки изменены: ${field}`);
  };

  const addActivity = (action) => {
    const newActivity = { id: Date.now(), action, timestamp: new Date().toISOString() };
    const newActivities = [newActivity, ...activities].slice(0, 20);
    setActivities(newActivities);
    localStorage.setItem('userActivities', JSON.stringify(newActivities));
  };

  const clearAllData = () => {
    if (window.confirm('Вы уверены, что хотите удалить все данные профиля? Это действие необратимо.')) {
      ['userProfile', 'userSettings', 'userActivities', 'userStats'].forEach(k => localStorage.removeItem(k));
      setProfile({ firstName: '', lastName: '', email: '', phone: '', bio: '', company: '', position: '', location: '', website: '', github: '', linkedin: '', twitter: '' });
      setActivities([]);
      setStats({ tasksCompleted: 0, projectsActive: 0, hoursWorked: 0, achievements: 0 });
      alert('Все данные удалены');
    }
  };

  const exportData = () => {
    const data = { profile, settings, activities, stats, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addActivity('Данные экспортированы');
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.profile) { setProfile(data.profile); localStorage.setItem('userProfile', JSON.stringify(data.profile)); }
        if (data.settings) { setSettings(data.settings); localStorage.setItem('userSettings', JSON.stringify(data.settings)); }
        if (data.activities) { setActivities(data.activities); localStorage.setItem('userActivities', JSON.stringify(data.activities)); }
        if (data.stats) { setStats(data.stats); localStorage.setItem('userStats', JSON.stringify(data.stats)); }
        addActivity('Данные импортированы');
        alert('Данные успешно импортированы!');
      } catch {
        alert('Ошибка при импорте данных. Проверьте файл.');
      }
    };
    reader.readAsText(file);
  };

  const getInitials = () => {
    const first = profile.firstName.charAt(0).toUpperCase();
    const last = profile.lastName.charAt(0).toUpperCase();
    return first + last || '??';
  };

  const formatDate = (isoString) => new Date(isoString).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // ─── РЕНДЕР ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <ServerError
          onRetry={loadProfileData}
          message={error}
        />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Профиль пользователя</h1>
        <p>Управление личной информацией и настройками</p>
      </div>

      <div className="profile-layout">
        {/* Left Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-card avatar-card">
            <div className="avatar-large">{getInitials()}</div>
            <h2 className="profile-name">
              {profile.firstName || profile.lastName ? `${profile.firstName} ${profile.lastName}` : 'Имя не указано'}
            </h2>
            {profile.position && <p className="profile-title">{profile.position}</p>}
            {profile.company && <p className="profile-company">{profile.company}</p>}
          </div>

          <div className="profile-card stats-card">
            <h3>Статистика</h3>
            <div className="stats-list">
              {[
                { icon: '✅', value: stats.tasksCompleted, label: 'Задач выполнено' },
                { icon: '📁', value: stats.projectsActive, label: 'Активных проектов' },
                { icon: '⏱️', value: stats.hoursWorked, label: 'Часов работы' },
                { icon: '🏆', value: stats.achievements, label: 'Достижений' },
              ].map(s => (
                <div key={s.label} className="stat-item">
                  <span className="stat-icon">{s.icon}</span>
                  <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-card actions-card">
            <h3>Действия</h3>
            <div className="actions-list">
              <button onClick={exportData} className="action-button">📤 Экспорт данных</button>
              <label className="action-button">
                📥 Импорт данных
                <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
              </label>
              <button onClick={clearAllData} className="action-button danger">🗑️ Очистить всё</button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          <div className="profile-card">
            <h3>Личная информация</h3>
            <div className="form-grid">
              {[
                { label: 'Имя *', field: 'firstName', type: 'text' },
                { label: 'Фамилия *', field: 'lastName', type: 'text' },
                { label: 'Email', field: 'email', type: 'email' },
                { label: 'Телефон', field: 'phone', type: 'tel' },
              ].map(f => (
                <div key={f.field} className="form-field">
                  <label>{f.label}</label>
                  <input
                    type={f.type}
                    value={profile[f.field]}
                    onChange={(e) => handleProfileChange(f.field, e.target.value)}
                    className={errors[f.field] ? 'error' : ''}
                  />
                  {errors[f.field] && <span className="error-message">{errors[f.field]}</span>}
                </div>
              ))}
              <div className="form-field full-width">
                <label>О себе</label>
                <textarea value={profile.bio} onChange={(e) => handleProfileChange('bio', e.target.value)} rows="4" placeholder="Расскажите о себе..." />
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h3>Профессиональная информация</h3>
            <div className="form-grid">
              {[
                { label: 'Компания', field: 'company', type: 'text', placeholder: '' },
                { label: 'Должность', field: 'position', type: 'text', placeholder: '' },
                { label: 'Местоположение', field: 'location', type: 'text', placeholder: 'Город, Страна' },
                { label: 'Веб-сайт', field: 'website', type: 'url', placeholder: 'https://example.com' },
              ].map(f => (
                <div key={f.field} className="form-field">
                  <label>{f.label}</label>
                  <input
                    type={f.type}
                    value={profile[f.field]}
                    onChange={(e) => handleProfileChange(f.field, e.target.value)}
                    className={errors[f.field] ? 'error' : ''}
                    placeholder={f.placeholder}
                  />
                  {errors[f.field] && <span className="error-message">{errors[f.field]}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="profile-card">
            <h3>Социальные сети</h3>
            <div className="form-grid">
              {[
                { label: 'GitHub', field: 'github', prefix: 'github.com/' },
                { label: 'LinkedIn', field: 'linkedin', prefix: 'linkedin.com/in/' },
                { label: 'Twitter', field: 'twitter', prefix: '@' },
              ].map(s => (
                <div key={s.field} className="form-field">
                  <label>{s.label}</label>
                  <div className="input-with-icon">
                    <span className="input-icon">{s.prefix}</span>
                    <input type="text" value={profile[s.field]} onChange={(e) => handleProfileChange(s.field, e.target.value)} placeholder="username" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-card">
            <h3>Настройки</h3>
            <div className="settings-list">
              {[
                { label: 'Email уведомления', desc: 'Получать уведомления на почту', field: 'emailNotifications' },
                { label: 'Push уведомления', desc: 'Получать push-уведомления', field: 'pushNotifications' },
                { label: 'Еженедельная сводка', desc: 'Получать дайджест раз в неделю', field: 'weeklyDigest' },
              ].map(s => (
                <div key={s.field} className="setting-item">
                  <div className="setting-info"><strong>{s.label}</strong><span>{s.desc}</span></div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={settings[s.field]} onChange={(e) => handleSettingChange(s.field, e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              ))}

              <div className="setting-item">
                <div className="setting-info"><strong>Язык</strong><span>Язык интерфейса</span></div>
                <select value={settings.language} onChange={(e) => handleSettingChange('language', e.target.value)}>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="kz">Қазақша</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info"><strong>Часовой пояс</strong><span>Ваш часовой пояс</span></div>
                <select value={settings.timezone} onChange={(e) => handleSettingChange('timezone', e.target.value)}>
                  <option value="Asia/Almaty">Алматы (GMT+6)</option>
                  <option value="Europe/Moscow">Москва (GMT+3)</option>
                  <option value="Europe/London">Лондон (GMT+0)</option>
                  <option value="America/New_York">Нью-Йорк (GMT-5)</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info"><strong>Формат даты</strong><span>Как отображать даты</span></div>
                <select value={settings.dateFormat} onChange={(e) => handleSettingChange('dateFormat', e.target.value)}>
                  <option value="DD.MM.YYYY">ДД.ММ.ГГГГ</option>
                  <option value="MM/DD/YYYY">ММ/ДД/ГГГГ</option>
                  <option value="YYYY-MM-DD">ГГГГ-ММ-ДД</option>
                </select>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h3>История активности</h3>
            {activities.length > 0 ? (
              <div className="activity-list">
                {activities.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-content">
                      <div className="activity-action">{activity.action}</div>
                      <div className="activity-time">{formatDate(activity.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">Нет активности</p>
            )}
          </div>

          <div className="profile-actions">
            <button onClick={saveProfile} className="save-button">Сохранить изменения</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;