# Security Audit - 5 New Features (2026-02-15)

## Scope
Analysis of 5 newly implemented features in React frontend:
1. Chart Annotations (lib/annotations.ts, hooks/useAnnotations.ts, components/ChartAnnotations.tsx)
2. Anomaly Detection (lib/anomalyDetector.ts, hooks/useAnomalyDetection.ts, components/AnomalyAlert.tsx)
3. Natural Language AI Query (components/AskAIPanel.tsx - modified)
4. Saved Views (lib/savedViews.ts, hooks/useSavedViews.ts, components/SavedViewsDropdown.tsx)
5. Multi CSV Blending (lib/dataBlender.ts, hooks/useDataBlend.ts, components/DataBlendModal.tsx)

## Summary

**Quality Score**: 87/100

**Critical Issues**: 0
**High Priority**: 2
**Medium Priority**: 5
**Low Priority (Info)**: 4

---

## Issues Found

### 🟠 HIGH PRIORITY (Fix Recommended)

| File | Line | Issue | Recommended Action |
|------|------|-------|-------------------|
| `lib/savedViews.ts` | 14-18 | **localStorage XSS via untrusted JSON** | Validate JSON structure after parse with schema check |
| `lib/annotations.ts` | 23-28 | **localStorage XSS via untrusted JSON** | Validate ChartAnnotation[] schema after parse |

**Details**:
- `JSON.parse(localStorage.getItem(...))` without validation allows malformed data injection
- If user imports corrupted localStorage from browser dev tools, app could crash or execute malicious code
- **Recommendation**: Add runtime schema validation (e.g., zod, or manual type guards)

```typescript
// Example fix for annotations.ts
export function getAnnotations(chartKey: string): ChartAnnotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + chartKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Validate structure
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item =>
      item &&
      typeof item.id === 'string' &&
      typeof item.date === 'string' &&
      typeof item.label === 'string' &&
      typeof item.color === 'string' &&
      ANNOTATION_CATEGORIES.includes(item.category)
    );
  } catch {
    return [];
  }
}
```

---

### 🟡 MEDIUM PRIORITY (Improvement Recommended)

| File | Line | Issue | Recommended Action |
|------|------|-------|-------------------|
| `components/ChartAnnotations.tsx` | 71 | **No maxLength enforcement on label** | 50 char limit only client-side, could bypass via dev tools |
| `lib/dataBlender.ts` | 57 | **Unbounded object property injection via _source** | Sanitize CSV column names before merging |
| `components/DataBlendModal.tsx` | 26-36 | **No file size validation** | Check file.size before Papa.parse (e.g., < 50MB) |
| `components/AskAIPanel.tsx` | 17-22 | **Regex injection risk (low)** | Patterns are hardcoded, but document as untrusted input boundary |
| `hooks/useSavedViews.ts` | 10 | **Race condition on concurrent saves** | getSavedViews() called twice in save() could lose updates |

**Details**:

1. **ChartAnnotations maxLength bypass**: User can modify DOM to remove `maxLength={50}` and submit 1000-char labels
   - **Fix**: Trim label in `addAnnotation()` server function: `label: label.trim().slice(0, 50)`

2. **dataBlender property injection**: If CSV has column named `__proto__` or `constructor`, it could pollute merged objects
   - **Fix**: Sanitize keys: `const safeKey = h.replace(/^__|^constructor$|^prototype$/gi, '_');`

3. **DataBlendModal file size**: papaparse could hang browser on 500MB CSV
   - **Fix**: Add check before parse:
   ```typescript
   if (file.size > 50 * 1024 * 1024) {
     toast('error', 'File too large (max 50MB)');
     return;
   }
   ```

4. **AskAIPanel regex injection**: `detectNavIntent()` uses user input in regex test
   - **Risk**: Low (patterns are static, but user input flows through regex engine)
   - **Fix**: Document that NL_PATTERNS must be reviewed if made dynamic

