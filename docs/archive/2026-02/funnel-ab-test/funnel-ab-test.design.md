# Funnel A/B Test — Design

## 1. Overview

세그먼트별 퍼널을 나란히 비교하고 통계적 유의미성을 판정하는 A/B 테스트 페이지.

## 2. Data Model

### 2.1 TypeScript Types (types/index.ts)

```typescript
export type ABSegmentFilter = 'platform' | 'channel' | 'custom';

export interface ABTestSegment {
  filter: ABSegmentFilter;
  value: string;
  label: string;
}

export interface ABTestStepResult {
  step: string;
  usersA: number;
  usersB: number;
  rateA: number;
  rateB: number;
  diff: number;
  pValue: number;
  ci95: [number, number];
  significant: boolean;
}

export interface ABTestResult {
  segmentA: ABTestSegment;
  segmentB: ABTestSegment;
  steps: ABTestStepResult[];
  overallPValue: number;
  overallSignificant: boolean;
  sampleSizeA: number;
  sampleSizeB: number;
  winner: 'A' | 'B' | 'none';
  recommendedSampleSize: number;
}
```

## 3. Implementation

### AB-1: A/B Test Engine (lib/abTestEngine.ts)

New file: `lib/abTestEngine.ts`

```typescript
export function runABTest(
  data: ProcessedEvent[],
  steps: string[],
  segmentA: ABTestSegment,
  segmentB: ABTestSegment
): ABTestResult
```

**Logic**:
1. Filter `data` by segmentA → `dataA`, by segmentB → `dataB`
   - platform/channel: simple equality filter on `e.platform` / `e.channel`
   - custom: use `resolveCustomEvent` from eventResolver to get matching user IDs
