/* eslint-env vitest */
import { safeParseJSON } from '@shared/lib/safeParseJSON';

describe('safeParseJSON', () => {
  it('parses valid JSON strings', () => {
    expect(safeParseJSON('{"a":1}')).toEqual({ a: 1 });
    expect(safeParseJSON('[1,2,3]')).toEqual([1, 2, 3]);
    expect(safeParseJSON('"hello"')).toBe('hello');
  });

  it('returns fallback for invalid JSON', () => {
    expect(safeParseJSON('{not json}')).toBeNull();
    expect(safeParseJSON('{broken', {})).toEqual({});
    expect(safeParseJSON('undefined', 'default')).toBe('default');
  });

  it('returns fallback for null, undefined or empty string', () => {
    expect(safeParseJSON(null, 'fb')).toBe('fb');
    expect(safeParseJSON(undefined, 'fb')).toBe('fb');
    expect(safeParseJSON('', 'fb')).toBe('fb');
  });

  it('default fallback is null', () => {
    expect(safeParseJSON('garbage')).toBeNull();
  });
});
