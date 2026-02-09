import { describe, it, expect } from 'vitest';
import { sanitizeEventName } from '../../lib/formatters';

describe('sanitizeEventName', () => {
  it('removes angle brackets', () => {
    expect(sanitizeEventName('<script>alert</script>')).toBe('scriptalert/script');
  });

  it('removes double quotes', () => {
    expect(sanitizeEventName('event"name')).toBe('eventname');
  });

  it('removes single quotes', () => {
    expect(sanitizeEventName("event'name")).toBe('eventname');
  });

  it('removes ampersand', () => {
    expect(sanitizeEventName('a&b')).toBe('ab');
  });

  it('removes all XSS characters at once', () => {
    expect(sanitizeEventName('<img src="x" onerror=\'alert&1\'>')).toBe('img src=x onerror=alert1');
  });

  it('preserves normal event names', () => {
    expect(sanitizeEventName('view_item')).toBe('view_item');
    expect(sanitizeEventName('add_to_cart')).toBe('add_to_cart');
    expect(sanitizeEventName('purchase')).toBe('purchase');
  });

  it('handles empty string', () => {
    expect(sanitizeEventName('')).toBe('');
  });

  it('preserves unicode characters', () => {
    expect(sanitizeEventName('구매_완료')).toBe('구매_완료');
  });
});
