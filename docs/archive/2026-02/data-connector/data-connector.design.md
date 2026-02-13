# Data Connector — Design

> **Feature**: data-connector
> **Plan**: [data-connector.plan.md](../../01-plan/features/data-connector.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture

```
DataImport Page
  └─ Source Selector (CSV | JSON | Google Sheets | GA4 | Mixpanel | Amplitude)
       │
       ├─ CSV: existing parseCSV flow (unchanged)
       ├─ JSON: parseJSON → RawRow[]
       ├─ Google Sheets: URL → Edge Function proxy → CSV text → parseCSVText → RawRow[]
       └─ Analytics Exports: CSV/JSON → detectExportFormat → applyPresetMapping → RawRow[]
                                                                          │
                                                                          ▼
                                                              autoDetectColumns → ColumnMapping
                                                                          │
                                                                          ▼
                                                              processData → ProcessedEvent[]
                                                              (existing pipeline, unchanged)
```

## 2. Implementation Tasks

### DC-1: Connector Types & Registry (`types/index.ts` + `lib/connectors/index.ts`)

Add to `types/index.ts`:

```typescript
// ===== Data Connectors =====

export type ConnectorType = 'csv' | 'json' | 'google-sheets' | 'ga4-export' | 'mixpanel-export' | 'amplitude-export';

export type ExportFormat = 'ga4' | 'mixpanel' | 'amplitude' | 'unknown';

export interface ConnectorConfig {
  type: ConnectorType;
  labelKey: string;       // i18n key
  descKey: string;        // i18n key
  iconName: string;       // Lucide icon name
  inputType: 'file' | 'url';
  acceptedFormats?: string;  // e.g., '.csv,.json'
}
```

Create `lib/connectors/index.ts`:

```typescript
import type { ConnectorConfig, ConnectorType } from '../../types';

export const CONNECTORS: Record<ConnectorType, ConnectorConfig> = {
  csv: {
    type: 'csv',
    labelKey: 'connector.csv',
    descKey: 'connector.csvDesc',
    iconName: 'FileText',
    inputType: 'file',
    acceptedFormats: '.csv',
  },
  json: {
    type: 'json',
    labelKey: 'connector.json',
    descKey: 'connector.jsonDesc',
    iconName: 'Braces',
    inputType: 'file',
    acceptedFormats: '.json',
  },
  'google-sheets': {
    type: 'google-sheets',
    labelKey: 'connector.googleSheets',
    descKey: 'connector.googleSheetsDesc',
    iconName: 'Sheet',
    inputType: 'url',
  },
  'ga4-export': {
    type: 'ga4-export',
    labelKey: 'connector.ga4',
    descKey: 'connector.ga4Desc',
    iconName: 'BarChart2',
    inputType: 'file',
    acceptedFormats: '.csv,.json',
  },
  'mixpanel-export': {
    type: 'mixpanel-export',
    labelKey: 'connector.mixpanel',
    descKey: 'connector.mixpanelDesc',
    iconName: 'Activity',
    inputType: 'file',
    acceptedFormats: '.csv,.json',
  },
  'amplitude-export': {
    type: 'amplitude-export',
    labelKey: 'connector.amplitude',
    descKey: 'connector.amplitudeDesc',
    iconName: 'TrendingUp',
    inputType: 'file',
    acceptedFormats: '.csv,.json',
  },
};
```

### DC-2: JSON Connector (`lib/connectors/jsonConnector.ts`)

```typescript
import type { RawRow } from '../../types';

export function parseJSON(text: string): { data: RawRow[]; headers: string[] } {
  const parsed = JSON.parse(text);

  // Support array of objects
  const rows: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : parsed.data || parsed.rows || parsed.events || [];
  if (rows.length === 0) throw new Error('No data found in JSON');

  // Flatten nested objects (one level deep)
  const flatRows: RawRow[] = rows.map(row => {
    const flat: RawRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Flatten: { user: { id: 1 } } → { "user.id": "1" }
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
```

### DC-3: Google Sheets Connector (`lib/connectors/googleSheetsConnector.ts`)

```typescript
import type { RawRow } from '../../types';
import { parseCSVText } from '../csvParser';

const SHEETS_URL_PATTERNS = [
  /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
  /docs\.google\.com\/spreadsheets\/.*[?&]id=([a-zA-Z0-9_-]+)/,
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
  // Use Supabase Edge Function proxy to avoid CORS
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
  return parseCSVText(csvText);
}
```

Add `parseCSVText` to `lib/csvParser.ts`:

```typescript
// Parse CSV from text string (not File)
export function parseCSVText(text: string): Promise<{ data: RawRow[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          data: results.data as RawRow[],
          headers: results.meta.fields || [],
        });
      },
      error: (error) => reject(error),
    });
  });
}
```

### DC-4: Analytics Export Presets (`lib/connectors/presetTransformers.ts`)

```typescript
import type { RawRow, ExportFormat, ColumnMapping } from '../../types';

// Header patterns for auto-detection
const FORMAT_SIGNATURES: Record<ExportFormat, string[]> = {
  ga4: ['event_name', 'user_pseudo_id', 'event_timestamp', 'event_date'],
  mixpanel: ['event', 'distinct_id', 'time', '$browser'],
  amplitude: ['event_type', 'user_id', 'event_time', 'amplitude_id'],
  unknown: [],
};

// Column mapping presets
const PRESET_MAPPINGS: Record<Exclude<ExportFormat, 'unknown'>, ColumnMapping> = {
  ga4: {
    timestamp: 'event_timestamp',    // or event_date
    userid: 'user_pseudo_id',
    eventname: 'event_name',
    platform: 'platform',            // if present
    channel: 'traffic_source.medium', // GA4 nested field
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

// GA4 timestamp normalization (microseconds → ISO string)
export function normalizeGA4Timestamps(data: RawRow[]): RawRow[] {
  return data.map(row => {
    const ts = row['event_timestamp'];
    if (ts && /^\d{16}$/.test(ts)) {
      // GA4 uses microseconds since epoch
      row['event_timestamp'] = new Date(Number(ts) / 1000).toISOString();
    }
    return row;
  });
}

// Mixpanel timestamp normalization (unix seconds → ISO string)
export function normalizeMixpanelTimestamps(data: RawRow[]): RawRow[] {
  return data.map(row => {
    const ts = row['time'];
    if (ts && /^\d{10}$/.test(ts)) {
      row['time'] = new Date(Number(ts) * 1000).toISOString();
    }
    return row;
  });
}
```

### DC-5: useCSVUpload Extension + DataImport UI

Extend `useCSVUpload.ts`:
- Rename `handleFileUpload` internal logic to handle both CSV and JSON
- Add `handleURLImport(url: string)` for Google Sheets
- Add export format detection after parsing

```typescript
const handleFileUpload = useCallback(async (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'csv' && ext !== 'json') {
    toast('warning', i18n.t('insights:toast.supportedFormats'));
    return;
  }

  // ... existing progress dispatch ...

  if (ext === 'json') {
    const text = await file.text();
    const { parseJSON } = await import('../lib/connectors/jsonConnector');
    const result = parseJSON(text);
    // ... continue with SET_RAW_DATA + autoDetectColumns ...
  } else {
    const result = await parseCSV(file);
    // ... existing CSV flow ...
  }

  // After parsing, try to detect export format
  const { detectExportFormat, getPresetMapping } = await import('../lib/connectors/presetTransformers');
  const format = detectExportFormat(result.headers);
  if (format !== 'unknown') {
    const presetMapping = getPresetMapping(format);
    if (presetMapping) {
      dispatch({ type: 'SET_COLUMN_MAPPING', payload: presetMapping });
      toast('info', i18n.t('connector.detectedFormat', { format: format.toUpperCase() }));
    }
  }
}, [dispatch, toast]);
```

DataImport page UI changes:
- Add connector source selector cards at top (before file drop zone)
- Selected source determines the input UI shown (file upload vs URL input)
- Show detected export format badge after upload

### DC-6: i18n Keys

Add to `locales/ko/pages.json` under `connector`:

```json
{
  "connector": {
    "selectSource": "데이터 소스 선택",
    "selectSourceDesc": "분석할 데이터의 소스를 선택하세요",
    "csv": "CSV 파일",
    "csvDesc": "CSV 형식의 이벤트 데이터를 업로드합니다",
    "json": "JSON 파일",
    "jsonDesc": "JSON 배열 형식의 이벤트 데이터를 업로드합니다",
    "googleSheets": "Google Sheets",
    "googleSheetsDesc": "공개된 Google Sheets URL에서 데이터를 가져옵니다",
    "ga4": "GA4 Export",
    "ga4Desc": "Google Analytics 4에서 내보낸 데이터를 분석합니다",
    "mixpanel": "Mixpanel Export",
    "mixpanelDesc": "Mixpanel에서 내보낸 이벤트 데이터를 분석합니다",
    "amplitude": "Amplitude Export",
    "amplitudeDesc": "Amplitude에서 내보낸 이벤트 데이터를 분석합니다",
    "sheetsUrl": "Google Sheets URL",
    "sheetsUrlPlaceholder": "https://docs.google.com/spreadsheets/d/...",
    "sheetsUrlHint": "공개 또는 '링크가 있는 모든 사용자' 설정이 필요합니다",
    "fetchSheet": "데이터 가져오기",
    "fetchingSheet": "가져오는 중...",
    "detectedFormat": "{{format}} 형식이 감지되었습니다",
    "supportedFormats": "CSV 또는 JSON 파일만 지원됩니다",
    "urlRequired": "URL을 입력해주세요",
    "invalidSheetsUrl": "유효한 Google Sheets URL이 아닙니다"
  }
}
```

Corresponding English keys in `locales/en/pages.json`.

## 3. Dependencies

- **New npm**: None (JSON.parse built-in, papaparse already installed)
- **New Edge Function**: `sheets-proxy` (Google Sheets CORS proxy)
- **New Icons**: `Braces`, `Sheet` (add to Icons.tsx if not already exported)

## 4. Implementation Order

1. DC-1: Types + connector registry (foundation)
2. DC-2: JSON connector (simplest, validates architecture)
3. DC-4: Analytics export presets (transforms + auto-detect)
4. DC-6: i18n keys (needed by UI)
5. DC-5: DataImport UI refactor (source selector + format badge)
6. DC-3: Google Sheets connector (Edge Function needed)

## 5. Verification Checklist

- [ ] DC-1: ConnectorType, ExportFormat, ConnectorConfig in types/index.ts
- [ ] DC-1: CONNECTORS registry in lib/connectors/index.ts
- [ ] DC-2: parseJSON function handles array of objects + 1-level flatten
- [ ] DC-2: useCSVUpload handles .json files
- [ ] DC-3: extractSheetId parses Google Sheets URLs
- [ ] DC-3: parseCSVText added to csvParser.ts
- [ ] DC-4: detectExportFormat identifies GA4/Mixpanel/Amplitude headers
- [ ] DC-4: getPresetMapping returns correct ColumnMapping
- [ ] DC-4: GA4 microsecond + Mixpanel unix timestamp normalization
- [ ] DC-5: DataImport source selector UI with 6 connector cards
- [ ] DC-5: URL input for Google Sheets connector
- [ ] DC-5: Detected format badge after upload
- [ ] DC-6: i18n keys added (ko + en, ~18 keys each)
