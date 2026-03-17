import { act, renderHook } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm', () => {
  const initialValues = {
    title: '',
    category: 'other',
  };

  const validate = (values, touched = {}) => {
    const errors = {};

    if (touched.title && values.title.trim().length < 3) {
      errors.title = 'Название слишком короткое';
    }

    return errors;
  };

  it('updates field values through handleChange', () => {
    const { result } = renderHook(() => useForm({ initialValues, validate }));

    act(() => {
      result.current.handleChange({
        target: {
          name: 'title',
          value: 'TaskFlow',
          type: 'text',
        },
      });
    });

    expect(result.current.values.title).toBe('TaskFlow');
  });

  it('tracks touched fields and validates on blur', () => {
    const { result } = renderHook(() => useForm({ initialValues, validate }));

    act(() => {
      result.current.handleChange({
        target: {
          name: 'title',
          value: 'Hi',
          type: 'text',
        },
      });
      result.current.handleBlur({
        target: {
          name: 'title',
        },
      });
    });

    expect(result.current.touched.title).toBe(true);
    expect(result.current.errors.title).toBe('Название слишком короткое');
  });

  it('prevents submit when validation fails', async () => {
    const submitSpy = vi.fn();
    const { result } = renderHook(() => useForm({ initialValues, validate }));

    let submitResult;

    await act(async () => {
      submitResult = await result.current.handleSubmit(submitSpy)({
        preventDefault: vi.fn(),
      });
    });

    expect(submitResult).toBe(false);
    expect(submitSpy).not.toHaveBeenCalled();
    expect(result.current.errors.title).toBe('Название слишком короткое');
  });

  it('submits valid values and resets correctly', async () => {
    const submitSpy = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useForm({ initialValues, validate }));

    act(() => {
      result.current.handleChange({
        target: {
          name: 'title',
          value: 'Valid title',
          type: 'text',
        },
      });
      result.current.handleBlur({
        target: {
          name: 'title',
        },
      });
    });

    await act(async () => {
      await result.current.handleSubmit(submitSpy)({
        preventDefault: vi.fn(),
      });
    });

    expect(submitSpy).toHaveBeenCalledWith({
      title: 'Valid title',
      category: 'other',
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });
});
