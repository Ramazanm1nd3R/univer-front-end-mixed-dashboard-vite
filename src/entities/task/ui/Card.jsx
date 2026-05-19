import React, {
  Suspense,
  lazy,
  memo,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { TaskCardContext } from './card-parts/taskCardContext.jsx';

// Compound TaskCard для дашборда задач. В отличие от shared/ui/Card —
// специфичен под Task: знает про dueDate, overdue, лайки, режим details.
//
// Слоты (Header/Body/Footer/DetailsModal) вынесены в отдельные чанки
// и подгружаются лениво — на странице может быть 50+ карточек,
// а DetailsModal вообще нужен только при клике на конкретную карточку.
const TaskCardHeader = lazy(() => import('./card-parts/TaskCardHeader.jsx'));
const TaskCardBody = lazy(() => import('./card-parts/TaskCardBody.jsx'));
const TaskCardFooter = lazy(() => import('./card-parts/TaskCardFooter.jsx'));
const TaskCardDetailsModal = lazy(() => import('./card-parts/TaskCardDetailsModal.jsx'));

function formatDueDate(dueDate) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isNaN(d)) return null;
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function CompoundTaskCard({ item, onDelete, onToggleStatus, onToggleLike, onEdit, children }) {
  const isCompleted = item.status === 'completed';
  const dueDate = item.dueDate ? new Date(item.dueDate) : null;
  // Просроченная — есть дедлайн, в прошлом, и задача не завершена.
  // Завершённые задачи не считаем overdue, даже если дедлайн давно прошёл.
  const isOverdue = dueDate && !isCompleted && dueDate < new Date();
  const formattedDue = formatDueDate(item.dueDate);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const cardDate = item.date
    ? new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '—';

  const openDetails = useCallback(() => setIsDetailsOpen(true), []);
  const closeDetails = useCallback(() => setIsDetailsOpen(false), []);

  const handleDelete = useCallback(() => onDelete(item.id), [item.id, onDelete]);
  const handleToggleStatus = useCallback(() => onToggleStatus(item.id), [item.id, onToggleStatus]);
  const handleLike = useCallback(() => onToggleLike(item.id), [item.id, onToggleLike]);
  const handleEdit = useCallback(() => {
    closeDetails();
    onEdit(item);
  }, [closeDetails, item, onEdit]);

  const contextValue = useMemo(() => ({
    item,
    isCompleted,
    isOverdue,
    formattedDue,
    cardDate,
    isDetailsOpen,
    openDetails,
    closeDetails,
    handleDelete,
    handleToggleStatus,
    handleLike,
    handleEdit,
  }), [
    item,
    isCompleted,
    isOverdue,
    formattedDue,
    cardDate,
    isDetailsOpen,
    openDetails,
    closeDetails,
    handleDelete,
    handleToggleStatus,
    handleLike,
    handleEdit,
  ]);

  const content = children || (
    <>
      <CompoundTaskCard.Header />
      <CompoundTaskCard.Body />
      <CompoundTaskCard.Footer />
    </>
  );

  return (
    <TaskCardContext.Provider value={contextValue}>
      <div className={`card${isCompleted ? ' completed' : ''}${isOverdue ? ' overdue' : ''}`}>
        <Suspense fallback={null}>
          {content}
        </Suspense>
      </div>

      <Suspense fallback={null}>
        {isDetailsOpen && <TaskCardDetailsModal />}
      </Suspense>
    </TaskCardContext.Provider>
  );
}

CompoundTaskCard.Header = function TaskCardHeaderSlot() {
  return <TaskCardHeader />;
};

CompoundTaskCard.Body = function TaskCardBodySlot() {
  return <TaskCardBody />;
};

CompoundTaskCard.Footer = function TaskCardFooterSlot() {
  return <TaskCardFooter />;
};

// memo() для оптимизации сетки карточек — без него каждое обновление
// фильтра в DashboardUI перерисовывало бы все карточки, не только изменившиеся.
const MemoizedCompoundTaskCard = memo(CompoundTaskCard);

// Слоты надо приклеить обратно к memo-обёртке, иначе <Card.Header /> сломается.
MemoizedCompoundTaskCard.Header = CompoundTaskCard.Header;
MemoizedCompoundTaskCard.Body = CompoundTaskCard.Body;
MemoizedCompoundTaskCard.Footer = CompoundTaskCard.Footer;

export default MemoizedCompoundTaskCard;
