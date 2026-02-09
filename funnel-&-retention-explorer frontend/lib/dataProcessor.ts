import type { RawRow, ProcessedEvent, ColumnMapping, DatasetType, DataQualityReport } from '../types';
import { EVENT_PATTERNS, AUTO_COLUMN_MAPPING } from './constants';
import { detectColumnsByValues } from './columnValueDetector';

export function processData(rawData: RawRow[], mapping: ColumnMapping): ProcessedEvent[] {
  const processed = rawData
    .map(row => {
      const event: ProcessedEvent = {
        timestamp: new Date(row[mapping.timestamp || '']),
        userId: row[mapping.userid || ''],
        eventName: row[mapping.eventname || '']
      };

      if (mapping.sessionid) {
        event.sessionId = row[mapping.sessionid];
      }
      if (mapping.platform) {
        event.platform = row[mapping.platform];
      }
      if (mapping.channel) {
        event.channel = row[mapping.channel];
      }

      return event;
    })
    .filter(row => row.timestamp && !isNaN(row.timestamp.getTime()) && row.userId && row.eventName);

  processed.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return processed;
}

export function detectDatasetType(processedData: ProcessedEvent[]): DatasetType {
  if (!processedData || processedData.length === 0) return null;

  const uniqueEvents = [...new Set(processedData.map(e => e.eventName))];
  const eventNames = uniqueEvents.map(e => String(e).toLowerCase());

  let ecommerceScore = 0;
  let subscriptionScore = 0;

  eventNames.forEach(eventName => {
    EVENT_PATTERNS.ecommerce.forEach(pattern => {
      if (eventName.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(eventName)) {
        ecommerceScore++;
      }
    });

    EVENT_PATTERNS.subscription.forEach(pattern => {
      if (eventName.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(eventName)) {
        subscriptionScore++;
      }
    });
  });

  if (ecommerceScore > subscriptionScore && ecommerceScore >= 2) return 'ecommerce';
  if (subscriptionScore > ecommerceScore && subscriptionScore >= 2) return 'subscription';
  return null;
}

export function autoDetectColumns(headers: string[], rawData?: RawRow[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  // Phase 1: Name-based matching
  (Object.entries(AUTO_COLUMN_MAPPING) as [keyof ColumnMapping, string[]][]).forEach(([key, possibleNames]) => {
    for (const name of possibleNames) {
      const match = headers.find(h => h.toLowerCase() === name.toLowerCase());
      if (match) {
        mapping[key] = match;
        break;
      }
    }
  });

  // Phase 2: Value-based detection for unmapped columns
  const allKeys: (keyof ColumnMapping)[] = ['timestamp', 'userid', 'eventname', 'sessionid', 'platform', 'channel'];
  const hasUnmapped = allKeys.some(k => !mapping[k]);

  if (hasUnmapped && rawData && rawData.length > 0) {
    return detectColumnsByValues(headers, rawData, mapping);
  }

  return mapping;
}

export function getUniqueEvents(processedData: ProcessedEvent[]): string[] {
  return [...new Set(processedData.map(e => e.eventName))].sort();
}

export function generateDataQualityReport(rawData: RawRow[], processedData: ProcessedEvent[]): DataQualityReport {
  const rawCount = rawData.length;
  const validCount = processedData.length;
  const failedCount = rawCount - validCount;

  const uniqueUsers = new Set(processedData.map(r => r.userId)).size;

  const timestamps = processedData.map(r => r.timestamp).filter(t => t);
  const minDate = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : null;
  const maxDate = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : null;

  const platformMissing = processedData.filter(r => !r.platform).length;
  const channelMissing = processedData.filter(r => !r.channel).length;
  const platformMissingRate = validCount > 0 ? (platformMissing / validCount * 100).toFixed(1) : '0';
  const channelMissingRate = validCount > 0 ? (channelMissing / validCount * 100).toFixed(1) : '0';

  const eventCounts: Record<string, number> = {};
  processedData.forEach(r => {
    eventCounts[r.eventName] = (eventCounts[r.eventName] || 0) + 1;
  });
  const topEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({
      name,
      count,
      percentage: validCount > 0 ? (count / validCount * 100).toFixed(2) : '0'
    }));

  return {
    totalRows: rawCount,
    validRows: validCount,
    failedRows: failedCount,
    uniqueUsers,
    minDate,
    maxDate,
    platformMissingRate,
    channelMissingRate,
    topEvents
  };
}

// Helper functions for subscription data checks
export function hasCol(headers: string[], colName: string): boolean {
  return headers.some(h => h.toLowerCase() === colName.toLowerCase());
}

export function getColValue(row: RawRow, colName: string): string | null {
  if (!row) return null;
  const key = Object.keys(row).find(k => k.toLowerCase() === colName.toLowerCase());
  return key ? row[key] : null;
}

export function getUniqueColValues(rawData: RawRow[], headers: string[], colName: string): string[] {
  if (!hasCol(headers, colName)) return [];
  return [...new Set(
    rawData.map(row => getColValue(row, colName)).filter((v): v is string => v != null && v !== '')
  )];
}
