# Design: UI Polish (Phase 6)

## Reference

- Plan: `docs/01-plan/features/ui-polish.plan.md`

## Implementation Order

1. UP-2: Chart Theme Tokens (foundation — other tasks reference these)
2. UP-1: Accessibility (ARIA + Keyboard)
3. UP-3: Loading & Empty States
4. UP-4: Transitions & Mobile Polish

---

## UP-2: Chart Theme Tokens

### 2-1. `lib/constants.ts` — Add CHART_COLORS

Append after existing exports:

```typescript
// === Chart Theme Tokens ===
export const CHART_COLORS = {
  accent: '#00d4aa',
  accentGradientStart: 'rgba(0, 212, 170, 0.3)',
  accentGradientEnd: 'rgba(0, 212, 170, 0)',
  accentGradientMidStart: 'rgba(0, 212, 170, 0.5)',
  axisText: '#94a3b8',
  axisTextSecondary: '#64748b',
  gridLine: 'rgba(255,255,255,0.05)',
  tooltipBg: '#1a1f28',
  tooltipBorder: 'rgba(255,255,255,0.06)',
  cursorFill: 'rgba(255,255,255,0.05)',
  cellOpacity: (index: number) => `rgba(0, 212, 170, ${Math.max(0.25, 1 - index * 0.15)})`,
} as const;
```

### 2-2. `pages/Dashboard.tsx` — Use CHART_COLORS

Add import:
```typescript
import { CHART_COLORS } from '../lib/constants';
```

Replace hardcoded chart colors:

**Line 204** (XAxis tick): `tick={{ fill: '#94a3b8', fontSize: 12 }}` → `tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }}`

**Line 207** (Tooltip contentStyle): `contentStyle={{ backgroundColor: '#1a1f28', borderColor: 'rgba(255,255,255,0.06)', color: '#fff' }}` → `contentStyle={{ backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.tooltipBorder, color: '#fff' }}`

**Line 206** (Tooltip cursor): `cursor={{ fill: 'rgba(255,255,255,0.05)' }}` → `cursor={{ fill: CHART_COLORS.cursorFill }}`

**Line 212** (Cell fill): `fill={`rgba(0, 212, 170, ${1 - (index * 0.15)})`}` → `fill={CHART_COLORS.cellOpacity(index)}`

**Line 277** (linearGradient stop): `stopColor="#00d4aa"` → `stopColor={CHART_COLORS.accent}` (both stops)

**Line 282** (XAxis tick): `tick={{ fill: '#94a3b8', fontSize: 10 }}` → `tick={{ fill: CHART_COLORS.axisText, fontSize: 10 }}`

**Line 283** (YAxis tick): `tick={{ fill: '#64748b', fontSize: 10 }}` → `tick={{ fill: CHART_COLORS.axisTextSecondary, fontSize: 10 }}`

**Line 285** (Tooltip contentStyle): same pattern as above → `contentStyle={{ backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.tooltipBorder, color: '#fff' }}`

**Line 281** (CartesianGrid): `stroke="rgba(255,255,255,0.05)"` → `stroke={CHART_COLORS.gridLine}`

**Line 288** (Area stroke): `stroke="#00d4aa"` → `stroke={CHART_COLORS.accent}`

### 2-3. `pages/FunnelAnalysis.tsx` — Use CHART_COLORS

Add import:
```typescript
import { CHART_COLORS } from '../lib/constants';
```

**Line 124** (select option bg): `className="bg-[#14181f]"` → `className="bg-surface"` (2 occurrences on lines 124, 126)

**Line 197** (XAxis tick): `tick={{ fill: '#6b7280', fontSize: 12 }}` → `tick={{ fill: CHART_COLORS.axisText, fontSize: 12 }}`

**Line 198** (YAxis tick): `tick={{ fill: '#6b7280', fontSize: 11 }}` → `tick={{ fill: CHART_COLORS.axisTextSecondary, fontSize: 11 }}`

**Line 201** (Tooltip contentStyle): `contentStyle={{ backgroundColor: '#1a1f28', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '6px' }}` → `contentStyle={{ backgroundColor: CHART_COLORS.tooltipBg, borderColor: CHART_COLORS.tooltipBorder, color: '#fff', borderRadius: '6px' }}`