5. **useSavedViews race condition**: If user clicks "save" twice rapidly, second call might overwrite first
   - **Fix**: Use functional setState: `setViews(prev => [...getSavedViews()])` OR debounce save button

---

### 🟢 INFO (Reference Only)

| File | Line | Observation | Notes |
|------|------|-------------|-------|
| All 5 features | N/A | **Zero `any` types** | Excellent TypeScript hygiene |
| All components | N/A | **i18n fully implemented** | All strings use `t()`, keys exist in pages.json |
| All localStorage usage | N/A | **No sensitive data stored** | Only UI state (annotations, views), no PII |
| `lib/anomalyDetector.ts` | 31-62 | **Statistical algorithm correct** | Z-score calculation is standard, no bugs |

---

## Architecture Compliance

### ✅ Passes

1. **TypeScript strict mode**: Zero `any` types, proper interface usage
2. **Tailwind CSS only**: No inline styles found
3. **Icons re-export**: All icons imported via `./Icons` (Plus, X, Trash2, etc.)
4. **i18n coverage**: 100% string literals use `useTranslation('pages')` or `useTranslation()`
5. **Clean Architecture**:
   - `lib/` contains pure functions (no React)
   - `hooks/` wraps lib with React state
   - `components/` only UI logic
6. **No console.log**: Only 5 files have console (all in supabase/functions or __tests__)
7. **No XSS vectors**: Zero `dangerouslySetInnerHTML`, `innerHTML`, `eval()` in new code

### ⚠️ Minor Deviations

1. **Missing React.memo**: None of the new components use `React.memo`
   - **Impact**: Low (components are small, re-render cost minimal)
   - **Recommendation**: Consider memoizing `AnnotationList`, `AnomalyList` if parent re-renders often

