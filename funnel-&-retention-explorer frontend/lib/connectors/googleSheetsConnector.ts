import type { RawRow } from '../../types';
import { parseCSVText } from '../csvParser';

const SHEETS_URL_PATTERNS = [
  /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
];

export function extractSheetId(url: string): string | null {
  for (const pattern of SHEETS_URL_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function fetchGoogleSheet(
  sheetId: string,
  gid: string = '0'
): Promise<{ data: RawRow[]; headers: string[] }> {
  const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sheets-proxy`;
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetId, gid }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch sheet: ${error}`);
  }

  const csvText = await response.text();
  const result = await parseCSVText(csvText);
  return { data: result.data, headers: result.headers };
}
