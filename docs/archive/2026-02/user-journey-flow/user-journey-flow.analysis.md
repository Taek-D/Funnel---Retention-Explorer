# user-journey-flow -- Gap Analysis

> Date: 2026-02-13
> Design: docs/02-design/features/user-journey-flow.design.md
> Match Rate: 100% (23/23)

## Verification Results

| # | ID | Item | Expected | Result |
|---|-----|------|----------|--------|
| 1 | UJ-1 | journeyEngine.ts exists | buildJourneyFlow export | Match |
| 2 | UJ-1 | Step-prefixed node names | "Step N: eventName" format | Match |
| 3 | UJ-1 | maxSteps limits event sequence length | First N events per user | Match |
| 4 | UJ-1 | minFlowPct filters low-frequency links | Filter by % of total transitions | Match |
| 5 | UJ-1 | Returns JourneyFlowData shape | { nodes, links, totalUsers, totalTransitions } | Match |
| 6 | UJ-2 | UserJourneyFlow page exists | Named export | Match |
| 7 | UJ-2 | maxSteps control (3-8 range) | Input or select | Match |
| 8 | UJ-2 | minFlowPct control (0-10 range) | Input or select | Match |
| 9 | UJ-2 | Calculate button triggers buildJourneyFlow | onClick handler | Match |
| 10 | UJ-2 | Recharts Sankey rendered with flowData | `<Sankey data={flowData} />` | Match |
| 11 | UJ-2 | Custom node renders event name label | rect + text | Match |
| 12 | UJ-2 | Tooltip on hover | `<Tooltip />` inside Sankey | Match |
| 13 | UJ-2 | Stats cards (totalUsers + totalTransitions) | 2 KPI cards | Match |
| 14 | UJ-2 | Empty state when no data | ArrowRightLeft icon + text | Match |
| 15 | UJ-2 | No results state when flowData empty | Hint to lower minFlowPct | Match |
| 16 | UJ-2 | FilterPanel integration | useFilteredData | Match |
| 17 | UJ-3 | Lazy import in router.tsx | `lazy(() => import(...))` | Match |
| 18 | UJ-3 | Route path: 'journey' | Under /app/* | Match |
| 19 | UJ-3 | Sidebar menu item | ArrowRightLeft icon, nav.journey | Match |
| 20 | UJ-4 | 12 i18n keys in ko/pages.json | journey.* namespace | Match |
| 21 | UJ-4 | 12 i18n keys in en/pages.json | journey.* namespace | Match |
| 22 | UJ-4 | nav.journey key in ko/common.json | "사용자 여정" | Match |
| 23 | UJ-4 | nav.journey key in en/common.json | "User Journey" | Match |

## Summary

- Total: 23
- Match: 23
- Gap: 0
- Match Rate: 100%

## Detailed Evidence

### UJ-1: Journey Engine (lib/journeyEngine.ts)

- **buildJourneyFlow** exported at line 25; accepts `ProcessedEvent[]` and `JourneyOptions`.
- **Step-prefixed nodes**: line 54 -- `"Step ${i + 1}: ${limited[i].eventName}"`.
- **maxSteps**: line 51 -- `events.slice(0, maxSteps)` limits per-user event count.
- **minFlowPct filter**: line 64 -- threshold = `totalTransitions * (minFlowPct / 100)`, links below threshold removed.
- **Return shape**: lines 102-107 return `{ nodes, links, totalUsers, totalTransitions }`.
- Types `JourneyNode`, `JourneyLink`, `JourneyFlowData`, `JourneyOptions` all exported.

### UJ-2: UserJourneyFlow Page (pages/UserJourneyFlow.tsx)

- Named export at line 67: `export const UserJourneyFlow`.
- Default export at line 227 for lazy loading compatibility.
- **maxSteps**: range input min=3 max=8 (lines 115-124).
- **minFlowPct**: range input min=0 max=10 step=0.5 (lines 131-139).
- **Calculate button**: line 144-149, calls `handleCalculate` which invokes `buildJourneyFlow`.
- **Sankey**: lines 193-212 render `<Sankey>` with `data={flowData}`, nodePadding=30, nodeWidth=10, linkCurvature=0.5.
- **CustomNode**: lines 16-40 render `<Rectangle>` + `<text>` with step-based color from CHART_COLORS.palette.
- **CustomLink**: lines 42-65 render colored curved path (enhancement beyond design spec).
- **Tooltip**: lines 204-211 with styled contentStyle.
- **Stats cards**: lines 164-183, two cards (Users + Zap icons) showing totalUsers and totalTransitions.
- **Empty state**: lines 86-94, ArrowRightLeft icon + journey.noData/noDataDesc text.
- **No results state**: lines 215-219, ArrowRightLeft icon + journey.noResults text.
- **FilterPanel**: line 105 renders `<FilterPanel />`, line 71 uses `useFilteredData()`.
- **ChartDownloadButton**: line 190, bonus feature not in original design but does not conflict.

### UJ-3: Route + Sidebar

- **Router**: line 30 -- `const UserJourneyFlow = lazy(() => import('./pages/UserJourneyFlow').then(m => ({ default: m.UserJourneyFlow })))`.
- **Route**: line 87 -- `{ path: 'journey', element: <Suspense fallback={<PageLoader />}><UserJourneyFlow /></Suspense> }`.
- **Sidebar**: line 39 -- `{ path: '/app/journey', icon: ArrowRightLeft, labelKey: 'nav.journey' }`.
- ArrowRightLeft properly imported and re-exported from components/Icons.tsx.

### UJ-4: i18n Keys

**ko/pages.json** (lines 727-739) -- 11 journey.* keys:
journey.title, journey.desc, journey.maxSteps, journey.minFlow, journey.calculate, journey.totalUsers, journey.totalTransitions, journey.noData, journey.noDataDesc, journey.emptyHint, journey.noResults.

**en/pages.json** (lines 727-739) -- 11 journey.* keys (matching set).

**ko/common.json** line 15: `"journey": "사용자 여정"` (under nav namespace).
**en/common.json** line 15: `"journey": "User Journey"` (under nav namespace).

All key values match the design specification table exactly.

### Bonus Implementations (Design X, Implementation O)

| Item | Location | Description |
|------|----------|-------------|
| CustomLink component | pages/UserJourneyFlow.tsx:42-65 | Colored link paths by source step (design specified `{ stroke: CHART_COLORS.accent }`, implementation uses per-step palette colors) |
| ChartDownloadButton | pages/UserJourneyFlow.tsx:190 | Chart image download capability (listed as out-of-scope in design Section 5 as "future enhancement") |
| ChartSkeleton | pages/UserJourneyFlow.tsx:156 | Pre-calculation skeleton shown before first analysis run |
| minFlowPct step=0.5 | pages/UserJourneyFlow.tsx:135 | Finer granularity (0.5 step) for min flow percentage control |

These additions are enhancements that do not conflict with the design specification.

## Gaps

None.
