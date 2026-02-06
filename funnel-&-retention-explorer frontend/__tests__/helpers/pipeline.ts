import { parseCSVText } from '../../lib/csvParser';
import { processData, autoDetectColumns, detectDatasetType } from '../../lib/dataProcessor';
import type { ProcessedEvent, ColumnMapping, DatasetType, RawRow } from '../../types';

export interface PipelineResult {
  rawData: RawRow[];
  headers: string[];
  mapping: ColumnMapping;
  processedData: ProcessedEvent[];
  detectedType: DatasetType;
}

/**
 * Shared helper: parses CSV text → auto-detects columns → processes data → detects type.
 */
export async function parseAndProcess(csvText: string): Promise<PipelineResult> {
  const { data: rawData, headers } = await parseCSVText(csvText);
  const mapping = autoDetectColumns(headers);
  const processedData = processData(rawData, mapping);
  const detectedType = detectDatasetType(processedData);
  return { rawData, headers, mapping, processedData, detectedType };
}
