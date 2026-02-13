# Chart Image Download — Design

> **Feature**: chart-image-download
> **Plan**: [chart-image-download.plan.md](../../01-plan/features/chart-image-download.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture Overview

개별 차트 컨테이너를 html2canvas로 캡처하여 PNG 다운로드하는 공용 컴포넌트를 만들고, 각 분석 페이지에 적용합니다.

### Layer Mapping

| Layer | File | Changes |
|-------|------|---------|
| Component | components/ChartDownloadButton.tsx | New: 다운로드 버튼 + html2canvas 캡처 |
| Presentation | pages/FunnelAnalysis.tsx | ref + ChartDownloadButton 2개소 |
| Presentation | pages/RetentionAnalysis.tsx | ref + ChartDownloadButton 2개소 |
| Presentation | pages/SegmentComparison.tsx | ref + ChartDownloadButton 1개소 |
| Presentation | pages/Dashboard.tsx | ref + ChartDownloadButton 2개소 |
| Icons | components/Icons.tsx | Camera icon 추가 |
| i18n | locales/ko/pages.json, locales/en/pages.json | New keys |

---

## 2. Detailed Design

### CD-1: ChartDownloadButton Component

**File**: `components/ChartDownloadButton.tsx`

#### 1.1 Props

```typescript
type ChartDownloadButtonProps = {
  targetRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
};
```

#### 1.2 Implementation

```tsx
import React, { useState, useCallback } from 'react';
import { Camera } from '../components/Icons';
import { useTranslation } from 'react-i18next';

export const ChartDownloadButton: React.FC<ChartDownloadButtonProps> = ({ targetRef, filename }) => {
  const { t } = useTranslation('pages');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!targetRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#0f1117',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch { /* silently fail */ }
    finally { setDownloading(false); }
  }, [targetRef, filename, downloading]);

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
      title={t('chart.downloadPng')}
      aria-label={t('chart.downloadPng')}
    >
      {downloading ? <LoaderCircle size={14} className="animate-spin" /> : <Camera size={14} />}
    </button>
  );
};
```

Key decisions:
- `scale: 2` for 2x resolution (Retina-quality)
- `backgroundColor: '#0f1117'` matches app background
- Dynamic import of html2canvas (already in bundle via jsPDF, 202KB chunk)
- `Camera` icon (distinct from existing `Download` icon used for data export)

### CD-2: FunnelAnalysis Chart Downloads

**File**: `pages/FunnelAnalysis.tsx`

#### 2.1 Refs

```typescript
const funnelChartRef = useRef<HTMLDivElement>(null);
const dropoffChartRef = useRef<HTMLDivElement>(null);
```

#### 2.2 Button Placement

Main Funnel Chart card header에 ChartDownloadButton 추가:
```tsx
<div className="flex items-center justify-between mb-4">
  <h3 ...>{t('funnel.conversionFunnel')}</h3>
  <ChartDownloadButton targetRef={funnelChartRef} filename="funnel-chart" />
</div>
<div ref={funnelChartRef}>
  {/* existing BarChart */}
</div>
```

Drop-off Chart card header에 동일 패턴:
```tsx
<div className="flex items-center justify-between mb-4">
  <h3 ...>{t('funnel.dropoffTitle')}</h3>
  <ChartDownloadButton targetRef={dropoffChartRef} filename="dropoff-chart" />
</div>
<div ref={dropoffChartRef}>
  {/* existing drop-off BarChart */}
</div>
```

### CD-3: RetentionAnalysis Chart Downloads

**File**: `pages/RetentionAnalysis.tsx`

#### 3.1 Refs

```typescript
const cohortTableRef = useRef<HTMLDivElement>(null);
const retentionCurveRef = useRef<HTMLDivElement>(null);
```

#### 3.2 Button Placement

코호트 테이블 상단에 ChartDownloadButton:
```tsx
{/* Cohort Table header */}
<div className="flex items-center justify-between p-4">
  <span>...</span>
  <ChartDownloadButton targetRef={cohortTableRef} filename="cohort-heatmap" />
</div>
```

Retention Curve 카드 header (기존 아이콘 옆):
```tsx
<div className="flex items-center gap-3">
  <div>...</div>
  <ChartDownloadButton targetRef={retentionCurveRef} filename="retention-curve" />
</div>
```

### CD-4: SegmentComparison Chart Download

**File**: `pages/SegmentComparison.tsx`

#### 4.1 Ref

```typescript
const segmentChartRef = useRef<HTMLDivElement>(null);
```

#### 4.2 Button Placement

BarChart card header:
```tsx
<div className="flex items-center justify-between mb-6">
  <h3 ...>{t('segments.conversionBySegment')}</h3>
  <ChartDownloadButton targetRef={segmentChartRef} filename="segment-chart" />
</div>
```

### CD-5: Dashboard Chart Downloads

**File**: `pages/Dashboard.tsx`

#### 5.1 Refs

```typescript
const dashFunnelRef = useRef<HTMLDivElement>(null);
const dashRetentionRef = useRef<HTMLDivElement>(null);
```

#### 5.2 Button Placement

widgetContent 내 funnel/retention 차트에 ref 할당, DashboardWidget 내부는 수정하지 않고 차트 div에 직접 ref + 버튼 추가.

### CD-6: Icons

**File**: `components/Icons.tsx`

```typescript
// import 추가
import { ..., Camera } from 'lucide-react';
// export 추가
export { ..., Camera };
```

### CD-7: i18n Keys

**Files**: `locales/ko/pages.json`, `locales/en/pages.json`

| Key | Korean | English |
|-----|--------|---------|
| chart.downloadPng | 차트 이미지 다운로드 | Download chart image |
| chart.downloading | 다운로드 중... | Downloading... |

---

## 3. Implementation Order

| # | ID | Task | File(s) |
|---|-----|------|---------|
| 1 | CD-6 | Add Camera icon to Icons.tsx | components/Icons.tsx |
| 2 | CD-1 | Create ChartDownloadButton component | components/ChartDownloadButton.tsx |
| 3 | CD-2 | Add download buttons to FunnelAnalysis | pages/FunnelAnalysis.tsx |
| 4 | CD-3 | Add download buttons to RetentionAnalysis | pages/RetentionAnalysis.tsx |
| 5 | CD-4 | Add download button to SegmentComparison | pages/SegmentComparison.tsx |
| 6 | CD-5 | Add download buttons to Dashboard | pages/Dashboard.tsx |
| 7 | CD-7 | Add i18n keys (ko + en) | locales/ko/pages.json, locales/en/pages.json |

---

## 4. Verification Checklist

| # | ID | Item | Expected |
|---|-----|------|----------|
| 1 | CD-6 | Camera icon in Icons.tsx | import + export |
| 2 | CD-1 | ChartDownloadButton component exists | targetRef + filename props |
| 3 | CD-1 | html2canvas dynamic import | await import('html2canvas') |
| 4 | CD-1 | scale: 2 for Retina quality | html2canvas options |
| 5 | CD-1 | backgroundColor matches app theme | '#0f1117' |
| 6 | CD-1 | downloading state prevents double-click | disabled={downloading} |
| 7 | CD-1 | Camera icon + LoaderCircle spinner | Conditional render |
| 8 | CD-2 | funnelChartRef on Funnel BarChart container | useRef + ref={} |
| 9 | CD-2 | dropoffChartRef on Drop-off BarChart container | useRef + ref={} |
| 10 | CD-2 | ChartDownloadButton in funnel chart header | filename="funnel-chart" |
| 11 | CD-2 | ChartDownloadButton in dropoff chart header | filename="dropoff-chart" |
| 12 | CD-3 | cohortTableRef on cohort table container | useRef + ref={} |
| 13 | CD-3 | retentionCurveRef on retention curve container | useRef + ref={} |
| 14 | CD-3 | ChartDownloadButton in cohort table area | filename="cohort-heatmap" |
| 15 | CD-3 | ChartDownloadButton in retention curve header | filename="retention-curve" |
| 16 | CD-4 | segmentChartRef on segment BarChart container | useRef + ref={} |
| 17 | CD-4 | ChartDownloadButton in segment chart header | filename="segment-chart" |
| 18 | CD-5 | dashFunnelRef on dashboard funnel chart | useRef + ref={} |
| 19 | CD-5 | dashRetentionRef on dashboard retention chart | useRef + ref={} |
| 20 | CD-5 | ChartDownloadButton in dashboard funnel widget | filename="dashboard-funnel" |
| 21 | CD-5 | ChartDownloadButton in dashboard retention widget | filename="dashboard-retention" |
| 22 | CD-7 | 2 i18n keys in ko/pages.json | chart.downloadPng, chart.downloading |
| 23 | CD-7 | 2 i18n keys in en/pages.json | chart.downloadPng, chart.downloading |

---

## 5. Out of Scope

- SVG 포맷 다운로드
- 클립보드 복사
- Pro 전용 게이팅 (무료 기능)
- 새 npm 패키지 설치

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-13 | Initial design | Claude |
