import { useCallback, useMemo, useState } from 'react';

// Хук управления формой. Идея — отделить состояние и валидацию
// от конкретных <input/>, чтобы UI оставался "тупым".
//
// Контракт validate(values, touched) -> { fieldName: errorMessage, ... }
// touched позволяет валидатору показывать ошибки только тех полей,
// которые пользователь уже трогал — иначе при первом открытии формы
// сразу высветятся все required-ошибки.

// При submit'е помечаем touched = true для ВСЕХ полей,
// чтобы валидатор показал ошибки и тех полей, которых пользователь не касался.
function getTouchedMap(initialValues) {
  return Object.keys(initialValues).reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {});
}

export function useForm({ initialValues, validate = () => ({}) }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const reset = useCallback((nextValues = initialValues) => {
    setValues(nextValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const runValidation = useCallback((nextValues, nextTouched) => {
    return validate(nextValues, nextTouched || touched);
  }, [touched, validate]);

  const setValue = useCallback((name, value) => {
    setValues((prev) => {
      const nextValues = { ...prev, [name]: value };
      setErrors(runValidation(nextValues, touched));
      return nextValues;
    });
  }, [runValidation, touched]);

  // handleChange принимает либо стандартный SyntheticEvent (из <input onChange>),
  // либо пару (name, value) — это удобно для кастомных контролов вроде date/time-пикеров,
  // которые отдают значение не через event.target.
  const handleChange = useCallback((eventOrName, valueOverride) => {
    if (typeof eventOrName === 'string') {
      setValue(eventOrName, valueOverride);
      return;
    }

    const { name, value, type, checked } = eventOrName.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setValue(name, nextValue);
  }, [setValue]);

  const handleBlur = useCallback((eventOrName) => {
    const name = typeof eventOrName === 'string' ? eventOrName : eventOrName.target.name;

    setTouched((prev) => {
      const nextTouched = { ...prev, [name]: true };
      setErrors(runValidation(values, nextTouched));
      return nextTouched;
    });
  }, [runValidation, values]);

  // handleSubmit возвращает обёртку — её удобно повесить прямо на <form onSubmit>.
  // Перед вызовом пользовательского submitFn гоним финальную валидацию по ВСЕМ полям,
  // и если есть ошибки — submitFn не вызывается, форма остаётся открытой.
  const handleSubmit = useCallback((submitFn) => {
    return async (event) => {
      event.preventDefault();
      const submitTouched = getTouchedMap(values);
      const nextErrors = runValidation(values, submitTouched);

      setTouched(submitTouched);
      setErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        return false;
      }

      return submitFn(values);
    };
  }, [runValidation, values]);

  return useMemo(() => ({
    values,
    setValues,
    errors,
    setErrors,
    touched,
    setTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    reset,
  }), [errors, handleBlur, handleChange, handleSubmit, reset, touched, values]);
}

export default useForm;
