import { useState, useCallback } from 'react';

export function useServerData(fetchFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn(...args);
      if (result?.success === false) {
        setError(result.error || 'Ошибка загрузки');
        setData(null);
      } else {
        setData(result);
      }
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  return { data, loading, error, load, setData };
}