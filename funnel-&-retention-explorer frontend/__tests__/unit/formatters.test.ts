import { describe, it, expect } from 'vitest';
import { formatTime, formatNum, formatPct, formatCurrency, formatDate, formatDateTime } from '../../lib/formatters';

describe('formatTime', () => {
  it('formats minutes under 60 as 분', () => {
    expect(formatTime(30)).toBe('30분');
    expect(formatTime(0)).toBe('0분');
    expect(formatTime(59)).toBe('59분');
  });

  it('formats minutes 60-1439 as 시간', () => {
    expect(formatTime(60)).toBe('1.0시간');
    expect(formatTime(90)).toBe('1.5시간');
    expect(formatTime(1439)).toBe('24.0시간');
  });

  it('formats minutes >= 1440 as 일', () => {
    expect(formatTime(1440)).toBe('1.0일');
    expect(formatTime(2880)).toBe('2.0일');
  });
});

describe('formatNum', () => {
  it('formats numbers with locale separators', () => {
    const result = formatNum(1000);
    // toLocaleString is locale-dependent, just check it's a string containing "1" and "000"
    expect(result).toContain('1');
    expect(result).toContain('000');
  });

  it('returns dash for null/undefined', () => {
    expect(formatNum(null)).toBe('-');
    expect(formatNum(undefined)).toBe('-');
  });

  it('formats zero', () => {
    expect(formatNum(0)).toBe('0');
  });
});

describe('formatPct', () => {
  it('formats percentage with 1 decimal', () => {
    expect(formatPct(50)).toBe('50.0%');
    expect(formatPct(99.99)).toBe('100.0%');
    expect(formatPct(33.333)).toBe('33.3%');
  });

  it('returns N/A for null/undefined', () => {
    expect(formatPct(null)).toBe('N/A');
    expect(formatPct(undefined)).toBe('N/A');
  });
});

describe('formatCurrency', () => {
  it('formats with dollar sign', () => {
    const result = formatCurrency(1000);
    expect(result).toMatch(/^\$/);
    expect(result).toContain('1');
  });

  it('returns N/A for null/undefined', () => {
    expect(formatCurrency(null)).toBe('N/A');
    expect(formatCurrency(undefined)).toBe('N/A');
  });
});

describe('formatDate', () => {
  it('formats a date in ko-KR locale', () => {
    const date = new Date('2025-03-15T00:00:00Z');
    const result = formatDate(date);
    expect(result).toContain('2025');
    expect(result).toContain('03') // month
    expect(result).toContain('15');
  });
});

describe('formatDateTime', () => {
  it('formats a datetime string in ko-KR locale', () => {
    const result = formatDateTime('2025-06-01T14:30:00Z');
    expect(result).toContain('2025');
  });
});
