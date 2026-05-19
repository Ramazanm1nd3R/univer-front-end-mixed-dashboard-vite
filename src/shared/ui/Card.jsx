import React, { createContext, memo, useCallback, useContext, useMemo } from 'react';
import styles from '@shared/styles/mixedDashboard.module.css';

// Generic compound-card для entity-страниц (tasks/recipes/movies).
// Доменный TaskCard для дашборда задач — в @entities/task/ui/Card.
//
// Pattern: вместо передачи кучи props в Card.Header/Body/Footer (prop-drilling)
// храним item и handlers в локальном контексте, слоты сами вытаскивают что им нужно.
// Снаружи это выглядит так:
//   <Card item={x} onEdit={...} onDelete={...}>
//     <Card.Header />
//     <Card.Body>...что-то кастомное...</Card.Body>
//     <Card.Footer />
//   </Card>
const CardContext = createContext(null);

// Маленький guard: если кто-то использует <Card.Header /> сам по себе,
// сразу понятно из ошибки в чём дело.
function useCardContext() {
  const value = useContext(CardContext);
  if (!value) {
    throw new Error('Card compound components must be used inside <Card />');
  }
  return value;
}

function formatMeta(item) {
  return item.description || item.notes || 'No description provided.';
}

function Card({ item, children, onEdit, onDelete, onToggleStatus, onSelect, className = '' }) {
  const handleEdit = useCallback(() => onEdit?.(item), [item, onEdit]);
  const handleDelete = useCallback(() => onDelete?.(item.id), [item.id, onDelete]);
  const handleToggle = useCallback(() => onToggleStatus?.(item.id), [item.id, onToggleStatus]);
  const handleSelect = useCallback(() => onSelect?.(item), [item, onSelect]);

  const value = useMemo(() => ({
    item,
    handleEdit,
    handleDelete,
    handleToggle,
    handleSelect,
  }), [handleDelete, handleEdit, handleSelect, handleToggle, item]);

  return (
    <CardContext.Provider value={value}>
      <article className={`${styles.card} ${className}`.trim()} onClick={onSelect ? handleSelect : undefined}>
        {children || (
          <>
            <Card.Header />
            <Card.Body />
            <Card.Footer />
          </>
        )}
      </article>
    </CardContext.Provider>
  );
}

function Header({ badge, subtitle }) {
  const { item } = useCardContext();
  const headerBadge = badge || item.status;

  return (
    <header className={styles.cardHeader}>
      <div>
        <p className={styles.cardKicker}>{item.category || item.cuisine || item.genre || item.year || 'Overview'}</p>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardSubtitle}>{subtitle || item.description}</p>
      </div>
      <span className={styles.cardBadge}>{headerBadge}</span>
    </header>
  );
}

function Body({ children }) {
  const { item } = useCardContext();

  return (
    <div className={styles.cardBody}>
      {children || (
        <>
          <p className={styles.cardText}>{formatMeta(item)}</p>
          <div className={styles.cardMeta}>
            {'priority' in item ? <span>{item.priority}</span> : null}
            {'difficulty' in item ? <span>{item.difficulty}</span> : null}
            {'rating' in item ? <span>{item.rating} / 5</span> : null}
          </div>
        </>
      )}
    </div>
  );
}

function Footer({ children }) {
  const { handleEdit, handleDelete, handleToggle, item } = useCardContext();

  return (
    <footer className={styles.cardFooter}>
      {children || (
        <>
          {handleToggle ? (
            <button
              type="button"
              className={styles.ghostButton}
              onClick={(event) => {
                event.stopPropagation();
                handleToggle();
              }}
            >
              {item.status === 'completed' ? 'Reopen' : 'Mark done'}
            </button>
          ) : null}
          {handleEdit ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={(event) => {
                event.stopPropagation();
                handleEdit();
              }}
            >
              Edit
            </button>
          ) : null}
          {handleDelete ? (
            <button
              type="button"
              className={styles.destructiveButton}
              onClick={(event) => {
                event.stopPropagation();
                handleDelete();
              }}
            >
              Delete
            </button>
          ) : null}
        </>
      )}
    </footer>
  );
}

// memo() — карточки в сетке могут перерисовываться часто,
// а большинство пропсов стабильны (item.id), так что выигрыш заметный.
const MemoizedCard = memo(Card);
MemoizedCard.Header = Header;
MemoizedCard.Body = Body;
MemoizedCard.Footer = Footer;

export default MemoizedCard;
