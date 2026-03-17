import { useFetch } from './useFetch';

export function useServerData(fetchFn) {
  const { data, loading, error, execute, setData } = useFetch(fetchFn);

  return {
    data,
    loading,
    error,
    load: execute,
    setData,
  };
}
