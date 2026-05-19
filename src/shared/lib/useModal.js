import { useCallback, useState } from 'react';

// Простой boolean-стейт с именованными методами.
// Кажется тривиально, но open/close намного читабельнее в коде,
// чем setIsModalOpen(true)/setIsModalOpen(false) везде по проекту.
export function useModal(initialValue = false) {
  const [isOpen, setIsOpen] = useState(initialValue);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}

export default useModal;
