# funnel-comparison Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Funnel & Retention Explorer
> **Analyst**: Claude
> **Date**: 2026-02-13
> **Design Doc**: [funnel-comparison.design.md](../02-design/features/funnel-comparison.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify that the `funnel-comparison` feature implementation matches the design document's 24-item verification checklist. This is the Check phase of the PDCA cycle.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/funnel-comparison.design.md`
- **Implementation Files**:
  - `funnel-&-retention-explorer frontend/lib/funnelEngine.ts`
  - `funnel-&-retention-explorer frontend/pages/FunnelComparison.tsx`
  - `funnel-&-retention-explorer frontend/components/Icons.tsx`
  - `funnel-&-retention-explorer frontend/router.tsx`
  - `funnel-&-retention-explorer frontend/components/Sidebar.tsx`
  - `funnel-&-retention-explorer frontend/locales/ko/pages.json`
  - `funnel-&-retention-explorer frontend/locales/en/pages.json`
  - `funnel-&-retention-explorer frontend/locales/ko/common.json`
  - `funnel-&-retention-explorer frontend/locales/en/common.json`
- **Analysis Date**: 2026-02-13

---

## 2. Verification Checklist Results

### FC-1: Comparison Engine (`lib/funnelEngine.ts`)

| # | Item | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 1 | FunnelComparisonStep type exists | usersA/B, rateA/B, diff, direction | Type at line 170-179: step, stepNumber, usersA, usersB, rateA, rateB, diff, direction (all present) | PASS |
| 2 | FunnelComparisonResult type exists | steps, totalUsersA/B | Type at line 181-185: steps (FunnelComparisonStep[]), totalUsersA, totalUsersB | PASS |
| 3 | compareFunnels function exported | Takes 2 FunnelStep[], returns FunnelComparisonResult | `export function compareFunnels(resultA: FunnelStep[], resultB: FunnelStep[]): FunnelComparisonResult` at line 187 | PASS |
| 4 | diff = rateB - rateA | Percentage point difference | Line 199: `const diff = rateB - rateA;` | PASS |
| 5 | direction logic correct | up/down/same with threshold | Line 209: `diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'same'` matches design threshold of 0.5pp | PASS |

### FC-2: FunnelComparison Page (`pages/FunnelComparison.tsx`)

| # | Item | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 6 | Period A date inputs | start + end | Lines 89-107: Two `<input type="date">` for periodA.start and periodA.end | PASS |
| 7 | Period B date inputs | start + end | Lines 110-132: Two `<input type="date">` for periodB.start and periodB.end | PASS |
| 8 | Step selector with add/remove | Input + Plus button + X remove | Lines 136-180: `<select>` dropdown + Plus button (handleAddStep) + X button per step (handleRemoveStep) | PASS |
| 9 | Compare button triggers comparison | onClick handler | Lines 173-179: `<button onClick={handleCompare}>` with canCompare guard | PASS |
| 10 | Comparison table shows all steps | Step, A rate, B rate, diff, direction | Lines 198-227: Full table with Step, Period A %, Period B %, diff (pp), direction icon | PASS |
| 11 | Direction indicators | TrendingUp green, TrendingDown red | Lines 219-221: TrendingUp with `text-accent`, TrendingDown with `text-coral`, dash for same | PASS |
| 12 | Summary stats (totalUsersA/B) | 2 KPI cards | Lines 186-195: Two grid cards showing `result.totalUsersA` and `result.totalUsersB` with locale formatting | PASS |
| 13 | Grouped BarChart (A vs B) | 2 bars per step | Lines 236-249: `<BarChart>` with `<Bar dataKey="rateA">` and `<Bar dataKey="rateB">` using CHART_COLORS.palette[0] and [1] | PASS |
| 14 | ChartDownloadButton on chart | Ref + filename | Line 233: `<ChartDownloadButton chartRef={chartRef} filename="funnel-comparison" />` with `chartRef` on wrapping div | PASS |
| 15 | Empty state when no data | Icon + text | Lines 67-73: GitCompareArrows icon (size 48) + `funnelCompare.noData` + `funnelCompare.noDataDesc` | PASS |
| 16 | Pre-comparison placeholder | ChartSkeleton or hint | Lines 253-255: Text hint using `funnelCompare.emptyHint` (design allowed "ChartSkeleton or hint") | PASS |

### FC-3: Route + Sidebar + Icons

| # | Item | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 17 | GitCompareArrows in Icons.tsx | Import + export | Line 76 (import) + Line 154 (export): `GitCompareArrows` from lucide-react | PASS |
| 18 | Lazy import in router.tsx | lazy(() => import(...)) | Line 31: `const FunnelComparison = lazy(() => import('./pages/FunnelComparison').then(m => ({ default: m.FunnelComparison })));` | PASS |
| 19 | Route path: funnel-compare | Under /app/* | Line 89: `{ path: 'funnel-compare', element: <Suspense ...><FunnelComparison /></Suspense> }` | PASS |
| 20 | Sidebar menu item | GitCompareArrows icon | Line 40: `{ path: '/app/funnel-compare', icon: GitCompareArrows, labelKey: 'nav.funnelCompare' }` | PASS |

### FC-4: i18n Keys

| # | Item | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 21 | 18 i18n keys in ko/pages.json | funnelCompare.* | 17 keys found (title, desc, periodA, periodB, start, end, compare, diff, improved, declined, noChange, totalUsers, noData, noDataDesc, emptyHint, addStep, selectEvent). Design table lists 17 funnelCompare.* keys; checklist text says "18" but the actual specification table enumerates 17. All values match Korean translations. | PASS |
| 22 | 18 i18n keys in en/pages.json | Matching English | 17 keys found, all matching English translations from design table exactly. Same count as Korean. | PASS |
| 23 | nav.funnelCompare in ko/common.json | Value: "퍼널 비교" | Line 16 in ko/common.json: `"funnelCompare": "퍼널 비교"` | PASS |
| 24 | nav.funnelCompare in en/common.json | Value: "Funnel Compare" | Line 16 in en/common.json: `"funnelCompare": "Funnel Compare"` | PASS |

---

## 3. Detailed Findings

### 3.1 i18n Key Count Discrepancy (Minor)

The checklist items #21 and #22 state "18 i18n keys" but the design table (Section FC-4) enumerates exactly 17 `funnelCompare.*` keys plus 1 `nav.funnelCompare` key (total 18 across both namespaces). The implementation has 17 `funnelCompare.*` keys in pages.json and 1 `nav.funnelCompare` in common.json, which matches the actual design specification table perfectly. The checklist text "18 i18n keys in ko/pages.json" appears to be an off-by-one in the checklist itself (nav key is in common.json, not pages.json). This is not an implementation gap.

### 3.2 Implementation Enhancements (Design-compatible)

The following implementation details go beyond or refine the design, but remain fully compatible:

| Enhancement | File | Detail |
|-------------|------|--------|
| ResponsiveContainer wrapper | FunnelComparison.tsx:236 | Design showed `<BarChart width={...}>`, implementation uses `<ResponsiveContainer width="100%" height={300}>` for responsive layout -- improvement over design |
| Legend on chart | FunnelComparison.tsx:244 | `<Legend />` added for better readability -- not in design spec but beneficial |
| Rounded bar corners | FunnelComparison.tsx:245-246 | `radius={[4, 4, 0, 0]}` for visual polish |
| Styled Tooltip | FunnelComparison.tsx:241-242 | Custom tooltip styling matching dark theme |
| `pp` unit in diff column | FunnelComparison.tsx:216 | Display as "+6.9pp" instead of just "+6.9" -- adds clarity |
| Select dropdown for events | FunnelComparison.tsx:138-149 | Design shows "Input + Plus button", implementation uses dropdown `<select>` from uniqueEvents -- better UX |

---

## 4. Match Rate Summary

```
+-------------------------------------------------+
|  Overall Match Rate: 100% (24/24 PASS)          |
+-------------------------------------------------+
|  PASS:     24 items (100%)                      |
|  PARTIAL:   0 items (0%)                        |
|  FAIL:      0 items (0%)                        |
+-------------------------------------------------+
```

### Category Breakdown

| Category | Items | Passed | Rate | Status |
|----------|:-----:|:------:|:----:|:------:|
| FC-1: Comparison Engine | 5 | 5 | 100% | PASS |
| FC-2: FunnelComparison Page | 11 | 11 | 100% | PASS |
| FC-3: Route + Sidebar + Icons | 4 | 4 | 100% | PASS |
| FC-4: i18n Keys | 4 | 4 | 100% | PASS |
| **Total** | **24** | **24** | **100%** | **PASS** |

---

## 5. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **100%** | **PASS** |

---

## 6. Architecture Compliance

| File | Layer | Correct Placement | Imports Valid |
|------|-------|:-----------------:|:------------:|
| lib/funnelEngine.ts | Domain/Engine | PASS | PASS (imports from types, constants, eventUtils, sentry) |
| pages/FunnelComparison.tsx | Presentation | PASS | PASS (imports from Icons, context, lib, components) |
| components/Icons.tsx | Presentation | PASS | PASS (re-exports from lucide-react) |
| router.tsx | Presentation | PASS | PASS (lazy imports of pages) |
| components/Sidebar.tsx | Presentation | PASS | PASS (imports from Icons, context, hooks, components) |

No dependency direction violations found.

---

## 7. Convention Compliance

| Convention | Check | Status |
|-----------|-------|--------|
| Component: PascalCase | FunnelComparison.tsx | PASS |
| Function: camelCase | compareFunnels, handleCompare, handleAddStep, handleRemoveStep | PASS |
| File (page): PascalCase.tsx | FunnelComparison.tsx | PASS |
| File (lib): camelCase.ts | funnelEngine.ts | PASS |
| Type export: `export type` | FunnelComparisonStep, FunnelComparisonResult | PASS |
| i18n key: dot notation | funnelCompare.title, nav.funnelCompare, etc. | PASS |
| Tailwind CSS (no inline styles) | All styling via class names | PASS |
| Korean UI text via i18n | All user-facing text uses t() | PASS |
| Icon re-export via Icons.tsx | GitCompareArrows, Plus, X, TrendingUp, TrendingDown | PASS |

---

## 8. Recommended Actions

No actions required. Implementation fully matches design.

### Documentation Note

The design checklist items #21 and #22 state "18 i18n keys in pages.json" but the specification table only defines 17 `funnelCompare.*` keys for pages.json (the 18th key `nav.funnelCompare` belongs to common.json). This is a minor documentation inconsistency in the design document itself, not an implementation gap.

---

## 9. Next Steps

- [x] Gap analysis complete -- 100% match rate
- [ ] Write completion report (`funnel-comparison.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-13 | Initial analysis -- 24/24 PASS, 100% match | Claude |
