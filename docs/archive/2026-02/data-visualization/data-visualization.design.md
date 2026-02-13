# Data Visualization Enhancement — Design

> **Feature**: data-visualization
> **Plan**: [data-visualization.plan.md](../../01-plan/features/data-visualization.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture Overview

3개 페이지의 시각화를 고도화하고, 차트 색상 팔레트를 확장합니다.

### Layer Mapping

| Layer | File | Changes |
|-------|------|---------|
| Application | lib/constants.ts | CHART_COLORS palette + dropoffColor |
| Presentation | pages/FunnelAnalysis.tsx | Drop-off chart + toggle |
| Presentation | pages/SegmentComparison.tsx | Recharts BarChart |
| Presentation | pages/RetentionAnalysis.tsx | Heatmap tooltip |
| i18n | locales/ko/pages.json, locales/en/pages.json | New keys |

---

## 2. Detailed Design

### VZ-1: Funnel Drop-off Chart

**File**: `pages/FunnelAnalysis.tsx`

기존 결과 섹션의 BarChart 아래에 스텝 간 이탈률 차트를 추가합니다. FunnelStep 인터페이스에 이미 `dropOff` 필드가 존재합니다.

#### 2.1 Toggle State

```typescript
const [showDropoff, setShowDropoff] = useState(false);
```

#### 2.2 Drop-off Data

```typescript
const dropoffData = useMemo(() =>
  hasResults
    ? funnelResults.slice(1).map((s, i) => ({
        name: `${funnelResults[i].step} → ${s.step}`,
        dropoff: s.dropOff,
        lost: funnelResults[i].users - s.users,
      }))
    : [],
  [hasResults, funnelResults]
);
```

#### 2.3 Drop-off Chart UI

결과 섹션의 Main Funnel Chart 카드 아래에 추가:

```tsx
{/* Drop-off Toggle */}
<div className="flex items-center gap-2">
  <button onClick={() => setShowDropoff(!showDropoff)}
    className="text-sm text-slate-400 hover:text-white flex items-center gap-2">
    {showDropoff ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    {t('funnel.dropoffTitle')}
  </button>
</div>

{/* Drop-off Chart (collapsible) */}
{showDropoff && dropoffData.length > 0 && (
  <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
    <h3 className="text-lg font-bold text-white mb-4">{t('funnel.dropoffTitle')}</h3>
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dropoffData} layout="vertical" barSize={24}>
          <XAxis type="number" ... domain={[0, 100]} unit="%" />
          <YAxis type="category" dataKey="name" ... width={200} />
          <Tooltip formatter={(value) => [`${value}%`, t('funnel.dropoffRate')]} />
          <Bar dataKey="dropoff" radius={[0, 4, 4, 0]}>
            {dropoffData.map((entry, index) => (
              <Cell key={index} fill={dropoffColor(entry.dropoff)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}
```

### VZ-2: Segment Grouped BarChart

**File**: `pages/SegmentComparison.tsx`

기존 커스텀 CSS 바를 Recharts BarChart로 교체합니다.

#### 2.1 Imports

```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CHART_COLORS } from '../lib/constants';
```

#### 2.2 Chart Data

기존 `segmentResults` 배열을 그대로 사용:

```typescript
const chartData = useMemo(() =>
  segmentResults
    ? segmentResults.map(seg => ({
        name: seg.name.replace(/^.+?:\s*/, ''),
        conversion: Number(seg.conversion.toFixed(1)),
        population: seg.population,
        fullName: seg.name,
      }))
    : [],
  [segmentResults]
);
```

#### 2.3 Chart UI

기존 CSS 바를 BarChart로 교체 (lg:col-span-2 영역):

```tsx
<div className="h-[300px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={chartData} barSize={40}>
      <XAxis dataKey="name" tick={{ fill: CHART_COLORS.axisText, fontSize: 11 }} />
      <YAxis domain={[0, 'auto']} unit="%" tick={{ fill: CHART_COLORS.axisTextSecondary }} />
      <Tooltip
        contentStyle={{ backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.tooltipBorder }}
        formatter={(value, name, props) => [`${value}% (n=${props.payload.population.toLocaleString()})`, t('segments.conversion')]}
      />
      <Bar dataKey="conversion" radius={[4, 4, 0, 0]}>
        {chartData.map((entry, index) => (
          <Cell key={index} fill={CHART_COLORS.palette[index % CHART_COLORS.palette.length]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>
```

기존 CSS 바 영역은 제거하고 BarChart로 대체합니다.

### VZ-3: Retention Heatmap Tooltip

**File**: `pages/RetentionAnalysis.tsx`

코호트 테이블의 각 셀에 hover 시 절대 사용자 수를 보여주는 커스텀 tooltip을 추가합니다.

#### 3.1 Tooltip State

```typescript
const [hoverCell, setHoverCell] = useState<{ row: number; col: string; x: number; y: number } | null>(null);
```

#### 3.2 Cell Handlers

```tsx
<td
  onMouseEnter={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverCell({ row: idx, col: day, x: rect.left + rect.width / 2, y: rect.top });
  }}
  onMouseLeave={() => setHoverCell(null)}
>
```

#### 3.3 Tooltip Component

```tsx
{hoverCell && retentionResults && (
  <div
    className="fixed z-50 bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none"
    style={{ left: hoverCell.x, top: hoverCell.y - 60, transform: 'translateX(-50%)' }}
  >
    <p className="text-white font-bold">{retentionResults[hoverCell.row].cohortDate}</p>
    <p className="text-slate-400">
      {t('retention.retained')}: <span className="text-white font-mono">
        {Math.round(retentionResults[hoverCell.row].cohortSize * (retentionResults[hoverCell.row].days[hoverCell.col] || 0) / 100).toLocaleString()}
      </span> / {retentionResults[hoverCell.row].cohortSize.toLocaleString()}
    </p>
    <p className="text-slate-400">
      {t('retention.rate')}: <span className="text-accent font-mono">{(retentionResults[hoverCell.row].days[hoverCell.col] || 0).toFixed(1)}%</span>
    </p>
  </div>
)}
```

### VZ-4: Chart Palette & Utilities

**File**: `lib/constants.ts`

```typescript
export const CHART_COLORS = {
  // ... existing properties
  palette: [
    '#00d4aa', '#6366f1', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'
  ],
  dropoffColor: (rate: number) => {
    if (rate >= 50) return '#ef4444';
    if (rate >= 30) return '#f97316';
    if (rate >= 15) return '#f59e0b';
    return '#84cc16';
  },
} as const;
```

### VZ-5: i18n Keys

**Files**: `locales/ko/pages.json`, `locales/en/pages.json`

| Key | Korean | English |
|-----|--------|---------|
| funnel.dropoffTitle | 스텝 간 이탈률 | Step Drop-off Rate |
| funnel.dropoffRate | 이탈률 | Drop-off |
| funnel.showDropoff | 이탈률 차트 보기 | Show drop-off chart |
| funnel.hideDropoff | 이탈률 차트 숨기기 | Hide drop-off chart |
| retention.retained | 잔존 | Retained |
| retention.rate | 잔존율 | Rate |

---

## 3. Implementation Order

| # | ID | Task | File(s) |
|---|-----|------|---------|
| 1 | VZ-4 | Add palette + dropoffColor to CHART_COLORS | lib/constants.ts |
| 2 | VZ-1 | Add drop-off toggle + chart to FunnelAnalysis | pages/FunnelAnalysis.tsx |
| 3 | VZ-2 | Replace CSS bars with BarChart in SegmentComparison | pages/SegmentComparison.tsx |
| 4 | VZ-3 | Add heatmap tooltip to RetentionAnalysis | pages/RetentionAnalysis.tsx |
| 5 | VZ-5 | Add i18n keys (ko + en) | locales/ko/pages.json, locales/en/pages.json |

---

## 4. Verification Checklist

| # | ID | Item | Expected |
|---|-----|------|----------|
| 1 | VZ-4 | palette array in CHART_COLORS | 8 color strings |
| 2 | VZ-4 | dropoffColor function in CHART_COLORS | Returns color by rate threshold |
| 3 | VZ-1 | showDropoff state in FunnelAnalysis | useState<boolean> |
| 4 | VZ-1 | dropoffData computed from funnelResults | useMemo with name + dropoff + lost |
| 5 | VZ-1 | Toggle button for drop-off chart | Renders ChevronUp/Down + text |
| 6 | VZ-1 | Drop-off BarChart with layout="vertical" | Horizontal bars with dropoffColor |
| 7 | VZ-1 | Cell fill uses dropoffColor(entry.dropoff) | Red/orange/yellow/green by rate |
| 8 | VZ-2 | Recharts imports in SegmentComparison | BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell |
| 9 | VZ-2 | chartData computed from segmentResults | useMemo with name + conversion + population |
| 10 | VZ-2 | BarChart replaces CSS bars | Vertical BarChart in lg:col-span-2 |
| 11 | VZ-2 | Tooltip shows conversion % + population | Formatter with n= notation |
| 12 | VZ-2 | Cell fill uses palette colors | CHART_COLORS.palette[index % length] |
| 13 | VZ-3 | hoverCell state in RetentionAnalysis | useState with row, col, x, y or null |
| 14 | VZ-3 | onMouseEnter/Leave on cohort table cells | Sets/clears hoverCell |
| 15 | VZ-3 | Tooltip shows absolute user count | cohortSize * rate / 100 |
| 16 | VZ-3 | Tooltip shows retention rate | Formatted with % |
| 17 | VZ-5 | 6 i18n keys in ko/pages.json | All keys present |
| 18 | VZ-5 | 6 i18n keys in en/pages.json | All keys present |

---

## 5. Out of Scope

- Sankey 다이어그램
- 차트 이미지 다운로드 (기존 ExportDropdown 사용)
- 새 npm 패키지 설치

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-13 | Initial design | Claude |
