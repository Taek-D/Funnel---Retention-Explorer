# chart-image-download Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Funnel & Retention Explorer
> **Analyst**: Claude (gap-detector)
> **Date**: 2026-02-13
> **Design Doc**: [chart-image-download.design.md](../02-design/features/chart-image-download.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify that the chart-image-download feature implementation matches the design document across all 23 checklist items: Icons, ChartDownloadButton component, page integrations (FunnelAnalysis, RetentionAnalysis, SegmentComparison, Dashboard), and i18n keys.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/chart-image-download.design.md`
- **Implementation Files**:
  - `components/Icons.tsx`
  - `components/ChartDownloadButton.tsx`
  - `pages/FunnelAnalysis.tsx`
  - `pages/RetentionAnalysis.tsx`
  - `pages/SegmentComparison.tsx`
  - `pages/Dashboard.tsx`
  - `locales/ko/pages.json`
  - `locales/en/pages.json`
- **Analysis Date**: 2026-02-13

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Verification Checklist Results

| # | ID | Item | Expected | Actual | Status |
|---|-----|------|----------|--------|--------|
| 1 | CD-6 | Camera icon in Icons.tsx | import + export | `Camera` imported (L74) and exported (L151) | PASS |
| 2 | CD-1 | ChartDownloadButton component exists | targetRef + filename props | `ChartDownloadButtonProps` with `targetRef: React.RefObject<HTMLDivElement \| null>` and `filename: string` (L5-8) | PASS |
| 3 | CD-1 | html2canvas dynamic import | `await import('html2canvas')` | `(await import('html2canvas')).default` (L18) | PASS |
| 4 | CD-1 | scale: 2 for Retina quality | html2canvas options | `scale: 2` (L21) | PASS |
| 5 | CD-1 | backgroundColor matches app theme | `'#0f1117'` | `backgroundColor: '#0f1117'` (L20) | PASS |
| 6 | CD-1 | downloading state prevents double-click | `disabled={downloading}` | `disabled={downloading}` (L34) + guard `if (!targetRef.current \|\| downloading) return` (L14) | PASS |
| 7 | CD-1 | Camera icon + LoaderCircle spinner | Conditional render | `{downloading ? <LoaderCircle ... /> : <Camera ... />}` (L40) | PASS |
| 8 | CD-2 | funnelChartRef on Funnel BarChart container | useRef + ref={} | `useRef<HTMLDivElement>(null)` (L36) + `ref={funnelChartRef}` (L468) | PASS |
| 9 | CD-2 | dropoffChartRef on Drop-off BarChart container | useRef + ref={} | `useRef<HTMLDivElement>(null)` (L37) + `ref={dropoffChartRef}` (L560) | PASS |
| 10 | CD-2 | ChartDownloadButton in funnel chart header | filename="funnel-chart" | `<ChartDownloadButton targetRef={funnelChartRef} filename="funnel-chart" />` (L460) | PASS |
| 11 | CD-2 | ChartDownloadButton in dropoff chart header | filename="dropoff-chart" | `<ChartDownloadButton targetRef={dropoffChartRef} filename="dropoff-chart" />` (L558) | PASS |
| 12 | CD-3 | cohortTableRef on cohort table container | useRef + ref={} | `useRef<HTMLDivElement>(null)` (L31) + `ref={cohortTableRef}` (L244) | PASS |
| 13 | CD-3 | retentionCurveRef on retention curve container | useRef + ref={} | `useRef<HTMLDivElement>(null)` (L32) + `ref={retentionCurveRef}` (L323) | PASS |
| 14 | CD-3 | ChartDownloadButton in cohort table area | filename="cohort-heatmap" | `<ChartDownloadButton targetRef={cohortTableRef} filename="cohort-heatmap" />` (L242) | PASS |
| 15 | CD-3 | ChartDownloadButton in retention curve header | filename="retention-curve" | `<ChartDownloadButton targetRef={retentionCurveRef} filename="retention-curve" />` (L320) | PASS |
| 16 | CD-4 | segmentChartRef on segment BarChart container | useRef + ref={} | `useRef<HTMLDivElement>(null)` (L17) + `ref={segmentChartRef}` (L151) | PASS |
| 17 | CD-4 | ChartDownloadButton in segment chart header | filename="segment-chart" | `<ChartDownloadButton targetRef={segmentChartRef} filename="segment-chart" />` (L149) | PASS |
| 18 | CD-5 | dashFunnelRef on dashboard funnel chart | useRef + ref={} | `useRef<HTMLDivElement>(null)` (L36) + `ref={dashFunnelRef}` (L207) | PASS |
| 19 | CD-5 | dashRetentionRef on dashboard retention chart | useRef + ref={} | `useRef<HTMLDivElement>(null)` (L37) + `ref={dashRetentionRef}` (L240) | PASS |
| 20 | CD-5 | ChartDownloadButton in dashboard funnel widget | filename="dashboard-funnel" | `<ChartDownloadButton targetRef={dashFunnelRef} filename="dashboard-funnel" />` (L200) | PASS |
| 21 | CD-5 | ChartDownloadButton in dashboard retention widget | filename="dashboard-retention" | `<ChartDownloadButton targetRef={dashRetentionRef} filename="dashboard-retention" />` (L237) | PASS |
| 22 | CD-7 | 2 i18n keys in ko/pages.json | chart.downloadPng, chart.downloading | `"downloadPng": "..."` and `"downloading": "..."` under `"chart"` (L6-8) | PASS |
| 23 | CD-7 | 2 i18n keys in en/pages.json | chart.downloadPng, chart.downloading | `"downloadPng": "Download chart image"` and `"downloading": "Downloading..."` under `"chart"` (L6-8) | PASS |

### 2.2 Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 100%                    |
+---------------------------------------------+
|  PASS:    23 / 23 items (100%)              |
|  PARTIAL:  0 / 23 items (0%)               |
|  FAIL:     0 / 23 items (0%)               |
+---------------------------------------------+
```

---

## 3. Detailed Verification

### 3.1 CD-6: Icons (Camera + LoaderCircle)

**File**: `components/Icons.tsx`

Both `Camera` (L74) and `LoaderCircle` (L75) are imported from `lucide-react` and re-exported at L151-152. This follows the project convention of centralizing all icon imports through `Icons.tsx`.

### 3.2 CD-1: ChartDownloadButton Component

**File**: `components/ChartDownloadButton.tsx`

The component matches the design exactly:
- Props type uses `type` (not `interface`), following project convention
- Dynamic import of `html2canvas` via `(await import('html2canvas')).default`
- Canvas options: `backgroundColor: '#0f1117'`, `scale: 2`, `useCORS: true`
- Double-click prevention via `disabled={downloading}` + early return guard
- Conditional icon rendering: LoaderCircle with `animate-spin` vs Camera
- i18n integration: `useTranslation('pages')` with `t('chart.downloadPng')`
- Accessibility: both `title` and `aria-label` attributes set

### 3.3 CD-2: FunnelAnalysis Integration

**File**: `pages/FunnelAnalysis.tsx`

- Two refs declared at L36-37: `funnelChartRef`, `dropoffChartRef`
- `ChartDownloadButton` imported at L12
- Funnel chart button at L460 within the chart card header (flex row with conversion rate)
- Drop-off chart button at L558 within the drop-off card header
- Both refs attached to wrapping `<div>` elements containing the `<ResponsiveContainer>`

### 3.4 CD-3: RetentionAnalysis Integration

**File**: `pages/RetentionAnalysis.tsx`

- Two refs declared at L31-32: `cohortTableRef`, `retentionCurveRef`
- `ChartDownloadButton` imported at L9
- Cohort table button at L242 in the table header row
- Retention curve button at L320 next to the chart title/icon group
- Refs attached to the scrollable container (L244) and chart container (L323)

### 3.5 CD-4: SegmentComparison Integration

**File**: `pages/SegmentComparison.tsx`

- One ref declared at L17: `segmentChartRef`
- `ChartDownloadButton` imported at L9
- Button at L149 in the chart card header
- Ref attached to the `<div>` wrapping `<ResponsiveContainer>` (L151)

### 3.6 CD-5: Dashboard Integration

**File**: `pages/Dashboard.tsx`

- Two refs declared at L36-37: `dashFunnelRef`, `dashRetentionRef`
- `ChartDownloadButton` imported at L16
- Funnel widget button at L200 in the funnel widget header (flex row)
- Retention widget button at L237 in the retention widget header
- Refs attached to chart containers at L207 and L240

### 3.7 CD-7: i18n Keys

**ko/pages.json** (L5-8):
```json
"chart": {
  "downloadPng": "...",
  "downloading": "..."
}
```
Values: Korean text matching design spec exactly.

**en/pages.json** (L5-8):
```json
"chart": {
  "downloadPng": "Download chart image",
  "downloading": "Downloading..."
}
```
Values: English text matching design spec exactly.

---

## 4. Convention Compliance

### 4.1 Naming Convention

| Item | Convention | Actual | Status |
|------|-----------|--------|--------|
| Component name | PascalCase | `ChartDownloadButton` | PASS |
| Component file | PascalCase.tsx | `ChartDownloadButton.tsx` | PASS |
| Props type | `type` keyword | `type ChartDownloadButtonProps` | PASS |
| Ref variables | camelCase | `funnelChartRef`, `dashRetentionRef`, etc. | PASS |
| i18n keys | dot.notation | `chart.downloadPng`, `chart.downloading` | PASS |

### 4.2 Import Order

All modified files follow the project import order:
1. React / external libraries
2. Internal absolute imports (`../components/...`, `../hooks/...`)
3. Type imports (`import type`)

### 4.3 Architecture Compliance

| Layer | File | Correct Layer | Status |
|-------|------|--------------|--------|
| Component | `ChartDownloadButton.tsx` | Presentation | PASS |
| Presentation | `FunnelAnalysis.tsx` | Presentation | PASS |
| Presentation | `RetentionAnalysis.tsx` | Presentation | PASS |
| Presentation | `SegmentComparison.tsx` | Presentation | PASS |
| Presentation | `Dashboard.tsx` | Presentation | PASS |
| Icons | `Icons.tsx` | Presentation | PASS |
| i18n | `locales/*/pages.json` | Configuration | PASS |

No dependency violations. The component imports only from `Icons.tsx` and `react-i18next` -- no direct infrastructure imports.

---

## 5. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **100%** | **PASS** |

---

## 6. Missing Features (Design O, Implementation X)

None.

## 7. Added Features (Design X, Implementation O)

None.

## 8. Changed Features (Design != Implementation)

None.

---

## 9. Recommended Actions

No actions required. All 23 verification checklist items from the design document are fully implemented and match the specification exactly.

---

## 10. Design Document Updates Needed

No updates needed. Design and implementation are fully synchronized.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-13 | Initial analysis -- 23/23 PASS (100%) | Claude (gap-detector) |
