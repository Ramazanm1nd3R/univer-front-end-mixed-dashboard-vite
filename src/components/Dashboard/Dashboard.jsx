import React, { Suspense, lazy, memo, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData, useDashboardUI } from '../../context/DashboardContext';
import Card from './Card';
import '../../styles/Dashboard.css';
import ServerError from '../shared/ServerError';

const AddItemModal = lazy(() => import('./AddItemModal'));
const EditItemModal = lazy(() => import('./EditItemModal'));

function Dashboard() {
  const { currentUser } = useAuth();
  const {
    items,
    loading,
    error,
    loadDashboardItems,
    addItem,
    updateItem,
    deleteItem,
    toggleStatus,
    toggleLike,
  } = useDashboardData();

  const {
    filters,
    sortBy,
    isAddModalOpen,
    isEditModalOpen,
    editingItem,
    setFilters,
    setSortBy,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    resetFilters,
  } = useDashboardUI();

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filters.category !== 'all') {
      result = result.filter((item) => item.category === filters.category);
    }

    if (filters.status !== 'all') {
      result = result.filter((item) => item.status === filters.status);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter((item) => item.title.toLowerCase().includes(query));
    }

    const priorityWeight = { high: 3, medium: 2, low: 1 };

    result.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'priority') {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      return 0;
    });

    return result;
  }, [items, filters, sortBy]);

  const stats = useMemo(() => {
    const activeCount = items.filter((item) => item.status === 'active').length;
    const completedCount = items.filter((item) => item.status === 'completed').length;
    const highCount = items.filter((item) => item.priority === 'high' && item.status === 'active').length;
    const completionPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    return {
      activeCount,
      completedCount,
      highCount,
      completionPct,
    };
  }, [items]);

  const handleSearchChange = useCallback((e) => {
    const search = e.target.value;
    setFilters((prev) => ({ ...prev, search }));
  }, [setFilters]);

  const handleCategoryChange = useCallback((e) => {
    const category = e.target.value;
    setFilters((prev) => ({ ...prev, category }));
  }, [setFilters]);

  const handleStatusChange = useCallback((status) => {
    setFilters((prev) => ({ ...prev, status }));
  }, [setFilters]);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, [setSortBy]);

  const handleShowActive = useCallback(() => {
    setFilters((prev) => ({ ...prev, status: 'active' }));
  }, [setFilters]);

  const handleShowUrgent = useCallback(() => {
    setFilters((prev) => ({ ...prev, status: 'all', category: 'all', search: '' }));
  }, [setFilters]);

  const handleShowWork = useCallback(() => {
    setFilters((prev) => ({ ...prev, category: 'work' }));
  }, [setFilters]);

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
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <p>Войдите в систему</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <ServerError onRetry={loadDashboardItems} />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="welcome-section">
            <h1 className="hero-title">👋 Привет, {currentUser.firstName}!</h1>
            <p className="hero-subtitle">
              {stats.activeCount > 0
                ? `${stats.activeCount} активных задач${stats.highCount > 0 ? ` · ${stats.highCount} 🔥 срочных` : ''}`
                : 'Все задачи выполнены — отличная работа! 🎉'}
            </p>
          </div>
          <button className="cta-button" onClick={openAddModal}>
            <span className="cta-icon">✨</span>
            <span>Новая задача</span>
          </button>
        </div>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={handleShowActive}>⚡ Активные</button>
          <button className="quick-action-btn" onClick={handleShowUrgent}>🔥 Срочные</button>
          <button className="quick-action-btn" onClick={handleShowWork}>💼 Работа</button>
          {(filters.status !== 'all' || filters.category !== 'all' || filters.search) && (
            <button className="quick-action-btn reset" onClick={resetFilters}>
              ✕ Сбросить
            </button>
          )}
        </div>
      </div>

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
            <div className="stat-value">{stats.activeCount}</div>
            <div className="stat-progress">
              <div
                className="stat-progress-bar active-bar"
                style={{ width: items.length ? `${(stats.activeCount / items.length) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>
        <div className="stat-card modern">
          <div className="stat-icon-box completed-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Завершено</div>
            <div className="stat-value">{stats.completedCount}</div>
            <div className="stat-progress">
              <div className="stat-progress-bar completed-bar" style={{ width: `${stats.completionPct}%` }} />
            </div>
          </div>
        </div>
        <div className="stat-card modern">
          <div className="stat-icon-box rate-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-label">Продуктивность</div>
            <div className="stat-value">{stats.completionPct}%</div>
            <div className={`stat-sub ${stats.completionPct >= 70 ? 'positive' : stats.completionPct >= 40 ? 'neutral' : 'negative'}`}>
              {stats.completionPct >= 70 ? '↑ Отлично!' : stats.completionPct >= 40 ? '→ Хорошо' : '↓ Нужно больше'}
            </div>
          </div>
        </div>
      </div>

      <div className="filters-compact">
        <div className="filter-group">
          <label className="filter-label">🔍 Поиск</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Найти задачу..."
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">📁 Категория</label>
          <select className="filter-select" value={filters.category} onChange={handleCategoryChange}>
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
            {[['all', 'Все'], ['active', 'Активные'], ['completed', 'Готовые']].map(([val, label]) => (
              <button
                key={val}
                className={`pill ${filters.status === val ? 'active' : ''}`}
                onClick={() => handleStatusChange(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">🔀 Сортировка</label>
          <select className="filter-select" value={sortBy} onChange={handleSortChange}>
            <option value="date">По дате</option>
            <option value="title">По названию</option>
            <option value="priority">По приоритету</option>
          </select>
        </div>
      </div>

      <div className="cards-count-row">
        <span className="cards-count">
          {filteredItems.length === items.length
            ? `${items.length} задач`
            : `${filteredItems.length} из ${items.length}`}
        </span>
      </div>

      <div className="cards-grid">
        {filteredItems.length === 0 ? (
          <div className="empty-state modern">
            <div className="empty-icon">📭</div>
            <h3>Задачи не найдены</h3>
            <p>{items.length === 0 ? 'Создайте первую задачу!' : 'Попробуйте изменить фильтры'}</p>
            {items.length === 0 && (
              <button className="cta-button" style={{ marginTop: '1rem' }} onClick={openAddModal}>
                ✨ Создать задачу
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              item={item}
              onDelete={deleteItem}
              onToggleStatus={toggleStatus}
              onToggleLike={toggleLike}
              onEdit={openEditModal}
            />
          ))
        )}
      </div>

      <Suspense fallback={null}>
        {isAddModalOpen && <AddItemModal onClose={closeAddModal} onAdd={addItem} />}
        {isEditModalOpen && editingItem && (
          <EditItemModal
            key={editingItem.id}
            item={editingItem}
            onClose={closeEditModal}
            onUpdate={updateItem}
          />
        )}
      </Suspense>
    </div>
  );
}

export default memo(Dashboard);
