import React, { Suspense, lazy, memo, useCallback, useMemo, useState } from 'react';
import { useItems } from '@entities/dashboard-item/model/ItemsContext';
import { useFilterState } from '@features/task-filter/model/FilterContext';
import { useFilter } from '@shared/lib/useFilter';
import { useModal } from '@shared/lib/useModal';
import FilterableList from '@shared/ui/FilterableList';
import SkeletonGrid from '@shared/ui/Skeleton';
import Card from '@shared/ui/Card';
import EntityFormModal from '@features/entity-form/ui/EntityFormModal';
import { getEntityConfig } from '@entities/dashboard-item/model/entityConfigs';
import Modal from '@shared/ui/Modal';
import styles from '@shared/styles/mixedDashboard.module.css';

const EntityDetails = lazy(() => import('./EntityDetails.jsx'));

function FilterControl({ label, value, onChange, options, name }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <select name={name} value={value} onChange={onChange} className={styles.select}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EntityBoard({ entityType }) {
  const entityConfig = getEntityConfig(entityType);
  const { getCollection, loading, createItem, updateItem, deleteItem } = useItems();
  const { filtersByType, updateFilters, setSortBy, resetFilters } = useFilterState();

  const items = getCollection(entityType).map(entityConfig.normalizeItem);
  const filters = filtersByType[entityType];
  const filteredItems = useFilter(items, filters, filters.sortBy, entityType);
  const addModal = useModal(false);
  const editModal = useModal(false);
  const detailsModal = useModal(false);
  const [mode, setMode] = useState('add');
  const [selectedItem, setSelectedItem] = useState(null);

  const openCreate = useCallback(() => {
    setMode('add');
    setSelectedItem(null);
    addModal.open();
  }, [addModal]);

  const openEdit = useCallback((item) => {
    setMode('edit');
    setSelectedItem(item);
    editModal.open();
  }, [editModal]);

  const openDetails = useCallback((item) => {
    setSelectedItem(item);
    detailsModal.open();
  }, [detailsModal]);

  const closeForm = useCallback(() => {
    addModal.close();
    editModal.close();
    setSelectedItem(null);
  }, [addModal, editModal]);

  const handleSubmit = useCallback(async (payload) => {
    if (mode === 'edit' && selectedItem) {
      return updateItem(entityType, selectedItem.id, payload);
    }

    return createItem(entityType, payload);
  }, [createItem, entityType, mode, selectedItem, updateItem]);

  const handleDelete = useCallback(async (id) => {
    await deleteItem(entityType, id);
  }, [deleteItem, entityType]);

  const handleToggleStatus = useCallback(async (id) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    if (entityType === 'tasks') {
      await updateItem(entityType, id, {
        ...item,
        status: item.status === 'completed' ? 'active' : 'completed',
      });
      return;
    }

    if (entityType === 'recipes') {
      await updateItem(entityType, id, {
        ...item,
        status: item.status === 'published' ? 'draft' : 'published',
      });
      return;
    }

    await updateItem(entityType, id, {
      ...item,
      status: item.status === 'watched' ? 'watchlist' : 'watched',
    });
  }, [entityType, items, updateItem]);

  const handleFiltersChange = useCallback((event) => {
    const { name, value } = event.target;
    updateFilters(entityType, { [name]: value });
  }, [entityType, updateFilters]);

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((item) => item.status === 'completed' || item.status === 'published' || item.status === 'watched').length;
    const featured = entityType === 'movies'
      ? items.reduce((max, item) => Math.max(max, Number(item.rating) || 0), 0)
      : entityType === 'recipes'
        ? items.reduce((max, item) => Math.max(max, Number(item.prepTime) || 0), 0)
        : items.filter((item) => item.priority === 'high').length;

    return {
      total,
      completed,
      featured,
    };
  }, [entityType, items]);

  const emptyState = (
    <div className={styles.emptyState}>
      <p className={styles.emptyIcon}>◌</p>
      <h3 className={styles.emptyTitle}>{entityConfig.emptyTitle}</h3>
      <p className={styles.emptyText}>{entityConfig.emptyText}</p>
      <button type="button" className={styles.primaryButton} onClick={openCreate}>
        Add {entityConfig.singularLabel}
      </button>
    </div>
  );

  return (
    <section className={styles.pageSection}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.heroKicker}>Collection</p>
          <h2 className={styles.sectionTitle}>{entityConfig.label}</h2>
          <p className={styles.sectionLead}>{entityConfig.description}</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={openCreate}>
          Add {entityConfig.singularLabel}
        </button>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total</span>
          <strong className={styles.statValue}>{stats.total}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Completed</span>
          <strong className={styles.statValue}>{stats.completed}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>{entityType === 'movies' ? 'Top rating' : entityType === 'recipes' ? 'Longest prep' : 'High priority'}</span>
          <strong className={styles.statValue}>{stats.featured}</strong>
        </div>
      </div>

      <div className={styles.filtersPanel}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Search</span>
          <input
            type="search"
            name="search"
            value={filters.search}
            onChange={handleFiltersChange}
            placeholder={`Search ${entityConfig.label.toLowerCase()}`}
            className={styles.input}
          />
        </label>

        {Object.entries(entityConfig.filterFields).map(([name, options]) => (
          <FilterControl
            key={name}
            label={name[0].toUpperCase() + name.slice(1)}
            name={name}
            value={filters[name]}
            onChange={handleFiltersChange}
            options={options}
          />
        ))}

        <FilterControl
          label="Sort by"
          name="sortBy"
          value={filters.sortBy}
          onChange={(event) => setSortBy(entityType, event.target.value)}
          options={entityConfig.sortOptions}
        />

        <button type="button" className={styles.ghostButton} onClick={() => resetFilters(entityType)}>
          Reset
        </button>
      </div>

      {loading ? <SkeletonGrid count={6} /> : (
        <FilterableList
          items={filteredItems}
          emptyState={emptyState}
          renderItem={(item) => (
            <Card
              key={item.id}
              item={item}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onSelect={openDetails}
            >
              <Card.Header />
              <Card.Body>
                <p className={styles.cardText}>
                  {entityType === 'recipes' && item.ingredients ? `${item.ingredients.join(', ')}` : null}
                  {entityType === 'movies' && item.director ? `Directed by ${item.director}` : null}
                  {entityType === 'tasks' && item.dueDate ? `Due ${item.dueDate}` : null}
                </p>
              </Card.Body>
              <Card.Footer />
            </Card>
          )}
        />
      )}

      <EntityFormModal
        key={`${mode}-${selectedItem?.id || 'new'}`}
        isOpen={addModal.isOpen || editModal.isOpen}
        mode={mode}
        entityConfig={entityConfig}
        item={selectedItem}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <Modal
        isOpen={detailsModal.isOpen}
        onClose={detailsModal.close}
        title={`${entityConfig.singularLabel} details`}
      >
        {selectedItem ? (
          <Suspense fallback={<p className={styles.sectionLead}>Loading details...</p>}>
            <EntityDetails entityConfig={entityConfig} item={selectedItem} />
          </Suspense>
        ) : null}
      </Modal>
    </section>
  );
}

export default memo(EntityBoard);

