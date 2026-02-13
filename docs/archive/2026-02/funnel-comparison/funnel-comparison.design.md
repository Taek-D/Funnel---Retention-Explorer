# Funnel Comparison — Design

> **Feature**: funnel-comparison
> **Plan**: [funnel-comparison.plan.md](../../01-plan/features/funnel-comparison.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture Overview

두 기간의 데이터를 각각 필터링한 뒤 calculateFunnel을 호출하고,
스텝별 전환율 차이를 테이블 + BarChart로 시각화합니다.

### Layer Mapping

| Layer | File | Changes |
|-------|------|---------|
| Engine | lib/funnelEngine.ts | compareFunnels 함수 추가 |
| Page | pages/FunnelComparison.tsx | New: 비교 페이지 |
| Route | router.tsx | /app/funnel-compare 라우트 추가 |
| Nav | components/Sidebar.tsx | GitCompareArrows 아이콘 메뉴 추가 |
| Icons | components/Icons.tsx | GitCompareArrows 추가 |
| i18n | locales/ko/pages.json, locales/en/pages.json | New keys |

---

## 2. Detailed Design

### FC-1: Comparison Engine

**File**: `lib/funnelEngine.ts`

```typescript
export type FunnelComparisonStep = {
  step: string;
  stepNumber: number;
  usersA: number;
  usersB: number;
  rateA: number;        // conversionRate period A
  rateB: number;        // conversionRate period B
  diff: number;         // rateB - rateA (percentage points)
  direction: 'up' | 'down' | 'same';
};

export type FunnelComparisonResult = {
  steps: FunnelComparisonStep[];
  totalUsersA: number;
  totalUsersB: number;
};

export function compareFunnels(
  resultA: FunnelStep[],
  resultB: FunnelStep[]
): FunnelComparisonResult
```

Logic:
1. Zip resultA and resultB by stepNumber
2. For each step: diff = rateB - rateA
3. direction = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'same'
4. totalUsersA = resultA[0].users, totalUsersB = resultB[0].users

### FC-2: FunnelComparison Page

**File**: `pages/FunnelComparison.tsx`

#### 2.1 Layout

```
┌─────────────────────────────────────────────────┐
│ 퍼널 비교 분석                                     │
│ 두 기간의 퍼널 전환율을 비교합니다                    │
├─────────────────────────────────────────────────┤
│ Period A: [시작일] ~ [종료일]                      │
│ Period B: [시작일] ~ [종료일]                      │
├─────────────────────────────────────────────────┤
│ 스텝 선택: [+] [step1] [step2] [step3] ...       │
│           [비교 실행]                              │
├─────────────────────────────────────────────────┤
│ Summary:  A: 1,234 users  |  B: 2,345 users     │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │  Step  │ Period A │ Period B │ Diff │ Dir  │   │
│ │  S1    │  100%    │  100%    │  —   │  —   │   │
│ │  S2    │  65.2%   │  72.1%   │ +6.9 │  ↑   │   │
│ │  S3    │  32.5%   │  28.1%   │ -4.4 │  ↓   │   │
│ └───────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │       Grouped BarChart (A vs B)           │   │
│ │       h-[300px]                            │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### 2.2 State

```typescript
const [periodA, setPeriodA] = useState<{ start: string; end: string }>({ start: '', end: '' });
const [periodB, setPeriodB] = useState<{ start: string; end: string }>({ start: '', end: '' });
const [steps, setSteps] = useState<string[]>([]);
const [newStep, setNewStep] = useState('');
const [result, setResult] = useState<FunnelComparisonResult | null>(null);
```

#### 2.3 Compare Logic

```typescript
const handleCompare = useCallback(() => {
  if (steps.length < 2 || !periodA.start || !periodA.end || !periodB.start || !periodB.end) return;

  const filterByPeriod = (data: ProcessedEvent[], start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    return data.filter(ev => ev.timestamp >= s && ev.timestamp <= e);
  };

  const dataA = filterByPeriod(processedData, periodA.start, periodA.end);
  const dataB = filterByPeriod(processedData, periodB.start, periodB.end);

  const resultA = calculateFunnel(dataA, steps);
  const resultB = calculateFunnel(dataB, steps);

  setResult(compareFunnels(resultA, resultB));
}, [processedData, steps, periodA, periodB]);
```

#### 2.4 Grouped BarChart

```tsx
<BarChart data={chartData} width={...} height={300}>
  <XAxis dataKey="step" />
  <YAxis domain={[0, 100]} unit="%" />
  <Tooltip />
  <Bar dataKey="rateA" name="Period A" fill={CHART_COLORS.palette[0]} />
  <Bar dataKey="rateB" name="Period B" fill={CHART_COLORS.palette[1]} />
</BarChart>
```

#### 2.5 Direction Indicators

```tsx
// Up arrow (green), Down arrow (red), Dash (gray)
{step.direction === 'up' && <TrendingUp size={14} className="text-accent" />}
{step.direction === 'down' && <TrendingDown size={14} className="text-coral" />}
{step.direction === 'same' && <span className="text-slate-500">—</span>}
```

#### 2.6 Empty States

- 데이터 없으면: GitCompareArrows 아이콘 + 안내 텍스트
- 결과 없으면 (비교 전): ChartSkeleton 힌트

### FC-3: Route + Sidebar + Icons

**File**: `router.tsx`

```typescript
const FunnelComparison = lazy(() => import('./pages/FunnelComparison').then(m => ({ default: m.FunnelComparison })));
// Route: { path: 'funnel-compare', element: <Suspense ...><FunnelComparison /></Suspense> }
```

**File**: `components/Icons.tsx`

```typescript
// Add GitCompareArrows to import and export
```

**File**: `components/Sidebar.tsx`

```typescript
// Add after journey menu item:
{ path: '/app/funnel-compare', icon: GitCompareArrows, labelKey: 'nav.funnelCompare' },
```

### FC-4: i18n Keys

| Key | Korean | English |
|-----|--------|---------|
| nav.funnelCompare | 퍼널 비교 | Funnel Compare |
| funnelCompare.title | 퍼널 비교 분석 | Funnel Comparison |
| funnelCompare.desc | 두 기간의 퍼널 전환율을 비교합니다 | Compare funnel conversion rates across two periods |
| funnelCompare.periodA | 기간 A | Period A |
| funnelCompare.periodB | 기간 B | Period B |
| funnelCompare.start | 시작일 | Start |
| funnelCompare.end | 종료일 | End |
| funnelCompare.compare | 비교 실행 | Compare |
| funnelCompare.diff | 차이 | Diff |
| funnelCompare.improved | 개선 | Improved |
| funnelCompare.declined | 악화 | Declined |
| funnelCompare.noChange | 변화 없음 | No Change |
| funnelCompare.totalUsers | 전체 사용자 | Total Users |
| funnelCompare.noData | 데이터를 먼저 업로드하세요 | Upload data first |
| funnelCompare.noDataDesc | CSV를 업로드하면 퍼널을 비교할 수 있습니다 | Upload a CSV to compare funnels |
| funnelCompare.emptyHint | 기간과 스텝을 설정하고 비교를 실행하세요 | Set periods and steps, then run comparison |
| funnelCompare.addStep | 스텝 추가 | Add Step |
| funnelCompare.selectEvent | 이벤트 선택 | Select event |

---

## 3. Implementation Order

| # | ID | Task | File(s) |
|---|-----|------|---------|
| 1 | FC-1 | Add compareFunnels + types | lib/funnelEngine.ts |
| 2 | FC-2 | Create FunnelComparison page | pages/FunnelComparison.tsx |
| 3 | FC-3 | Add Icons, route, sidebar | Icons.tsx, router.tsx, Sidebar.tsx |
| 4 | FC-4 | Add i18n keys (ko + en) | locales/ko/pages.json, locales/en/pages.json, locales/ko/common.json, locales/en/common.json |

---

## 4. Verification Checklist

| # | ID | Item | Expected |
|---|-----|------|----------|
| 1 | FC-1 | FunnelComparisonStep type exists | usersA/B, rateA/B, diff, direction |
| 2 | FC-1 | FunnelComparisonResult type exists | steps, totalUsersA/B |
| 3 | FC-1 | compareFunnels function exported | Takes 2 FunnelStep[], returns FunnelComparisonResult |
| 4 | FC-1 | diff = rateB - rateA | Percentage point difference |
| 5 | FC-1 | direction logic correct | up/down/same with threshold |
| 6 | FC-2 | Period A date inputs | start + end |
| 7 | FC-2 | Period B date inputs | start + end |
| 8 | FC-2 | Step selector with add/remove | Input + Plus button + X remove |
| 9 | FC-2 | Compare button triggers comparison | onClick handler |
| 10 | FC-2 | Comparison table shows all steps | Step, A rate, B rate, diff, direction |
| 11 | FC-2 | Direction indicators | TrendingUp green, TrendingDown red |
| 12 | FC-2 | Summary stats (totalUsersA/B) | 2 KPI cards |
| 13 | FC-2 | Grouped BarChart (A vs B) | 2 bars per step |
| 14 | FC-2 | ChartDownloadButton on chart | Ref + filename |
| 15 | FC-2 | Empty state when no data | Icon + text |
| 16 | FC-2 | Pre-comparison placeholder | ChartSkeleton or hint |
| 17 | FC-3 | GitCompareArrows in Icons.tsx | Import + export |
| 18 | FC-3 | Lazy import in router.tsx | lazy(() => import(...)) |
| 19 | FC-3 | Route path: funnel-compare | Under /app/* |
| 20 | FC-3 | Sidebar menu item | GitCompareArrows icon |
| 21 | FC-4 | 18 i18n keys in ko/pages.json | funnelCompare.* |
| 22 | FC-4 | 18 i18n keys in en/pages.json | Matching English |
| 23 | FC-4 | nav.funnelCompare in ko/common.json | 퍼널 비교 |
| 24 | FC-4 | nav.funnelCompare in en/common.json | Funnel Compare |

---

## 5. Out of Scope

- 3개 이상 기간 비교
- 자동 기간 추천
- 통계적 유의성 검정
- 시간 분석 비교 (timeStats)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-13 | Initial design | Claude |