**Line 200** (Tooltip cursor): `cursor={{ fill: 'rgba(255,255,255,0.05)' }}` → `cursor={{ fill: CHART_COLORS.cursorFill }}`

**Line 206** (Cell fill): same pattern → `fill={CHART_COLORS.cellOpacity(index)}`

### 2-4. `pages/RetentionAnalysis.tsx` — Use CHART_COLORS

Add import:
```typescript
import { CHART_COLORS } from '../lib/constants';
```

**Lines 171, 183** (sticky column bg): `bg-[#14181f]` → `bg-surface`

**Line 224** (linearGradient): `stopColor="#00d4aa"` → `stopColor={CHART_COLORS.accent}` (both stops)

**Line 228** (CartesianGrid): `stroke="rgba(255,255,255,0.05)"` → `stroke={CHART_COLORS.gridLine}`

**Line 229** (XAxis tick): `tick={{ fill: '#94a3b8', fontSize: 11 }}` → `tick={{ fill: CHART_COLORS.axisText, fontSize: 11 }}`

**Line 230** (YAxis tick): `tick={{ fill: '#64748b', fontSize: 11 }}` → `tick={{ fill: CHART_COLORS.axisTextSecondary, fontSize: 11 }}`

**Line 232** (Tooltip contentStyle): same pattern → use CHART_COLORS

**Line 235** (Area stroke): `stroke="#00d4aa"` → `stroke={CHART_COLORS.accent}`

---

## UP-1: Accessibility (ARIA + Keyboard)

### 1-1. `components/Sidebar.tsx`

**Nav buttons (line 65-86)**: Add `aria-label` and `aria-current`:
```tsx
<button
  key={item.path}
  onClick={() => handleNav(item.path)}
  aria-label={item.label}
  aria-current={isActive ? 'page' : undefined}
  className={...}
  title={item.label}
  {...(item.dataTour ? { 'data-tour': item.dataTour } : {})}
>
```

**Logo button (line 53-59)**: Add `aria-label`:
```tsx
<div
  className="..."
  onClick={() => handleNav('/')}
  role="button"
  aria-label="홈으로 이동"
  title="홈"
>
```

**Guide button (line 92-98)**: Add `aria-label`:
```tsx
<button
  onClick={onStartTour}
  aria-label="시작 가이드"
  className="..."
  title="시작 가이드"
>
```

**Logout button (line 101-107)**: Add `aria-label`:
```tsx
<button
  aria-label="로그아웃"
  className="..."
  onClick={handleSignOut}
  title="로그아웃"
>
```

**Mobile drawer (line 127-132)**: Add role and aria:
```tsx
<div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="내비게이션 메뉴">
  <div className="sidebar-overlay absolute inset-0" onClick={onCloseMobile} aria-hidden="true" />
```

### 1-2. `components/Modal.tsx`

**Entire modal (line 15)**: Add role, aria-modal, aria-labelledby:
```tsx
<div className="fixed inset-0 z-50 ..." role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div className="bg-surface ...">
    <div className="flex items-center justify-between p-6 ...">
      <h2 id="modal-title" className="text-lg font-bold text-white">{title}</h2>
      <button onClick={onClose} className="..." aria-label="닫기">
```

**Add Escape key handler** — Add `useEffect`:
```typescript
import React, { useEffect } from 'react';

// Inside component, before the if (!isOpen) check:
useEffect(() => {
  if (!isOpen) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onClose]);
```

### 1-3. `components/Toast.tsx`

**Toast container (line 53)**: Add aria-live region:
```tsx
<div className="fixed bottom-4 right-4 ..." role="status" aria-live="polite">
```

**Toast item (line 58-73)**: Add role:
```tsx
<div
  key={t.id}
  role="alert"
  className={...}
>
```

**Dismiss button (line 67-72)**: Add aria-label:
```tsx
<button
  onClick={() => removeToast(t.id)}
  aria-label="알림 닫기"
  className="..."
>
```

### 1-4. `components/SearchModal.tsx`

**Outer div (line 138)**: Add role, aria-modal:
```tsx
<div className="fixed inset-0 z-[60] ..." role="dialog" aria-modal="true" aria-label="검색" onClick={onClose}>
```

**Input (line 146-153)**: Add aria-label:
```tsx
<input
  ref={inputRef}
  type="text"
  aria-label="검색어 입력"
  ...
/>
```

### 1-5. `components/UserMenu.tsx`

