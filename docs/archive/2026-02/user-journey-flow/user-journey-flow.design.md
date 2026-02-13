# User Journey Flow — Design

> **Feature**: user-journey-flow
> **Plan**: [user-journey-flow.plan.md](../../01-plan/features/user-journey-flow.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture Overview

processedData에서 사용자별 이벤트 시퀀스를 추출하고, 연속 이벤트 쌍을 집계하여 Recharts Sankey 다이어그램으로 렌더링합니다.

### Layer Mapping

| Layer | File | Changes |
|-------|------|---------|
| Engine | lib/journeyEngine.ts | New: 여정 흐름 계산 엔진 |
| Page | pages/UserJourneyFlow.tsx | New: Sankey 다이어그램 페이지 |
| Route | router.tsx | `/app/journey` 라우트 추가 |
| Nav | components/Sidebar.tsx | ArrowRightLeft 아이콘 메뉴 추가 |
| i18n | locales/ko/pages.json, locales/en/pages.json | New keys |

---

## 2. Detailed Design

### UJ-1: Journey Engine

**File**: `lib/journeyEngine.ts`

#### 1.1 Types

```typescript
type JourneyNode = {
  name: string;
};

type JourneyLink = {
  source: number;
  target: number;
  value: number;
};

type JourneyFlowData = {
  nodes: JourneyNode[];
  links: JourneyLink[];
  totalUsers: number;
  totalTransitions: number;
};

type JourneyOptions = {
  maxSteps: number;       // default 5
  minFlowPct: number;     // default 1 (%)
};
```

#### 1.2 Core Function

```typescript
export function buildJourneyFlow(
  processedData: ProcessedEvent[],
  options: JourneyOptions
): JourneyFlowData
```

Algorithm:
1. Group events by userId, sort by timestamp
2. For each user, take first `maxSteps` events
3. For each consecutive pair (events[i], events[i+1]), create step-prefixed node names:
   - `"Step 1: eventA"`, `"Step 2: eventB"` (to allow same event at different positions)
4. Count transitions: Map<`${sourceNode}→${targetNode}`, number>
5. Filter links below minFlowPct threshold
6. Build nodes array (unique names from filtered links) and links array (source/target as node indices)
7. Return { nodes, links, totalUsers, totalTransitions }

Key decisions:
- Step-prefixed nodes prevent Sankey loops (same event appearing at different positions)
- MinFlowPct filters noise from rare transitions
- No custom event resolution (operates on raw eventName only)

### UJ-2: UserJourneyFlow Page

**File**: `pages/UserJourneyFlow.tsx`

#### 2.1 Layout

```
┌─────────────────────────────────────────────┐
│ Title + Description                          │
├─────────────────────────────────────────────┤
│ Controls: Max Steps [3-8] | Min Flow [0-10%] │
│           [분석 실행] button                   │
├─────────────────────────────────────────────┤
│ Stats: Total Users | Total Transitions       │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │           Sankey Diagram                 │ │
│ │           (h-[500px])                    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### 2.2 Implementation

```tsx
import { Sankey, Tooltip } from 'recharts';

// State
const [maxSteps, setMaxSteps] = useState(5);
const [minFlowPct, setMinFlowPct] = useState(1);
const [flowData, setFlowData] = useState<JourneyFlowData | null>(null);

// Calculate
const handleCalculate = useCallback(() => {
  const data = filterCount > 0 ? filteredData : processedData;
  const result = buildJourneyFlow(data, { maxSteps, minFlowPct });
  setFlowData(result);
}, [processedData, filteredData, filterCount, maxSteps, minFlowPct]);

// Render Sankey
<Sankey
  width={containerWidth}
  height={500}
  data={flowData}
  nodePadding={30}
  nodeWidth={10}
  linkCurvature={0.5}
  node={<CustomNode />}
  link={{ stroke: CHART_COLORS.accent }}
>
  <Tooltip />
</Sankey>
```

#### 2.3 Custom Node

```tsx
const CustomNode = ({ x, y, width, height, payload }: SankeyNodeProps) => {
  const label = payload.name.replace(/^Step \d+: /, '');
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={2} />
      <text x={x + width + 6} y={y + height / 2} dy={4} fontSize={11} fill="#94a3b8">
        {label}
      </text>
    </g>
  );
};
```

#### 2.4 Empty State

데이터 없으면 ArrowRightLeft 아이콘 + 안내 텍스트.

### UJ-3: Route + Sidebar

**File**: `router.tsx`

```typescript
const UserJourneyFlow = lazy(() => import('./pages/UserJourneyFlow').then(m => ({ default: m.UserJourneyFlow })));
// Route: { path: 'journey', element: <Suspense ...><UserJourneyFlow /></Suspense> }
```

**File**: `components/Sidebar.tsx`

```typescript
// Add after ab-test menu item:
{ path: '/app/journey', icon: ArrowRightLeft, labelKey: 'nav.journey' },
```

### UJ-4: i18n Keys

**Files**: `locales/ko/pages.json`, `locales/en/pages.json`

| Key | Korean | English |
|-----|--------|---------|
| nav.journey | 사용자 여정 | User Journey |
| journey.title | 사용자 여정 흐름 | User Journey Flow |
| journey.desc | 이벤트 간 전환 흐름을 Sankey 다이어그램으로 시각화합니다 | Visualize event transition flows as a Sankey diagram |
| journey.maxSteps | 최대 스텝 수 | Max Steps |
| journey.minFlow | 최소 흐름 비율 | Min Flow % |
| journey.calculate | 분석 실행 | Analyze |
| journey.totalUsers | 분석 대상 사용자 | Users Analyzed |
| journey.totalTransitions | 전환 수 | Transitions |
| journey.noData | 데이터를 먼저 업로드하세요 | Upload data first |
| journey.noDataDesc | CSV를 업로드하면 사용자 여정을 분석할 수 있습니다 | Upload a CSV to analyze user journeys |
| journey.emptyHint | 설정을 조정하고 분석을 실행하세요 | Adjust settings and run analysis |
| journey.noResults | 조건에 맞는 흐름이 없습니다. 최소 흐름 비율을 낮춰 보세요 | No flows match criteria. Try lowering the min flow % |

---

## 3. Implementation Order

| # | ID | Task | File(s) |
|---|-----|------|---------|
| 1 | UJ-1 | Create journeyEngine.ts | lib/journeyEngine.ts |
| 2 | UJ-2 | Create UserJourneyFlow page | pages/UserJourneyFlow.tsx |
| 3 | UJ-3 | Add route + sidebar menu | router.tsx, Sidebar.tsx |
| 4 | UJ-4 | Add i18n keys (ko + en) | locales/ko/pages.json, locales/en/pages.json |

---

## 4. Verification Checklist

| # | ID | Item | Expected |
|---|-----|------|----------|
| 1 | UJ-1 | journeyEngine.ts exists | buildJourneyFlow export |
| 2 | UJ-1 | Step-prefixed node names | "Step N: eventName" format |
| 3 | UJ-1 | maxSteps limits event sequence length | First N events per user |
| 4 | UJ-1 | minFlowPct filters low-frequency links | Filter by % of total transitions |
| 5 | UJ-1 | Returns JourneyFlowData shape | { nodes, links, totalUsers, totalTransitions } |
| 6 | UJ-2 | UserJourneyFlow page exists | Named export |
| 7 | UJ-2 | maxSteps control (3-8 range) | Input or select |
| 8 | UJ-2 | minFlowPct control (0-10 range) | Input or select |
| 9 | UJ-2 | Calculate button triggers buildJourneyFlow | onClick handler |
| 10 | UJ-2 | Recharts Sankey rendered with flowData | <Sankey data={flowData} /> |
| 11 | UJ-2 | Custom node renders event name label | rect + text |
| 12 | UJ-2 | Tooltip on hover | <Tooltip /> inside Sankey |
| 13 | UJ-2 | Stats cards (totalUsers + totalTransitions) | 2 KPI cards |
| 14 | UJ-2 | Empty state when no data | ArrowRightLeft icon + text |
| 15 | UJ-2 | No results state when flowData empty | Hint to lower minFlowPct |
| 16 | UJ-2 | FilterPanel integration | useFilteredData |
| 17 | UJ-3 | Lazy import in router.tsx | lazy(() => import(...)) |
| 18 | UJ-3 | Route path: 'journey' | Under /app/* |
| 19 | UJ-3 | Sidebar menu item | ArrowRightLeft icon, nav.journey |
| 20 | UJ-4 | 12 i18n keys in ko/pages.json | journey.* namespace |
| 21 | UJ-4 | 12 i18n keys in en/pages.json | journey.* namespace |
| 22 | UJ-4 | nav.journey key in ko/common.json or pages.json | "사용자 여정" |
| 23 | UJ-4 | nav.journey key in en/common.json or pages.json | "User Journey" |

---

## 5. Out of Scope

- 세션 기반 분석 (sessionId 선택적)
- 사용자 개별 여정 추적
- Sankey 노드 드래그/재배치
- 시간대별 여정 비교
- ChartDownloadButton (향후 추가 가능)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-13 | Initial design | Claude |
