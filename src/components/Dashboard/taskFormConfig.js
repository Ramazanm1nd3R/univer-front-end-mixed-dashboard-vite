export const MAX_TITLE = 100;

export const priorityConfig = {
  low: { label: '🟢 Низкий' },
  medium: { label: '🟡 Средний' },
  high: { label: '🔴 Высокий' },
};

export const categoryOptions = [
  { value: 'work', label: '💼 Работа' },
  { value: 'personal', label: '👤 Личное' },
  { value: 'health', label: '💪 Здоровье' },
  { value: 'other', label: '📌 Другое' },
];

export function validateControlledTaskFields(data, touched = {}) {
  const nextErrors = {};

  if (touched.title) {
    const title = data.title.trim();
    if (!title) {
      nextErrors.title = 'Введите название задачи';
    } else if (title.length > MAX_TITLE) {
      nextErrors.title = `Максимум ${MAX_TITLE} символов`;
    }
  }

  return nextErrors;
}

export function validateScheduleFields(schedule, touched = {}) {
  const nextErrors = {};

  if ((touched.dueDate || touched.dueTime) && schedule.dueTime && !schedule.dueDate) {
    nextErrors.dueDate = 'Укажите дату, если задано время';
  }

  return nextErrors;
}

export function buildTaskPayload(values, schedule) {
  return {
    ...values,
    dueDate: schedule.dueDate,
    dueTime: schedule.dueTime,
  };
}