**Toggle button (line 35-41)**: Add aria-expanded, aria-haspopup:
```tsx
<button
  onClick={() => setOpen(!open)}
  aria-expanded={open}
  aria-haspopup="true"
  aria-label="사용자 메뉴"
  className="..."
  title={user.email || ''}
>
```

### 1-6. `components/OnboardingTour.tsx`

**Overlay (line 90-94)**: Add aria-hidden:
```tsx
<div
  className="fixed inset-0 z-[9998] ..."
  style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
  onClick={skipTour}
  aria-hidden="true"
/>
```

**Tooltip (line 113-139)**: Add role:
```tsx
<div
  className="fixed z-[10000]"
  style={calcTooltipStyle(targetRect, step.placement)}
  role="dialog"
  aria-label={step.title}
>
```

**Fallback centered (line 143-160)**: Same role:
```tsx
<div className="fixed inset-0 z-[10000] ..." role="dialog" aria-label={step.title}>
```

---

## UP-3: Loading & Empty States

### 3-1. `components/ChartSkeleton.tsx` (NEW)

```tsx
import React from 'react';

interface ChartSkeletonProps {
  type: 'bar' | 'area' | 'table';
  height?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ type, height = 'h-64' }) => {
  if (type === 'table') {
    return (
      <div className={`${height} animate-pulse space-y-2 p-4`}>
        <div className="h-8 bg-white/5 rounded w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 bg-white/[0.03] rounded w-full" />
        ))}
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className={`${height} flex items-end justify-around gap-4 p-4`}>
        {[70, 55, 40, 25].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-white/5 rounded-t animate-pulse"
            style={{ height: `${h}%`, animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }

  // area
  return (
    <div className={`${height} relative p-4 overflow-hidden`}>
      <div className="absolute inset-x-4 bottom-4 top-1/3 bg-gradient-to-t from-white/5 to-transparent rounded animate-pulse" />
      <div className="absolute inset-x-4 top-1/3 h-0.5 bg-white/10 rounded animate-pulse" />
    </div>
  );
};
```

### 3-2. `pages/FunnelAnalysis.tsx` — Add skeleton

Import:
```typescript
import { ChartSkeleton } from '../components/ChartSkeleton';
```

In the results section, wrap the BarChart `<ResponsiveContainer>` (line 194-211) with a check. Add state `isCalculating` from hook (already exists as implicit via `funnelResults` being null during calc).

No hook change needed — the existing flow sets `funnelResults` synchronously. Instead, add skeleton to the "no results yet but has data" state. After the editor section and before `{hasResults && (`, add:

```tsx
{/* Calculating placeholder */}
{!hasResults && funnelSteps.filter(Boolean).length >= 2 && (
  <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
    <h3 className="text-lg font-semibold text-white mb-4">퍼널 결과가 여기에 표시됩니다</h3>
    <ChartSkeleton type="bar" height="h-[320px]" />
  </div>
)}
```

### 3-3. `pages/RetentionAnalysis.tsx` — Add skeleton

Import:
```typescript
import { ChartSkeleton } from '../components/ChartSkeleton';
```

After the controls section and before `{retentionResults && retentionResults.length > 0 && (`, add:

```tsx
{/* Pre-calculation placeholder */}
{!retentionResults && hasData && (
  <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
    <h3 className="text-lg font-semibold text-white mb-4">리텐션 결과가 여기에 표시됩니다</h3>
    <ChartSkeleton type="table" height="h-48" />
  </div>
)}
```

### 3-4. `pages/SegmentComparison.tsx` — Add skeleton

Import:
```typescript
import { ChartSkeleton } from '../components/ChartSkeleton';
```

After the controls section and before `{segmentResults && segmentResults.length > 0 && (`, add:

```tsx
{/* Pre-calculation placeholder */}
{!segmentResults && hasFunnel && (
  <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
    <h3 className="text-lg font-semibold text-white mb-4">세그먼트 비교 결과가 여기에 표시됩니다</h3>
    <ChartSkeleton type="bar" height="h-48" />
  </div>
)}
```

### 3-5. `pages/DataImport.tsx` — Improve empty recent files

