import type { RawRow, ExportFormat, ColumnMapping } from '../../types';

const FORMAT_SIGNATURES: Record<ExportFormat, string[]> = {
  ga4: ['event_name', 'user_pseudo_id', 'event_timestamp', 'event_date'],
  mixpanel: ['event', 'distinct_id', 'time', '$browser'],
  amplitude: ['event_type', 'user_id', 'event_time', 'amplitude_id'],
  unknown: [],
};

const PRESET_MAPPINGS: Record<Exclude<ExportFormat, 'unknown'>, ColumnMapping> = {
  ga4: {
    timestamp: 'event_timestamp',
    userid: 'user_pseudo_id',
    eventname: 'event_name',
    platform: 'platform',
    channel: 'traffic_source.medium',
  },
  mixpanel: {
    timestamp: 'time',
    userid: 'distinct_id',
    eventname: 'event',
    platform: '$os',
    channel: '$referring_domain',
  },
  amplitude: {
    timestamp: 'event_time',
    userid: 'user_id',
    eventname: 'event_type',
    platform: 'platform',
    channel: 'user_properties.$initial_utm_source',
  },
};

export function detectExportFormat(headers: string[]): ExportFormat {
  const headerSet = new Set(headers.map(h => h.toLowerCase()));

  for (const [format, signatures] of Object.entries(FORMAT_SIGNATURES)) {
    if (format === 'unknown') continue;
    const matchCount = signatures.filter(sig => headerSet.has(sig.toLowerCase())).length;
    if (matchCount >= 2) return format as ExportFormat;
  }

  return 'unknown';
}

export function getPresetMapping(format: ExportFormat): ColumnMapping | null {
  if (format === 'unknown') return null;
  return PRESET_MAPPINGS[format];
}

export function normalizeTimestamps(data: RawRow[], format: ExportFormat): RawRow[] {
  if (format === 'ga4') {
    return data.map(row => {
      const ts = row['event_timestamp'];
      if (ts && /^\d{16}$/.test(ts)) {
        row['event_timestamp'] = new Date(Number(ts) / 1000).toISOString();
      }
      return row;
    });
  }

  if (format === 'mixpanel') {
    return data.map(row => {
      const ts = row['time'];
      if (ts && /^\d{10}$/.test(ts)) {
        row['time'] = new Date(Number(ts) * 1000).toISOString();
      }
      return row;
    });
  }

  return data;
}
