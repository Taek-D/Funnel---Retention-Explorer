import type { RawRow } from '../../types';

export function parseJSON(text: string): { data: RawRow[]; headers: string[] } {
  const parsed = JSON.parse(text);

  const rows: Record<string, unknown>[] = Array.isArray(parsed)
    ? parsed
    : parsed.data || parsed.rows || parsed.events || [];

  if (rows.length === 0) throw new Error('No data found in JSON');

  const flatRows: RawRow[] = rows.map(row => {
    const flat: RawRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
          flat[`${key}.${subKey}`] = String(subValue ?? '');
        }
      } else {
        flat[key] = String(value ?? '');
      }
    }
    return flat;
  });

  const headers = [...new Set(flatRows.flatMap(row => Object.keys(row)))];
  return { data: flatRows, headers };
}