Replace line 297:
```tsx
<p className="text-slate-500 text-sm text-center py-4">아직 열어본 파일이 없습니다.</p>
```
With:
```tsx
<div className="flex flex-col items-center py-6 text-center">
  <FileText size={24} className="text-slate-700 mb-2" />
  <p className="text-slate-500 text-sm">아직 열어본 파일이 없습니다</p>
  <p className="text-slate-600 text-xs mt-1">CSV 파일을 업로드하면 여기에 표시됩니다</p>
</div>
```

---

## UP-4: Transitions & Mobile Polish

### 4-1. `index.html` — Add exit animations

After the existing `@keyframes slide-in-left` block (line 88-90), add:

```css
@keyframes fade-out {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(8px); }
}
.animate-fade-out {
  animation: fade-out 0.2s ease-in forwards;
}
```

### 4-2. `components/Toast.tsx` — Exit animation + dynamic timeout

Replace the `addToast` callback (lines 38-44):

```typescript
const addToast = useCallback((type: ToastType, title: string, message?: string) => {
  const id = ++toastId;
  setToasts(prev => [...prev, { id, type, title, message }]);
  const charCount = title.length + (message?.length || 0);
  const timeout = Math.max(3000, Math.min(charCount * 50, 8000));
  setTimeout(() => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 200);
  }, timeout);
}, []);
```

Update the Toast interface to include `exiting`:
```typescript
interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  exiting?: boolean;
}
```

Update toast item className (line 60):
```tsx
className={`pointer-events-auto ${t.exiting ? 'animate-fade-out' : 'animate-fade-up'} ${c.bg} flex items-start gap-3 ...`}
```

### 4-3. `components/Modal.tsx` — Exit animation

Replace the entire component:

```tsx
import React, { useEffect, useState } from 'react';
import { X } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setAnimating(false);
    } else if (visible) {
      setAnimating(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setAnimating(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, visible]);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`bg-surface border border-white/[0.06] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden transition-all duration-200 ${animating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 id="modal-title" className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="닫기">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
```

### 4-4. `pages/RetentionAnalysis.tsx` — Table scroll hint

Wrap the cohort table (line 167) with a scroll-hint container:

```tsx
<div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden relative">
  <div className="overflow-x-auto" id="retention-table">
    <table className="w-full text-sm text-left">
      {/* ... existing table content ... */}
    </table>
  </div>
  {/* Scroll hint gradient */}
  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent pointer-events-none md:hidden" />
</div>
```

### 4-5. `pages/SegmentComparison.tsx` — Table scroll hint

Same pattern for the detailed table (line 158):

```tsx
<div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden relative">
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      {/* ... existing table content ... */}
    </table>
  </div>
  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent pointer-events-none md:hidden" />
</div>
```

---

## File Change Summary

| File | Action | Lines Changed |
|------|--------|:---:|
| `lib/constants.ts` | ADD CHART_COLORS | +12 |
| `pages/Dashboard.tsx` | MODIFY chart colors | ~15 |
| `pages/FunnelAnalysis.tsx` | MODIFY chart colors + skeleton | ~15 |
| `pages/RetentionAnalysis.tsx` | MODIFY chart colors + sticky bg + skeleton + scroll hint | ~20 |
| `pages/SegmentComparison.tsx` | ADD skeleton + scroll hint | ~15 |
| `pages/DataImport.tsx` | MODIFY empty state | ~5 |
| `components/Sidebar.tsx` | ADD aria attrs | ~10 |
| `components/Modal.tsx` | REWRITE with exit anim + a11y | ~40 |
| `components/Toast.tsx` | MODIFY exit anim + dynamic timeout + a11y | ~15 |
| `components/SearchModal.tsx` | ADD aria attrs | ~5 |
| `components/UserMenu.tsx` | ADD aria attrs | ~5 |
| `components/OnboardingTour.tsx` | ADD aria attrs | ~5 |
| `components/ChartSkeleton.tsx` | NEW | ~45 |
| `index.html` | ADD fade-out keyframes | ~6 |
| **Total** | 13 modified + 1 new | ~213 |

## Dependencies

- No new npm packages
- No backend changes

## Testing Criteria

- All 98 existing tests pass
- Build succeeds without errors
- Modal opens/closes with fade animation
- Toast auto-dismisses with fade-out
- Escape key closes Modal
- Recharts renders with identical visual appearance (colors unchanged, just sourced from constants)
- Mobile: scroll hint gradient visible on table overflow
- Screen reader: all buttons have accessible names
