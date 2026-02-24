import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from './Card';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import '../../styles/Dashboard.css';
import ServerError from '../shared/ServerError';

function Dashboard() {
  const { currentUser } = useAuth();

  const [items, setItems]               = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [filters, setFilters]           = useState({ category: 'all', status: 'all', search: '' });
  const [sortBy, setSortBy]             = useState('date');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const loadDashboardItems = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user?.id) { setItems([]); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const result = await api.getDashboardItems(user.id);
      if (result.success) {
        setItems(result.items.map(item => ({
          id: item.id,
          title: item.text,
          description: item.text,
          category: item.category || 'other',
          status: item.status,
          priority: item.priority || 'medium',
          date: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          likes: 0
        })));
      } else {
        setError(result.error || 'Ошибка загрузки данных');
        setItems([]);
      }
    } catch {
      setError('Не удалось загрузить задачи');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const prevUserIdRef = useRef(null);
  useEffect(() => {
    const userId = currentUser?.id;
    if (userId && userId !== prevUserIdRef.current) {
      prevUserIdRef.current = userId;
      loadDashboardItems();
    }
  }, [currentUser?.id, loadDashboardItems]);

  // Filtering + sorting
  useEffect(() => {
    let result = [...items];
    if (filters.category !== 'all') result = result.filter(i => i.category === filters.category);
    if (filters.status   !== 'all') result = result.filter(i => i.status   === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q));
    }
    const P = { high: 3, medium: 2, low: 1 };
    result.sort((a, b) => {
      if (sortBy === 'date')     return new Date(b.date) - new Date(a.date);
      if (sortBy === 'title')    return a.title.localeCompare(b.title);
      if (sortBy === 'priority') return (P[b.priority] || 0) - (P[a.priority] || 0);
      return 0;
    });
    setFilteredItems(result);
  }, [items, filters, sortBy]);

  // CRUD
  const addItem = async (newItem) => {
    try {
      const result = await api.createDashboardItem(currentUser.id, {
        text: newItem.title, status: newItem.status || 'active',
        priority: newItem.priority || 'medium', category: newItem.category || 'other'
      });
      if (result.success) await loadDashboardItems();
      else alert('Ошибка создания: ' + (result.error || ''));
    } catch { alert('Не удалось создать задачу'); }
  };

  const updateItem = async (updatedItem) => {
    try {
      const result = await api.updateDashboardItem(currentUser.id, updatedItem.id, {
        text: updatedItem.title, status: updatedItem.status,
        priority: updatedItem.priority, category: updatedItem.category
      });
      if (result.success) await loadDashboardItems();
      else alert('Ошибка обновления: ' + (result.error || ''));
    } catch { alert('Не удалось обновить задачу'); }
  };

  const deleteItem = async (id) => {
    try {
      const result = await api.deleteDashboardItem(currentUser.id, id);
      if (result.success) await loadDashboardItems();
      else alert('Ошибка удаления: ' + (result.error || ''));
    } catch { alert('Не удалось удалить задачу'); }
  };

  const toggleStatus = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStatus = item.status === 'active' ? 'completed' : 'active';
    try {
      const result = await api.updateDashboardItem(currentUser.id, id, {
        text: item.title, status: newStatus, priority: item.priority, category: item.category
      });
      if (result.success) await loadDashboardItems();
    } catch { alert('Не удалось изменить статус'); }
  };

  const toggleLike   = (id) => setItems(items.map(i => i.id === id ? { ...i, likes: i.likes + 1 } : i));
  const openEditModal = (item) => { setEditingItem(item); setIsEditModalOpen(true); };

  // Derived stats
  const activeCount    = items.filter(i => i.status === 'active').length;
  const completedCount = items.filter(i => i.status === 'completed').length;
  const highCount      = items.filter(i => i.priority === 'high' && i.status === 'active').length;
  const completionPct  = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  // States
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }
  if (!currentUser) {
    return <div className="dashboard-container"><div className="empty-state"><p>Войдите в систему</p></div></div>;
  }
  if (error) {
    return <div className="dashboard-container"><ServerError onRetry={loadDashboardItems} /></div>;
  }

  return (
    <div className="dashboard-container">

      {/* ── HERO BANNER ── */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="welcome-section">
            <h1 className="hero-title">👋 Привет, {currentUser.firstName}!</h1>
            <p className="hero-subtitle">
              {activeCount > 0
                ? `${activeCount} активных задач${highCount > 0 ? ` · ${highCount} 🔥 срочных` : ''}`
                : 'Все задачи выполнены — отличная работа! 🎉'}
            </p>
          </div>
          <button className="cta-button" onClick={() => setIsAddModalOpen(true)}>
            <span className="cta-icon">✨</span>
            <span>Новая задача</span>
          </button>
        </div>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={() => setFilters(f => ({ ...f, status: 'active' }))}>⚡ Активные</button>
          <button className="quick-action-btn" onClick={() => setFilters(f => ({ ...f, status: 'all', category: 'all', search: '' }))}>
            🔥 Срочные
          </button>
          <button className="quick-action-btn" onClick={() => setFilters(f => ({ ...f, category: 'work' }))}>💼 Работа</button>
          {(filters.status !== 'all' || filters.category !== 'all' || filters.search) && (
            <button className="quick-action-btn reset" onClick={() => setFilters({ category: 'all', status: 'all', search: '' })}>
              ✕ Сбросить
            </button>
          )}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="stats-grid modern">
        <div className="stat-card modern">
          <div className="stat-icon-box total">📋</div>
          <div className="stat-content">
            <div className="stat-label">Всего задач</div>
            <div className="stat-value">{items.length}</div>
            <div className="stat-sub">за всё время</div>
          </div>
        </div>
        <div className="stat-card modern">
          <div className="stat-icon-box active-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-label">Активных</div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-progress">
              <div className="stat-progress-bar active-bar"
                style={{ width: items.length ? `${(activeCount / items.length) * 100}%` : '0%' }} />
            </div>
          </div>
        </div>
        <div className="stat-card modern">
          <div className="stat-icon-box completed-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Завершено</div>
            <div className="stat-value">{completedCount}</div>
            <div className="stat-progress">
              <div className="stat-progress-bar completed-bar"
                style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </div>
        <div className="stat-card modern">
          <div className="stat-icon-box rate-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-label">Продуктивность</div>
            <div className="stat-value">{completionPct}%</div>
            <div className={`stat-sub ${completionPct >= 70 ? 'positive' : completionPct >= 40 ? 'neutral' : 'negative'}`}>
              {completionPct >= 70 ? '↑ Отлично!' : completionPct >= 40 ? '→ Хорошо' : '↓ Нужно больше'}
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPACT FILTERS ── */}
      <div className="filters-compact">
        <div className="filter-group">
          <label className="filter-label">🔍 Поиск</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Найти задачу..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">📁 Категория</label>
          <select className="filter-select" value={filters.category}
            onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="all">Все категории</option>
            <option value="work">💼 Работа</option>
            <option value="personal">👤 Личное</option>
            <option value="health">💪 Здоровье</option>
            <option value="other">📌 Другое</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">📊 Статус</label>
          <div className="filter-pills">
            {[['all','Все'],['active','Активные'],['completed','Готовые']].map(([val, label]) => (
              <button key={val} className={`pill ${filters.status === val ? 'active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, status: val }))}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">🔀 Сортировка</label>
          <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date">По дате</option>
            <option value="title">По названию</option>
            <option value="priority">По приоритету</option>
          </select>
        </div>
      </div>

      {/* ── COUNT ROW ── */}
      <div className="cards-count-row">
        <span className="cards-count">
          {filteredItems.length === items.length
            ? `${items.length} задач`
            : `${filteredItems.length} из ${items.length}`}
        </span>
      </div>

      {/* ── CARD GRID ── */}
      <div className="cards-grid">
        {filteredItems.length === 0 ? (
          <div className="empty-state modern">
            <div className="empty-icon">📭</div>
            <h3>Задачи не найдены</h3>
            <p>{items.length === 0 ? 'Создайте первую задачу!' : 'Попробуйте изменить фильтры'}</p>
            {items.length === 0 && (
              <button className="cta-button" style={{ marginTop:'1rem' }} onClick={() => setIsAddModalOpen(true)}>
                ✨ Создать задачу
              </button>
            )}
          </div>
        ) : (
          filteredItems.map(item => (
            <Card key={item.id} item={item}
              onDelete={deleteItem} onToggleStatus={toggleStatus}
              onToggleLike={toggleLike} onEdit={openEditModal} />
          ))
        )}
      </div>

      {/* ── MODALS ── */}
      {isAddModalOpen  && <AddItemModal onClose={() => setIsAddModalOpen(false)} onAdd={addItem} />}
      {isEditModalOpen && (
        <EditItemModal item={editingItem}
          onClose={() => { setIsEditModalOpen(false); setEditingItem(null); }}
          onUpdate={updateItem} />
      )}
    </div>
  );
}

export default Dashboard;
