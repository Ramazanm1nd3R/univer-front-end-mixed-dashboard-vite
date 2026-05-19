// JSON.parse без try/catch на месте.
// Зачем: ловили падения приложения, когда в localStorage оказывался
// невалидный JSON (например, после прерванной записи или ручной правки).
// Здесь же сразу учитываем пустые строки — JSON.parse('') кидает SyntaxError,
// что не очевидно.
export function safeParseJSON(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