2. **Missing useMemo in hooks**: `useAnnotations` and `useSavedViews` don't memoize return objects
   - **Impact**: Low (object identity changes on every render, but consumers don't rely on it)
   - **Recommendation**: Wrap return in `useMemo` for referential stability:
   ```typescript
   return useMemo(() => ({ annotations, add, remove }), [annotations, add, remove]);
   ```

---

## Performance Analysis

### Bottlenecks

1. **dataBlender.ts union strategy**: O(n*m) where n=sources, m=rows
   - **Current**: Acceptable for <5 sources with <100K rows each
   - **Risk**: If user blends 10 CSVs with 1M rows, UI freezes
   - **Fix**: Add Web Worker for blending (future enhancement)

2. **AnomalyDetection re-runs on every render**: `useAnomalyDetection` has `useMemo` but depends on `series` ref
   - **Impact**: If parent passes new `series` array on every render, detection runs every time
   - **Fix**: StickinessPage already memoizes `timeSeries`, so issue is mitigated

### Optimizations Present

1. **useCallback in hooks**: All mutation functions (`add`, `remove`, `save`, `blend`) use `useCallback`
2. **useMemo in anomalyDetection**: Z-score calculation only runs when `series` or `sensitivity` changes
3. **Early returns**: `detectAnomalies()` returns empty array if `series.length < windowSize + 1`

---

## Security Deep Dive

### localStorage Injection

**Attack Vector**: User exports localStorage JSON, modifies it, re-imports

**Affected Functions**:
- `getAnnotations()`: Expects `ChartAnnotation[]`, could receive `{ __proto__: { isAdmin: true } }`
- `getSavedViews()`: Expects `SavedView[]`, could receive malicious payloads

**Proof-of-Concept**:
```javascript
// Attacker injects this into localStorage
localStorage.setItem('fre_annotations_funnel', JSON.stringify([
  { id: "1", date: "2024-01-01", label: "<img src=x onerror=alert(1)>", color: "#fff", category: "custom" }
]));
// Label is rendered in ChartAnnotations line 111: {a.label}
// React auto-escapes, so XSS blocked. BUT if label used in title attribute without escaping, vulnerable.
```

**Verdict**: Current code is XSS-safe (React escapes JSX text), but localStorage schema validation missing.

---

### CSV Injection (dataBlender)

**Attack Vector**: User uploads CSV with column names like `__proto__`, `constructor`, `toString`

**Test Case**:
```csv
__proto__,userid,eventname
malicious,u1,click
```

**Current Behavior**:
```typescript
// dataBlender.ts line 59
merged[h] = row[h] ?? '';
// If h = '__proto__', this could pollute Object.prototype
```

**Verdict**: Prototype pollution risk exists but impact is low (merged objects are discarded after processing).

**Fix**: Sanitize column names:
```typescript
const safeHeaders = headers.map(h => h.replace(/^(__proto__|constructor|prototype)$/i, '_reserved_'));
```

---

### AI Query Injection (AskAIPanel)

**Attack Vector**: User types regex metacharacters to bypass navigation intent detection

**Test Case**:
```
Input: "퍼널.*(?=conversion)"
Pattern: /퍼널|funnel|전환율|conversion/i
Result: Matches "conversion", navigates to /app/funnels
```

**Verdict**: Low risk (user can't execute code, only trigger navigation). Patterns are static.

---

## Error Handling

### Gaps

1. **DataBlendModal**: Papa.parse errors are silently ignored (no error callback)
   - **Fix**: Add error handler:
   ```typescript
   Papa.parse(file, {
     error: (err) => toast('error', `CSV parse error: ${err.message}`),
   });
   ```

2. **anomalyDetector**: Division by zero if `sd === 0` (handled via `if (sd === 0) continue`, ✅ OK)

3. **savedViews**: No error toast if save fails
   - **Fix**: Wrap `save()` in try-catch and show toast on error

---

## Accessibility

### Issues

1. **ChartAnnotations**: Remove button has no `aria-label`
   - **Fix**: `<button aria-label={t('annotations.remove')} ...>`

2. **SensitivitySelect**: Button group has no `role="group"` or `aria-label`
   - **Fix**: Wrap in `<div role="group" aria-label="Sensitivity selector">`

3. **DataBlendModal**: File input is visually hidden but has no keyboard trigger
   - **Fix**: Add keyboard handler to "Add File" button:
   ```typescript
   onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
   ```

---

## Testing Recommendations

### Unit Tests Needed

1. **annotations.ts**: Test malformed localStorage payloads
2. **dataBlender.ts**: Test prototype pollution via `__proto__` column
3. **anomalyDetector.ts**: Test edge cases (empty series, constant values, all zeros)
4. **savedViews.ts**: Test max 20 views limit enforcement

### Integration Tests Needed

1. **StickinessPage + Annotations**: Verify ReferenceLine renders with correct date
2. **DataImport + DataBlendModal**: Test blending 2 CSVs with different schemas
3. **AskAIPanel + Navigation**: Test regex patterns match expected routes

---

## Recommendations Summary

### Immediate (P0)
1. Add localStorage validation in `getAnnotations()` and `getSavedViews()`
2. Add file size check in `DataBlendModal` (< 50MB)

### High Priority (P1)
3. Sanitize CSV column names in `dataBlender.ts` to prevent prototype pollution
4. Add error handling to Papa.parse in `DataBlendModal`
5. Add `aria-label` to remove buttons in `ChartAnnotations` and `AnomalyList`

### Nice-to-Have (P2)
6. Wrap hook return objects in `useMemo` for referential stability
7. Add React.memo to `AnnotationList`, `AnomalyList` components
8. Add keyboard support to file input in `DataBlendModal`

---

## Conclusion

The 5 new features demonstrate **excellent TypeScript hygiene** and **full i18n coverage**. Security risks are **low to medium** (primarily localStorage validation gaps). Performance is acceptable for current scale but may require Web Workers for large-scale blending.

**No critical blockers** for deployment. Recommend addressing P0/P1 items in next patch.
