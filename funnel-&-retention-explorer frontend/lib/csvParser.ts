import Papa from 'papaparse';
import type { RawRow } from '../types';

export interface ParseResult {
  data: RawRow[];
  headers: string[];
  errors: Papa.ParseError[];
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      parseCSVText(csvText).then(resolve).catch(reject);
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file);
  });
}

export function parseCSVText(csvText: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          data: results.data as RawRow[],
          headers: results.meta.fields || [],
          errors: results.errors
        });
      },
      error: (error: Error) => {
        reject(new Error('CSV 파싱 오류: ' + error.message));
      }
    });
  });
}

export function getCSVTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file);
  });
}
