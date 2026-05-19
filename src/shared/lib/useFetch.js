import { useCallback, useState } from 'react';

// Универсальный async fetcher.
// execute() возвращает результат, а не только пишет в state — это позволяет
// вызывающему коду сразу принять решение (например, закрыть модалку при success),
// не дожидаясь следующего рендера.
//
// Поддерживаем два формата ответа от fetchFn:
//   { success: false, error } — наш бэкенд так возвращает ошибки бизнес-уровня
//   throw                    — сетевые/неожиданные ошибки
// В обоих случаях обнуляем data до initialData, чтобы UI не показал устаревшее.
export function useFetch(fetchFn, { initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchFn(...args);

      if (result?.success === false) {
        const nextError = result.error || 'Ошибка загрузки';
        setError(nextError);
        setData(initialData);
        return { success: false, error: nextError, data: initialData };
      }

      setData(result);
      return { success: true, data: result, error: null };
    } catch (err) {
      const nextError = err.message || 'Не удалось загрузить данные';
      setError(nextError);
      setData(initialData);
      return { success: false, error: nextError, data: initialData };
    } finally {
      setLoading(false);
    }
  }, [fetchFn, initialData]);

  return {
    data,
    loading,
    error,
    execute,
    setData, // отдаём наружу — нужен, если кто-то хочет обновить data оптимистично
  };
}

export default useFetch;
