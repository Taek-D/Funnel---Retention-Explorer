# Funnel Time Analysis — Design

> **Feature**: funnel-time-analysis
> **Plan**: [funnel-time-analysis.plan.md](../../01-plan/features/funnel-time-analysis.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture Overview

기존 funnelEngine.ts의 시간 계산을 확장하여 상세 시간 분포(median/p10/p90/mean)를 반환하고,
FunnelAnalysis 페이지에 시간 분포 차트를 추가합니다.

### Layer Mapping

| Layer | File | Changes |
|-------|------|---------|
| Types | types/index.ts | FunnelTimeStats 타입 추가, FunnelStep.timeStats 필드 추가 |
| Engine | lib/funnelEngine.ts | calculateTimeBetweenSteps 확장 (p10/p90/mean/count) |
| Page | pages/FunnelAnalysis.tsx | 시간 분포 차트 섹션 교체 |
| i18n | locales/ko/pages.json, locales/en/pages.json | 신규 키 추가 |

---

## 2. Detailed Design

### FT-1: Time Distribution Engine

**File**: `types/index.ts`

```typescript
export interface FunnelTimeStats {
  median: number;   // minutes
  p10: number;      // minutes
  p90: number;      // minutes
  mean: number;     // minutes
  count: number;    // number of users with valid time
}
```

**File**: `types/index.ts` — FunnelStep 확장

```typescript
export interface FunnelStep {
  step: string;
  stepNumber: number;
  users: number;
  conversionRate: number;
  dropOff: number;
  medianTime?: number;       // 기존 유지 (하위 호환)
  timeStats?: FunnelTimeStats; // 신규 상세 통계
}
```

**File**: `lib/funnelEngine.ts`

기존 `calculateMedianTimeBetweenSteps` 를 `calculateTimeBetweenSteps` 로 확장:

```typescript
function calculateTimeBetweenSteps(
  processedData: ProcessedEvent[], step1: string, step2: string, userSet: Set<string>
): FunnelTimeStats {
  // 기존 로직으로 times[] 수집
  // 추가: p10 = times[Math.floor(times.length * 0.1)]
  //       p90 = times[Math.floor(times.length * 0.9)]
  //       mean = sum / times.length
  //       count = times.length
  return { median, p10, p90, mean, count };
}
```

_calculateFunnel 내에서 호출부 변경:
```typescript
const stats = calculateTimeBetweenSteps(processedData, steps[index - 1], steps[index], usersByStep[steps[index]]);
stepData.medianTime = stats.median;  // 하위 호환
stepData.timeStats = stats;          // 신규
```

### FT-2: Time Distribution Bar Chart

**File**: `pages/FunnelAnalysis.tsx`

기존 Median Time 텍스트 섹션을 시간 분포 차트로 교체.

#### 2.1 Layout

```
┌─────────────────────────────────────────────┐
│ 전환 시간 분석          [ChartDownloadButton] │
├─────────────────────────────────────────────┤
│                                             │
│  Step1 → Step2  ┃██████████████┃  12분      │
│                  P10    Med   P90            │
│                                             │
│  Step2 → Step3  ┃████████████████████┃ 45분  │  ← 병목 (빨간)
│                  P10    Med   P90            │
│                                             │
│  Step3 → Step4  ┃████████┃  8분              │
│                  P10    Med   P90            │
│                                             │
├─────────────────────────────────────────────┤
│ ⚡ 병목 구간: Step2 → Step3 (중앙값 45분)    │
│    P90 사용자는 120분 이상 소요              │
└─────────────────────────────────────────────┘
```

#### 2.2 Implementation

```tsx
// Recharts 가로 BarChart 사용
<BarChart layout="vertical" data={timeChartData} width={...} height={...}>
  <XAxis type="number" />
  <YAxis type="category" dataKey="label" width={150} />
  <Bar dataKey="p90" fill={CHART_COLORS.palette[1]} stackId="time" opacity={0.3} />
  <Bar dataKey="median" fill={CHART_COLORS.accent} />
  <Tooltip />
</BarChart>
```

시간 차트 데이터 구조:
```typescript
const timeChartData = funnelResults.slice(1)
  .filter(s => s.timeStats)
  .map((step, i) => ({
    label: `${funnelResults[i].step} → ${step.step}`,
    p10: step.timeStats!.p10,
    median: step.timeStats!.median,
    p90: step.timeStats!.p90,
    mean: step.timeStats!.mean,
    count: step.timeStats!.count,
    isBottleneck: false,  // 계산 후 설정
  }));

// 병목 = 가장 긴 median
const maxMedian = Math.max(...timeChartData.map(d => d.median));
timeChartData.forEach(d => { d.isBottleneck = d.median === maxMedian && maxMedian > 0; });
```

#### 2.3 Bottleneck Highlight

병목 구간 바에 빨간 배경 + 인사이트 텍스트:
```tsx
// Cell 컴포넌트로 병목 색상 분기
<Cell fill={entry.isBottleneck ? CHART_COLORS.dropoffColor(80) : CHART_COLORS.accent} />

// 하단 인사이트
{bottleneck && (
  <div className="flex items-center gap-2 mt-3 text-xs text-amber-400">
    <AlertTriangle size={14} />
    <span>{t('funnel.bottleneckHint', { step: bottleneck.label, time: formatTime(bottleneck.median) })}</span>
  </div>
)}
```

#### 2.4 Custom Tooltip

```tsx
const TimeTooltip = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="...tooltip styles...">
      <p className="font-semibold">{data.label}</p>
      <p>P10: {formatTime(data.p10)}</p>
      <p>Median: {formatTime(data.median)}</p>
      <p>P90: {formatTime(data.p90)}</p>
      <p>Mean: {formatTime(data.mean)}</p>
      <p>Users: {data.count}</p>
    </div>
  );
};
```

### FT-3: ChartDownloadButton Integration

기존 FunnelAnalysis에 이미 `funnelChartRef`가 있으므로, 시간 차트에 별도 ref 추가:
```tsx
const timeChartRef = useRef<HTMLDivElement>(null);
// ...
<ChartDownloadButton targetRef={timeChartRef} filename="funnel-time-analysis" />
```

### FT-4: i18n Keys

**Files**: `locales/ko/pages.json`, `locales/en/pages.json`

| Key | Korean | English |
|-----|--------|------------|
| funnel.timeAnalysis | 전환 시간 분석 | Conversion Time Analysis |
| funnel.timeP10 | P10 (빠른 10%) | P10 (Fastest 10%) |
| funnel.timeP90 | P90 (느린 10%) | P90 (Slowest 10%) |
| funnel.timeMean | 평균 | Mean |
| funnel.timeMedian | 중앙값 | Median |
| funnel.timeCount | 분석 대상 | Users Measured |
| funnel.bottleneckHint | 병목 구간: {{step}} (중앙값 {{time}}) | Bottleneck: {{step}} (median {{time}}) |
| funnel.noTimeData | 시간 데이터가 부족합니다 | Insufficient time data |

---

## 3. Implementation Order

| # | ID | Task | File(s) |
|---|-----|------|------------|
| 1 | FT-1 | Add FunnelTimeStats type + extend FunnelStep | types/index.ts |
| 2 | FT-1 | Extend calculateTimeBetweenSteps | lib/funnelEngine.ts |
| 3 | FT-2 | Replace median time text with time distribution chart | pages/FunnelAnalysis.tsx |
| 4 | FT-3 | Add timeChartRef + ChartDownloadButton | pages/FunnelAnalysis.tsx |
| 5 | FT-4 | Add i18n keys (ko + en) | locales/ko/pages.json, locales/en/pages.json |

---

## 4. Verification Checklist

| # | ID | Item | Expected |
|---|-----|------|----------|
| 1 | FT-1 | FunnelTimeStats type exists | { median, p10, p90, mean, count } |
| 2 | FT-1 | FunnelStep.timeStats field exists | Optional FunnelTimeStats |
| 3 | FT-1 | FunnelStep.medianTime still exists | Backward compatibility |
| 4 | FT-1 | calculateTimeBetweenSteps returns FunnelTimeStats | p10/p90/mean/count computed |
| 5 | FT-1 | percentile calculation correct | p10 = 10th percentile, p90 = 90th |
| 6 | FT-1 | empty times returns zeros | All stats = 0, count = 0 |
| 7 | FT-2 | Time distribution chart renders | BarChart layout="vertical" |
| 8 | FT-2 | Chart shows step transition labels | "StepA → StepB" format |
| 9 | FT-2 | Median bar visible per step | Primary colored bar |
| 10 | FT-2 | P10/P90 range visible | Lighter/wider range indicator |
| 11 | FT-2 | Bottleneck step highlighted | Different color (red/coral) |
| 12 | FT-2 | Bottleneck = step with highest median | Auto-detected |
| 13 | FT-2 | Bottleneck insight text shown | AlertTriangle + text below chart |
| 14 | FT-2 | Custom Tooltip shows all stats | p10, median, p90, mean, count |
| 15 | FT-2 | No chart when no time data | noTimeData message or hidden |
| 16 | FT-3 | timeChartRef attached | useRef<HTMLDivElement> |
| 17 | FT-3 | ChartDownloadButton for time chart | filename="funnel-time-analysis" |
| 18 | FT-4 | 8 i18n keys in ko/pages.json | funnel.timeAnalysis, etc. |
| 19 | FT-4 | 8 i18n keys in en/pages.json | Matching English translations |

---

## 5. Out of Scope

- 시간 히스토그램 (사용자 분포)
- 시간 기반 세그먼트 필터
- 개별 사용자 시간 추적
- 시간대별 비교

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-13 | Initial design | Claude |
