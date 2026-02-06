import fs from 'fs';
import path from 'path';

/**
 * Loads the real 3000-row ecommerce sample CSV from the project root.
 */
export function loadEcommerceSampleCSV(): string {
  const csvPath = path.resolve(__dirname, '../../../샘플 데이터/sample_ecommerce_events_3000.csv');
  return fs.readFileSync(csvPath, 'utf-8');
}
