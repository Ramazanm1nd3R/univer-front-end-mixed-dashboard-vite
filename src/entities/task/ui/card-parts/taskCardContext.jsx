import { createContext, useContext } from 'react';

export const TaskCardContext = createContext(null);

export function useTaskCard() {
  const context = useContext(TaskCardContext);

  if (!context) {
    throw new Error('TaskCard compound components must be used within TaskCard');
  }

  return context;
}
