import { useCallback, useMemo, useState } from 'react';

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