2. Calculate step-by-step funnel for each segment using `calculateSegmentFunnel` from segmentEngine
3. For each step, calculate:
   - `rateA`, `rateB`: conversion rates from step 0
   - `diff`: rateA - rateB
   - `pValue`: 2-proportion z-test (reuse segmentEngine's `calculatePValue` — export it)
   - `ci95`: Wilson score confidence interval for the difference
   - `significant`: pValue < 0.05
4. Overall result:
   - `overallPValue`: p-value of final step conversion
   - `winner`: 'A' if rateA > rateB && significant, 'B' if rateB > rateA && significant, else 'none'
   - `recommendedSampleSize`: `calculateRequiredSampleSize(rateA, rateB)` for 80% power

**Helper functions**:
```typescript
export function calculateConfidenceInterval(
  successes: number, total: number, z?: number
): [number, number]

export function calculateRequiredSampleSize(
  rateA: number, rateB: number, alpha?: number, power?: number
): number

export function filterBySegment(
  data: ProcessedEvent[], segment: ABTestSegment
): ProcessedEvent[]
```

**Note**: Export `calculatePValue` from segmentEngine.ts (currently unexported private function).

### AB-2: A/B Test Page (pages/ABTestPage.tsx)

Route: `/app/ab-test`, lazy loaded.

**UI Layout**:
```
┌──────────────────────────────────────────────────────┐
│ Funnel A/B Test                         [Export ▼]   │
│ Compare conversion funnels between segments          │
├──────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────┐     │
│ │ Segment A           │ │ Segment B           │     │
│ │ [Platform ▼] [iOS]  │ │ [Platform ▼] [And]  │     │
│ └─────────────────────┘ └─────────────────────┘     │
│                                                      │
│ Funnel Steps: [signup ▼] [activate ▼] [purchase ▼]  │
│ [+ Add Step]                       [Run A/B Test]   │
├──────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│ │ Winner       │ │ Confidence   │ │ Sample Size  │  │
│ │ Segment A    │ │ 95.2%        │ │ A:523 B:487  │  │
│ │ iOS          │ │ p=0.023      │ │ Need: 1,200  │  │
│ └──────────────┘ └──────────────┘ └──────────────┘  │
├──────────────────────────────────────────────────────┤
│ [Grouped Bar Chart - A (blue) vs B (purple)]        │
│                                                      │
│  100%  ██                                            │
│   80%  ██ ██                                         │
│   60%  ██ ██ ██                                      │
│   40%  ██ ██ ██ ██                                   │
│        signup  activate  checkout  purchase           │
├──────────────────────────────────────────────────────┤
│ Step-by-Step Comparison                              │
│ ┌──────────┬───────┬───────┬───────┬───────┬──────┐ │
│ │ Step     │ A     │ B     │ Diff  │p-value│ Sig  │ │
│ ├──────────┼───────┼───────┼───────┼───────┼──────┤ │
│ │ signup   │100.0% │100.0% │  0.0% │ —     │  —   │ │
│ │ activate │ 72.3% │ 61.5% │+10.8% │ 0.023 │ ✓    │ │
│ │ checkout │ 45.1% │ 38.2% │ +6.9% │ 0.082 │  ✗   │ │
│ │ purchase │ 28.7% │ 22.4% │ +6.3% │ 0.041 │ ✓    │ │
│ └──────────┴───────┴───────┴───────┴───────┴──────┘ │
│                                                      │
│ 95% CI: [+1.2%, +11.4%]  Recommended N: 1,200/group │
└──────────────────────────────────────────────────────┘
```

**Components within page**:
1. **Segment Selector**: 2x (A, B) — filter type dropdown (Platform/Channel) + value dropdown
   - Custom events support: if filter='custom', show custom event dropdown
2. **Step Builder**: ordered list of event dropdowns + add/remove (max 8 steps)
3. **Summary Cards**: Winner / Confidence / Sample Size (3 cards)
4. **Grouped Bar Chart**: Recharts BarChart with 2 bars per step (A=CHART_COLORS[0], B=CHART_COLORS[1])
5. **Comparison Table**: step-by-step results with significance badges
6. **CI Footer**: confidence interval text + recommended sample size

**State management**:
- Local state only (no AppContext) — results are ephemeral
- `segmentA`, `segmentB`: ABTestSegment
- `steps`: string[] (funnel steps)
- `result`: ABTestResult | null

**Empty/error states**:
- No data uploaded: FlaskConical icon + message
- No funnel calculated: prompt to select steps
- Insufficient sample size: warning banner

### AB-3: segmentEngine.ts Refactor

Export `calculatePValue` as a named export (currently private function).
No other changes needed — `calculateSegmentFunnel` is already exported.

### AB-4: Route, Sidebar, i18n

**router.tsx**:
```typescript
const ABTestPage = lazy(() => import('./pages/ABTestPage'));
// route: { path: 'ab-test', element: <Suspense><ABTestPage /></Suspense> }
```

**Sidebar.tsx**:
- Add `FlaskConical` icon import
- Add nav item: `{ path: '/app/ab-test', icon: FlaskConical, labelKey: 'nav.abTest' }`
- Position: after `/app/events`, before `/app/insights`

**Icons.tsx**:
- Add `FlaskConical` export

**i18n keys (pages.json ko/en)**:
```json
"abTest": {
  "title": "퍼널 A/B 테스트",
  "desc": "세그먼트별 퍼널 전환율을 비교합니다",
  "segmentA": "세그먼트 A",
  "segmentB": "세그먼트 B",
  "filterType": "필터 유형",
  "platform": "플랫폼",
  "channel": "채널",
  "custom": "커스텀 이벤트",
  "selectValue": "값 선택",
  "funnelSteps": "퍼널 스텝",
  "addStep": "스텝 추가",
  "removeStep": "스텝 제거",
  "runTest": "A/B 테스트 실행",
  "winner": "Winner",
  "noWinner": "유의미한 차이 없음",
  "confidence": "신뢰도",
  "sampleSize": "샘플 크기",
  "recommended": "권장 샘플",
  "stepComparison": "스텝별 비교",
  "step": "스텝",
  "diff": "차이",
  "pValue": "p-value",
  "significant": "유의미",
  "yes": "유의미",
  "no": "비유의미",
  "ci95": "95% 신뢰구간",
  "perGroup": "그룹당",
  "noData": "데이터 없음",
  "noDataDesc": "CSV를 업로드하세요",
  "selectSegments": "비교할 세그먼트 2개를 선택하세요",
  "minSteps": "최소 2개 스텝을 선택하세요",
  "insufficientSample": "표본 크기가 부족합니다",
  "insufficientSampleDesc": "정확한 결과를 위해 그룹당 {{count}}명 이상이 권장됩니다"
}
```

**common.json** (ko/en):
```json
"nav.abTest": "A/B 테스트"
```

## 4. Guest Mode

No special guest handling needed — uses in-memory processedData from AppContext.

## 5. Verification Checklist

| # | Item |
|---|------|
| 1 | AB-1: ABSegmentFilter, ABTestSegment, ABTestStepResult, ABTestResult types in types/index.ts |
| 2 | AB-1: abTestEngine.ts with runABTest() function |
| 3 | AB-1: filterBySegment() handles platform, channel, custom |
| 4 | AB-1: calculateConfidenceInterval() (Wilson score) |
| 5 | AB-1: calculateRequiredSampleSize() (power analysis) |
| 6 | AB-1: Step-by-step p-value + significance calculation |
| 7 | AB-1: Overall winner determination |
| 8 | AB-3: calculatePValue exported from segmentEngine.ts |
| 9 | AB-2: ABTestPage.tsx renders segment A/B selectors |
| 10 | AB-2: Step builder with add/remove (max 8) |
| 11 | AB-2: Summary cards (winner, confidence, sample size) |
| 12 | AB-2: Grouped BarChart with Recharts (2 bars per step) |
| 13 | AB-2: Step-by-step comparison table with significance badges |
| 14 | AB-2: 95% CI display + recommended sample size |
| 15 | AB-2: Empty state (no data / no segments selected) |
| 16 | AB-2: Insufficient sample warning |
| 17 | AB-4: Route /app/ab-test in router.tsx (lazy loaded) |
| 18 | AB-4: Sidebar nav item with FlaskConical icon |
| 19 | AB-4: FlaskConical in Icons.tsx |
| 20 | AB-4: i18n keys in ko/en pages.json (abTest section) |
| 21 | AB-4: nav.abTest in ko/en common.json |
