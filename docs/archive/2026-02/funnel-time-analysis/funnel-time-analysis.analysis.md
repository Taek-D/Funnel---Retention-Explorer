# funnel-time-analysis -- Gap Analysis

> **Date**: 2026-02-13
> **Design Document**: docs/02-design/features/funnel-time-analysis.design.md
> **Match Rate**: 100% (19/19)

---

## Verification Results

| # | ID | Item | Expected | Actual | Result |
|---|-----|------|----------|--------|:------:|
| 1 | FT-1 | FunnelTimeStats type exists | `{ median, p10, p90, mean, count }` | types/index.ts L243-249: `interface FunnelTimeStats { median: number; p10: number; p90: number; mean: number; count: number; }` | PASS |
| 2 | FT-1 | FunnelStep.timeStats field exists | Optional FunnelTimeStats | types/index.ts L258: `timeStats?: FunnelTimeStats;` | PASS |
| 3 | FT-1 | FunnelStep.medianTime still exists | Backward compatibility | types/index.ts L257: `medianTime?: number;` preserved alongside timeStats | PASS |
| 4 | FT-1 | calculateTimeBetweenSteps returns FunnelTimeStats | p10/p90/mean/count computed | funnelEngine.ts L69-102: function returns `{ median, p10, p90, mean, count: times.length }` | PASS |
| 5 | FT-1 | Percentile calculation correct | p10 = 10th percentile, p90 = 90th | funnelEngine.ts L97-98: `p10 = times[Math.floor(times.length * 0.1)]`, `p90 = times[Math.floor(times.length * 0.9)]` | PASS |
| 6 | FT-1 | Empty times returns zeros | All stats = 0, count = 0 | funnelEngine.ts L72-73: `const zero: FunnelTimeStats = { median: 0, p10: 0, p90: 0, mean: 0, count: 0 }; if (userSet.size === 0) return zero;` + L93: `if (times.length === 0) return zero;` | PASS |
| 7 | FT-2 | Time distribution chart renders | BarChart layout="vertical" | FunnelAnalysis.tsx L551: `<BarChart layout="vertical" data={timeChartData}>` | PASS |
| 8 | FT-2 | Chart shows step transition labels | "StepA -> StepB" format | FunnelAnalysis.tsx L531: `` label: `${funnelResults[i].step} -> ${step.step}` `` | PASS |
| 9 | FT-2 | Median bar visible per step | Primary colored bar | FunnelAnalysis.tsx L589-593: `<Bar dataKey="median" name="Median">` with `CHART_COLORS.accent` fill via Cell | PASS |
| 10 | FT-2 | P10/P90 range visible | Lighter/wider range indicator | FunnelAnalysis.tsx L584-588: `<Bar dataKey="p90" opacity={0.2}>` renders P90 bar with 20% opacity as a lighter range | PASS |
| 11 | FT-2 | Bottleneck step highlighted | Different color (red/coral) | FunnelAnalysis.tsx L586,591: `fill={entry.isBottleneck ? '#ef4444' : CHART_COLORS.accent}` -- `#ef4444` is red-500, same result as design's `dropoffColor(80)` | PASS |
| 12 | FT-2 | Bottleneck = step with highest median | Auto-detected | FunnelAnalysis.tsx L539-540: `maxMedian = Math.max(...)` then `d.isBottleneck = d.median === maxMedian && maxMedian > 0 && timeChartData.length > 1` | PASS |
| 13 | FT-2 | Bottleneck insight text shown | AlertTriangle + text below chart | FunnelAnalysis.tsx L597-602: `{bottleneck && (<div className="...text-amber-400"><AlertTriangle size={14}/><span>{t('funnel.bottleneckHint', ...)}</span></div>)}` | PASS |
| 14 | FT-2 | Custom Tooltip shows all stats | p10, median, p90, mean, count | FunnelAnalysis.tsx L569-582: Tooltip content renders all 5 stats with `t('funnel.timeP10')` through `t('funnel.timeCount')` labels | PASS |
| 15 | FT-2 | No chart when no time data | noTimeData message or hidden | FunnelAnalysis.tsx L527: `{funnelResults.some(s => s.timeStats && s.timeStats.count > 0) && ...}` -- section hidden when no time data; `noTimeData` i18n key exists but unused (hidden approach chosen) | PASS |
| 16 | FT-3 | timeChartRef attached | useRef\<HTMLDivElement\> | FunnelAnalysis.tsx L38: `const timeChartRef = useRef<HTMLDivElement>(null);` + L549: `<div ref={timeChartRef}>` | PASS |
| 17 | FT-3 | ChartDownloadButton for time chart | filename="funnel-time-analysis" | FunnelAnalysis.tsx L547: `<ChartDownloadButton targetRef={timeChartRef} filename="funnel-time-analysis" />` | PASS |
| 18 | FT-4 | 8 i18n keys in ko/pages.json | funnel.timeAnalysis, timeP10, timeP90, timeMean, timeMedian, timeCount, bottleneckHint, noTimeData | All 8 keys present at lines 291-298 with correct Korean values matching design exactly | PASS |
| 19 | FT-4 | 8 i18n keys in en/pages.json | Matching English translations | All 8 keys present at lines 291-298 with correct English values matching design exactly | PASS |

---

## Summary

- **Total**: 19
- **Match (PASS)**: 19
- **Gap (FAIL)**: 0
- **Partial**: 0
- **Match Rate**: 100%

---

## Implementation Notes

1. **Item #11 -- Bottleneck color**: Design specifies `CHART_COLORS.dropoffColor(80)` which evaluates to `'#ef4444'`. Implementation uses `'#ef4444'` directly. Functionally identical, no gap.

2. **Item #12 -- Additional guard**: Implementation adds `timeChartData.length > 1` to the bottleneck condition, preventing a single-transition funnel from being incorrectly flagged as a bottleneck. This is a strict improvement over the design.

3. **Item #15 -- Hidden vs message**: Design allows "noTimeData message or hidden". Implementation chose the hidden approach (conditional rendering). The `funnel.noTimeData` i18n key is defined but not referenced in code. This is a valid design choice with no functional gap.

4. **Engine integration**: `_calculateFunnel` at funnelEngine.ts L56-63 calls `calculateTimeBetweenSteps` and assigns both `stepData.medianTime = stats.median` (backward compat) and `stepData.timeStats = stats` (new), matching the design exactly.

---

## Files Analyzed

| File | Path |
|------|------|
| Design | `E:\...\docs\02-design\features\funnel-time-analysis.design.md` |
| Types | `E:\...\funnel-&-retention-explorer frontend\types\index.ts` (L243-258) |
| Engine | `E:\...\funnel-&-retention-explorer frontend\lib\funnelEngine.ts` (L56-102) |
| Page | `E:\...\funnel-&-retention-explorer frontend\pages\FunnelAnalysis.tsx` (L38, L527-605) |
| i18n (ko) | `E:\...\funnel-&-retention-explorer frontend\locales\ko\pages.json` (L291-298) |
| i18n (en) | `E:\...\funnel-&-retention-explorer frontend\locales\en\pages.json` (L291-298) |
| Constants | `E:\...\funnel-&-retention-explorer frontend\lib\constants.ts` (L136-141) |
