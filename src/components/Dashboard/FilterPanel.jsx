import React from 'react';
import '../../styles/Dashboard.css';

function FilterPanel({ filters, setFilters, sortBy, setSortBy }) {
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <div className="filter-panel">
      <div className="filter-group">
        <label htmlFor="category-filter">Категория:</label>
        <select
          id="category-filter"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="all">Все</option>
          <option value="work">Работа</option>
          <option value="personal">Личное</option>
          <option value="health">Здоровье</option>
          <option value="other">Другое</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status-filter">Статус:</label>
        <select
          id="status-filter"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="all">Все</option>
          <option value="active">Активные</option>
          <option value="completed">Завершенные</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="sort-by">Сортировка:</label>
        <select
          id="sort-by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">По дате создания</option>
          <option value="title">По названию</option>
          <option value="priority">По приоритету</option>
          <option value="dueDate">По сроку выполнения</option>
          <option value="likes">По лайкам</option>
        </select>
      </div>

      <div className="filter-group search-group">
        <label htmlFor="search-filter">Поиск:</label>
        <input
          id="search-filter"
          type="text"
          placeholder="Поиск по названию..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>
    </div>
  );
}

export default FilterPanel;