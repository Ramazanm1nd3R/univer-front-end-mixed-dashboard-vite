import { useCallback, useState } from 'react';

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
    setData,
  };
}

export default useFetch;
