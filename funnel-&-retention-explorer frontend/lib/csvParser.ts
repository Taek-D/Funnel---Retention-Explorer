import Papa from 'papaparse';
import type { RawRow } from '../types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ROW_COUNT = 100_000;

export interface ParseResult {
  data: RawRow[];
  headers: string[];
  errors: Papa.ParseError[];
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`파일 크기가 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB). 최대 50MB까지 지원합니다.`));
      return;
    }

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
        const data = results.data as RawRow[];
        if (data.length > MAX_ROW_COUNT) {
          reject(new Error(`행 수가 너무 많습니다 (${data.length.toLocaleString()}행). 최대 ${MAX_ROW_COUNT.toLocaleString()}행까지 지원합니다.`));
          return;
        }
        resolve({
          data,
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
