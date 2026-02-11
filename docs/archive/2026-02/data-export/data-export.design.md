# Data Export Enhancement — Design

> **Feature**: data-export
> **Plan**: [data-export.plan.md](../../01-plan/features/data-export.plan.md)
> **Date**: 2026-02-11

---

## 1. Architecture

```
Pages (Export Button) → useDataExport hook → lib/exportUtils.ts (CSV)
                                           → lib/excelExport.ts (XLSX, dynamic import)
```

## 2. Implementation Tasks

### DE-1: CSV Export Utility (`lib/exportUtils.ts`)

New file with pure functions:

```typescript
// Convert 2D array to CSV string with BOM for Korean Excel compatibility
export function arrayToCSV(headers: string[], rows: (string | number)[][]): string

// Trigger browser download
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void

// Funnel data → CSV
export function exportFunnelCSV(funnelData: FunnelResult[], steps: string[]): void

// Retention data → CSV
export function exportRetentionCSV(retentionData: RetentionCohort[]): void

// Segment data → CSV
export function exportSegmentCSV(segmentResults: SegmentResult[]): void
```

### DE-2: Excel Export (`lib/excelExport.ts`)

Dynamic import of SheetJS (xlsx):

```typescript
// All-in-one Excel workbook with multiple sheets
export async function exportAllAsExcel(
  funnelData: FunnelResult[] | null,
  retentionData: RetentionCohort[] | null,
  segmentResults: SegmentResult[] | null,
  steps: string[]
): Promise<void>

// Single-sheet exports
export async function exportFunnelExcel(funnelData: FunnelResult[], steps: string[]): Promise<void>
export async function exportRetentionExcel(retentionData: RetentionCohort[]): Promise<void>
export async function exportSegmentExcel(segmentResults: SegmentResult[]): Promise<void>
```

### DE-3: useDataExport Hook

```typescript
export function useDataExport() {
  return {
    exportCSV: (type: 'funnel' | 'retention' | 'segment') => void,
    exportExcel: (type: 'funnel' | 'retention' | 'segment' | 'all') => void,
    exporting: boolean,
    isPro: boolean
  }
}
```

### DE-4: ExportDropdown Component

```typescript
// Reusable dropdown button for analysis pages
<ExportDropdown
  onCSV={() => exportCSV('funnel')}
  onExcel={() => exportExcel('funnel')}
  disabled={!hasData}
/>
```

### DE-5: Page Integration

Add ExportDropdown to:
- FunnelAnalysis.tsx (header area, next to existing controls)
- RetentionAnalysis.tsx (header area)
- SegmentComparison.tsx (header area)
- Dashboard.tsx (quick export all)

### DE-6: i18n Keys

Add to `locales/ko/common.json` and `locales/en/common.json`:
```json
{
  "dataExport": {
    "csv": "CSV 다운로드",
    "excel": "Excel 다운로드",
    "excelPro": "Excel (Pro)",
    "exporting": "내보내는 중...",
    "complete": "다운로드 완료",
    "noData": "내보낼 데이터가 없습니다",
    "all": "전체 데이터"
  }
}
```

## 3. Dependencies

- **New npm**: `xlsx` (SheetJS) — ~200KB, dynamic import to avoid bundle bloat
- **Existing**: usePlanGate, useApp (AppState access), i18n

## 4. Plan Gating

| Format | Free | Pro |
|--------|------|-----|
| CSV | O | O |
| Excel | X | O |

## 5. File Naming Convention

- `fre-funnel-export-YYYY-MM-DD.csv`
- `fre-retention-export-YYYY-MM-DD.csv`
- `fre-segment-export-YYYY-MM-DD.csv`
- `fre-analytics-YYYY-MM-DD.xlsx` (all-in-one)
