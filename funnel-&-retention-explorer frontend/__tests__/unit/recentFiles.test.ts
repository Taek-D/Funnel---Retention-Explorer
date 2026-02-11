import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadRecentFiles, saveRecentFile, removeRecentFile } from '../../lib/recentFiles';

const STORAGE_KEY = 'recentFiles';

let store: Record<string, string>;

beforeEach(() => {
  store = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  });
});

describe('loadRecentFiles', () => {
  it('returns empty array when no data', () => {
    expect(loadRecentFiles()).toEqual([]);
  });

  it('returns parsed data from localStorage', () => {
    const files = [{ fileName: 'test.csv', rowCount: 100, uploadedAt: '2025-01-01' }];
    store[STORAGE_KEY] = JSON.stringify(files);
    expect(loadRecentFiles()).toEqual(files);
  });

  it('returns empty array on invalid JSON', () => {
    store[STORAGE_KEY] = 'not-json{{{';
    expect(loadRecentFiles()).toEqual([]);
  });
});

describe('saveRecentFile', () => {
  it('adds file to front of list', () => {
    const file = { fileName: 'new.csv', rowCount: 50, uploadedAt: '2025-01-02' };
    saveRecentFile(file);
    const saved = JSON.parse(store[STORAGE_KEY]);
    expect(saved[0]).toEqual(file);
  });

  it('removes duplicate fileName before adding', () => {
    const existing = [
      { fileName: 'a.csv', rowCount: 10, uploadedAt: '2025-01-01' },
      { fileName: 'b.csv', rowCount: 20, uploadedAt: '2025-01-01' },
    ];
    store[STORAGE_KEY] = JSON.stringify(existing);

    saveRecentFile({ fileName: 'a.csv', rowCount: 100, uploadedAt: '2025-01-02' });
    const saved = JSON.parse(store[STORAGE_KEY]);
    expect(saved.length).toBe(2);
    expect(saved[0].fileName).toBe('a.csv');
    expect(saved[0].rowCount).toBe(100);
  });

  it('limits to RECENT_FILES_MAX_COUNT (5)', () => {
    const files = Array.from({ length: 6 }, (_, i) => ({
      fileName: `file${i}.csv`,
      rowCount: i * 10,
      uploadedAt: '2025-01-01',
    }));
    store[STORAGE_KEY] = JSON.stringify(files.slice(0, 5));

    saveRecentFile({ fileName: 'new.csv', rowCount: 999, uploadedAt: '2025-01-02' });
    const saved = JSON.parse(store[STORAGE_KEY]);
    expect(saved.length).toBe(5);
    expect(saved[0].fileName).toBe('new.csv');
  });
});

describe('removeRecentFile', () => {
  it('removes file at given index', () => {
    const files = [
      { fileName: 'a.csv', rowCount: 10, uploadedAt: '2025-01-01' },
      { fileName: 'b.csv', rowCount: 20, uploadedAt: '2025-01-01' },
    ];
    store[STORAGE_KEY] = JSON.stringify(files);

    const result = removeRecentFile(0);
    expect(result.length).toBe(1);
    expect(result[0].fileName).toBe('b.csv');
  });

  it('updates localStorage', () => {
    const files = [{ fileName: 'a.csv', rowCount: 10, uploadedAt: '2025-01-01' }];
    store[STORAGE_KEY] = JSON.stringify(files);

    removeRecentFile(0);
    const saved = JSON.parse(store[STORAGE_KEY]);
    expect(saved.length).toBe(0);
  });
});
