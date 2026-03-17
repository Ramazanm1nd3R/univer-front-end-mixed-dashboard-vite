import { act, renderHook, waitFor } from '@testing-library/react';
import { useFetch } from '../useFetch';

describe('useFetch', () => {
  it('loads data successfully', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      success: true,
      analytics: { totalTasks: 12 },
    });

    const { result } = renderHook(() => useFetch(fetchFn));

    let response;
    await act(async () => {
      response = await result.current.execute('user-1');
    });

    expect(fetchFn).toHaveBeenCalledWith('user-1');
    expect(response.success).toBe(true);
    expect(result.current.data).toEqual({
      success: true,
      analytics: { totalTasks: 12 },
    });
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('stores backend errors when request returns success false', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      success: false,
      error: 'Не удалось загрузить аналитику',
    });

    const { result } = renderHook(() => useFetch(fetchFn, { initialData: [] }));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe('Не удалось загрузить аналитику');
    expect(result.current.loading).toBe(false);
  });

  it('stores thrown errors when request rejects', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFetch(fetchFn, { initialData: null }));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBe(null);
  });
});
