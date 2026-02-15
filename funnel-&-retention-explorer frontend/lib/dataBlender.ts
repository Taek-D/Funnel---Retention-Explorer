import type { RawRow } from '../types';

export type BlendStrategy = 'union' | 'join';
export type JoinKey = 'userid' | 'date';

export interface BlendSource {
  name: string;
  data: RawRow[];
  headers: string[];
}

export interface BlendResult {
  data: RawRow[];
  headers: string[];
  totalRows: number;
  sourceCounts: { name: string; rows: number }[];
}

export function blendDatasets(
  sources: BlendSource[],
  strategy: BlendStrategy,
  joinKey?: JoinKey,
): BlendResult {
  if (sources.length === 0) {
    return { data: [], headers: [], totalRows: 0, sourceCounts: [] };
  }

  if (sources.length === 1) {
    return {
      data: sources[0].data,
      headers: sources[0].headers,
      totalRows: sources[0].data.length,
      sourceCounts: [{ name: sources[0].name, rows: sources[0].data.length }],
    };
  }

  const sourceCounts = sources.map(s => ({ name: s.name, rows: s.data.length }));

  if (strategy === 'union') {
    return blendUnion(sources, sourceCounts);
  }

  return blendJoin(sources, joinKey || 'userid', sourceCounts);
}

function blendUnion(
  sources: BlendSource[],
  sourceCounts: { name: string; rows: number }[],
): BlendResult {
  const allHeaders = new Set<string>();
  sources.forEach(s => s.headers.forEach(h => allHeaders.add(h)));
  const headers = [...allHeaders];

  const data: RawRow[] = [];
  for (const source of sources) {
    for (const row of source.data) {
      const merged: RawRow = { _source: source.name };
      for (const h of headers) {
        merged[h] = row[h] ?? '';
      }
      data.push(merged);
    }
  }

  return { data, headers: ['_source', ...headers], totalRows: data.length, sourceCounts };
}

function blendJoin(
  sources: BlendSource[],
  joinKey: JoinKey,
  sourceCounts: { name: string; rows: number }[],
): BlendResult {
  const keyField = joinKey === 'userid' ? findField(sources[0].headers, ['user_id', 'userid', 'user']) :
    findField(sources[0].headers, ['date', 'timestamp', 'created_at']);

  if (!keyField) {
    return blendUnion(sources, sourceCounts);
  }

  const baseMap = new Map<string, RawRow>();
  for (const row of sources[0].data) {
    const key = String(row[keyField] || '');
    if (key) baseMap.set(key, { ...row });
  }

  for (let i = 1; i < sources.length; i++) {
    const src = sources[i];
    const srcKey = findField(src.headers, [keyField]) || keyField;

    for (const row of src.data) {
      const key = String(row[srcKey] || '');
      if (key && baseMap.has(key)) {
        const existing = baseMap.get(key)!;
        for (const h of src.headers) {
          if (!(h in existing) || existing[h] === '') {
            existing[h] = row[h];
          }
        }
      }
    }
  }

  const allHeaders = new Set<string>();
  sources.forEach(s => s.headers.forEach(h => allHeaders.add(h)));
  const headers = [...allHeaders];

  const data = [...baseMap.values()];
  return { data, headers, totalRows: data.length, sourceCounts };
}

function findField(headers: string[], candidates: string[]): string | null {
  const lower = headers.map(h => h.toLowerCase());
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase());
    if (idx >= 0) return headers[idx];
  }
  return null;
}
