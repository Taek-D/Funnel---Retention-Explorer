import { describe, it, expect } from 'vitest';
import { arrayToCSV } from '../../lib/exportUtils';

describe('arrayToCSV', () => {
  it('generates CSV with BOM prefix', () => {
    const csv = arrayToCSV(['a', 'b'], [[1, 2]]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });

  it('produces correct header and data rows', () => {
    const csv = arrayToCSV(['Name', 'Age'], [['Alice', 30], ['Bob', 25]]);
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[0]).toBe('Name,Age');
    expect(lines[1]).toBe('Alice,30');
    expect(lines[2]).toBe('Bob,25');
  });

  it('escapes values containing commas', () => {
    const csv = arrayToCSV(['col'], [['hello, world']]);
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[1]).toBe('"hello, world"');
  });

  it('escapes values containing double quotes', () => {
    const csv = arrayToCSV(['col'], [['say "hi"']]);
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[1]).toBe('"say ""hi"""');
  });

  it('escapes values containing newlines', () => {
    const csv = arrayToCSV(['col'], [['line1\nline2']]);
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[1]).toBe('"line1\nline2"');
  });

  it('handles empty rows array', () => {
    const csv = arrayToCSV(['a', 'b'], []);
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('a,b');
  });

  it('handles numeric values', () => {
    const csv = arrayToCSV(['count'], [[0], [100], [-5]]);
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[1]).toBe('0');
    expect(lines[2]).toBe('100');
    expect(lines[3]).toBe('-5');
  });
});
