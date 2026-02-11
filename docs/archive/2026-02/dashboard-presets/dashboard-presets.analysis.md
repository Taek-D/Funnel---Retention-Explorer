# dashboard-presets Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Funnel & Retention Explorer
> **Analyst**: gap-detector
> **Date**: 2026-02-12
> **Design Doc**: User-provided spec (dashboard-presets feature)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify that the "Dashboard Template Presets" feature implementation matches the approved design specification. This feature adds 3 preset templates (default, ecommerce, saas) allowing users to apply optimized widget layouts with one click.

### 1.2 Analysis Scope

- **Design Specification**: Inline spec provided in analysis request (5 files, 2 test files)
- **Implementation Path**: `funnel-&-retention-explorer frontend/`
- **Files Analyzed**: 7 (5 implementation + 2 test)

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| Test Coverage | 100% | PASS |
| **Overall** | **100%** | **PASS** |

---

## 3. File-by-File Gap Analysis

### DP-1: `lib/constants.ts` -- PRESET_TEMPLATES constant (10/10 PASS)

| # | Check Item | Design | Implementation | Status |
|---|-----------|--------|----------------|--------|
| 1 | PRESET_TEMPLATES export exists | Required | Line 77: `export const PRESET_TEMPLATES` | PASS |
| 2 | Type is `Record<string, { labelKey, descKey, icon, layout }>` | Required | Lines 77-82: exact type match | PASS |
| 3 | 3 presets defined (default, ecommerce, saas) | 3 presets | Lines 83-117: `default`, `ecommerce`, `saas` | PASS |
| 4 | Default preset reuses DEFAULT_LAYOUT | `layout: DEFAULT_LAYOUT` | Line 87: `layout: DEFAULT_LAYOUT` | PASS |
| 5 | Ecommerce: funnel-chart full width | `width: 'full'` | Line 95: `{ widgetId: 'funnel-chart', visible: true, width: 'full' }` | PASS |
| 6 | Ecommerce: data-quality visible | `visible: true` | Line 97: `{ widgetId: 'data-quality', visible: true }` | PASS |
| 7 | Ecommerce: saved-analyses hidden | `visible: false` | Line 100: `{ widgetId: 'saved-analyses', visible: false }` | PASS |
| 8 | SaaS: retention-chart full width | `width: 'full'` | Line 109: `{ widgetId: 'retention-chart', visible: true, width: 'full' }` | PASS |
| 9 | SaaS: recent-insights full width | `width: 'full'` | Line 110: `{ widgetId: 'recent-insights', visible: true, width: 'full' }` | PASS |
| 10 | SaaS: funnel-chart half width | `width: 'half'` | Line 111: `{ widgetId: 'funnel-chart', visible: true, width: 'half' }` | PASS |

**Preset icon assignments:**
- default: `LayoutDashboard` -- PASS
- ecommerce: `ShoppingBag` -- PASS
- saas: `Activity` -- PASS

### DP-2: `hooks/useDashboardLayout.ts` -- applyPreset function (8/8 PASS)

| # | Check Item | Design | Implementation | Status |
|---|-----------|--------|----------------|--------|
| 1 | PRESET_TEMPLATES imported | Required | Line 4: `import { ..., PRESET_TEMPLATES } from '../lib/constants'` | PASS |
| 2 | `applyPreset` callback exists | Required | Lines 123-127: `const applyPreset = useCallback(...)` | PASS |
| 3 | Uses `PRESET_TEMPLATES[presetId].layout` | Required | Line 124: `const preset = PRESET_TEMPLATES[presetId]` | PASS |
| 4 | Calls `persist()` with layout | Required | Line 126: `persist([...preset.layout])` | PASS |
| 5 | Guards against unknown preset | Required | Line 125: `if (!preset) return` | PASS |
| 6 | `resetToDefault` refactored to call `applyPreset('default')` | Required | Lines 129-131: `applyPreset('default')` | PASS |
| 7 | `applyPreset` in return value | Required | Line 148: `applyPreset,` | PASS |
| 8 | Dependency array correct | `[persist]` | Line 127: `}, [persist])` | PASS |

### DP-3: `pages/Dashboard.tsx` -- Preset selection UI (16/16 PASS)

| # | Check Item | Design | Implementation | Status |
|---|-----------|--------|----------------|--------|
| 1 | LayoutDashboard icon imported | Required | Line 5: `LayoutDashboard` in import | PASS |
| 2 | ShoppingBag icon imported | Required | Line 5: `ShoppingBag` in import | PASS |
| 3 | Activity icon imported | Required | Line 5: `Activity` in import | PASS |
| 4 | ChevronDown icon imported | Required | Line 5: `ChevronDown` in import | PASS |
| 5 | PRESET_TEMPLATES imported | Required | Line 16: `import { ..., PRESET_TEMPLATES } from '../lib/constants'` | PASS |
| 6 | useClickOutside imported | Required | Line 17: `import { useClickOutside } from '../hooks/useClickOutside'` | PASS |
| 7 | `applyPreset` destructured from hook | Required | Line 28: `applyPreset` in destructuring | PASS |
| 8 | `presetOpen` state | Required | Line 32: `const [presetOpen, setPresetOpen] = useState(false)` | PASS |
| 9 | `presetRef` for click outside | Required | Line 33: `const presetRef = useRef<HTMLDivElement>(null)` | PASS |
| 10 | `useClickOutside(presetRef, ...)` | Required | Line 34: `useClickOutside(presetRef, () => setPresetOpen(false))` | PASS |
| 11 | Preset button in edit mode only | Required | Lines 488-517: inside `{editMode && (...)}` block | PASS |
| 12 | Button has LayoutDashboard icon | Required | Line 493: `<LayoutDashboard size={14} />` | PASS |
| 13 | Button has "Templates" text | Required | Line 494: `{t('dashboard.presets')}` | PASS |
| 14 | Button has ChevronDown | Required | Line 495: `<ChevronDown size={14} ... />` | PASS |
| 15 | Dropdown renders 3 presets with icon + name + description | Required | Lines 499-514: iterates `PRESET_TEMPLATES`, renders `IconComp`, `t(preset.labelKey)`, `t(preset.descKey)` | PASS |
| 16 | Selection calls `applyPreset(id)` and closes dropdown | Required | Line 504: `applyPreset(id); setPresetOpen(false)` | PASS |

**Positive enhancements beyond design:**
- `PRESET_ICON_MAP` (lines 36-40): Maps icon string names to actual components, enabling dynamic icon rendering from constant definitions.
- `ChevronDown rotate-180` animation (line 495): Rotates chevron when dropdown is open.

### DP-4: `locales/ko/pages.json` -- Korean translations (8/8 PASS)

| # | Check Item | Design Key | Implementation | Status |
|---|-----------|-----------|----------------|--------|
| 1 | `dashboard.presets` | Required | Line 167: `"presets": "템플릿"` | PASS |
| 2 | `dashboard.presetsDesc` | Required | Line 168: `"presetsDesc": "미리 정의된 레이아웃 적용"` | PASS |
| 3 | `dashboard.preset.default` | Required | Line 170: `"default": "기본"` | PASS |
| 4 | `dashboard.preset.defaultDesc` | Required | Line 171: `"defaultDesc": "모든 위젯 표시"` | PASS |
| 5 | `dashboard.preset.ecommerce` | Required | Line 172: `"ecommerce": "E-commerce"` | PASS |
| 6 | `dashboard.preset.ecommerceDesc` | Required | Line 173: `"ecommerceDesc": "퍼널·세그먼트 중심 레이아웃"` | PASS |
| 7 | `dashboard.preset.saas` | Required | Line 174: `"saas": "SaaS"` | PASS |
| 8 | `dashboard.preset.saasDesc` | Required | Line 175: `"saasDesc": "리텐션·인사이트 중심 레이아웃"` | PASS |

### DP-5: `locales/en/pages.json` -- English translations (8/8 PASS)

| # | Check Item | Design Key | Implementation | Status |
|---|-----------|-----------|----------------|--------|
| 1 | `dashboard.presets` | Required | Line 167: `"presets": "Templates"` | PASS |
| 2 | `dashboard.presetsDesc` | Required | Line 168: `"presetsDesc": "Apply a predefined layout"` | PASS |
| 3 | `dashboard.preset.default` | Required | Line 170: `"default": "Default"` | PASS |
| 4 | `dashboard.preset.defaultDesc` | Required | Line 171: `"defaultDesc": "Show all widgets"` | PASS |
| 5 | `dashboard.preset.ecommerce` | Required | Line 172: `"ecommerce": "E-commerce"` | PASS |
| 6 | `dashboard.preset.ecommerceDesc` | Required | Line 173: `"ecommerceDesc": "Funnel & segment focused layout"` | PASS |
| 7 | `dashboard.preset.saas` | Required | Line 174: `"saas": "SaaS"` | PASS |
| 8 | `dashboard.preset.saasDesc` | Required | Line 175: `"saasDesc": "Retention & insights focused layout"` | PASS |

---

## 4. Test Coverage Analysis

### DP-T1: `__tests__/hooks/useDashboardLayout.test.tsx` (5/5 new preset tests)

| # | Test | Design Requirement | Status |
|---|------|--------------------|--------|
| 1 | `applyPreset applies ecommerce layout` | ecommerce preset test | PASS |
| 2 | `applyPreset applies saas layout` | saas preset test | PASS |
| 3 | `applyPreset with default restores DEFAULT_LAYOUT` | default preset test | PASS |
| 4 | `applyPreset ignores unknown preset id` | unknown preset test | PASS |
| 5 | `applyPreset saves to localStorage` | localStorage save test | PASS |

Total tests in file: 18 (13 existing + 5 new preset tests)

### DP-T2: `__tests__/pages/Dashboard.test.tsx` mock updates (4/4 PASS)

| # | Check Item | Design Requirement | Implementation | Status |
|---|-----------|-------------------|----------------|--------|
| 1 | LayoutDashboard icon mocked | Required | Line 37: `LayoutDashboard: Icon('LayoutDashboard')` | PASS |
| 2 | ShoppingBag icon mocked | Required | Line 38: `ShoppingBag: Icon('ShoppingBag')` | PASS |
| 3 | Activity icon mocked | Required | Line 39: `Activity: Icon('Activity')` | PASS |
| 4 | ChevronDown icon mocked | Required | Line 40: `ChevronDown: Icon('ChevronDown')` (line 39) | PASS |

`applyPreset` mock: Line 69 (`mockApplyPreset = vi.fn()`) and line 108 (`applyPreset: mockApplyPreset`).

Total tests in file: 18

---

## 5. "Things NOT changed" Verification

| Item | Design: Unchanged | Actual | Status |
|------|-------------------|--------|--------|
| `types/index.ts` | No new types | No changes related to presets (reuses WidgetLayout[]) | PASS |
| `context/reducer.ts` | SET_DASHBOARD_LAYOUT unchanged | No modifications | PASS |
| `context/actions.ts` | Unchanged | No modifications | PASS |
| Supabase schema | dashboard_layout JSONB unchanged | No migration needed | PASS |
| DashboardWidget component | Unchanged | No modifications | PASS |

---

## 6. Architecture & Convention Compliance

### 6.1 Architecture (Dynamic Level)

| Check | Status |
|-------|--------|
| Constants in `lib/constants.ts` | PASS |
| Hook logic in `hooks/useDashboardLayout.ts` | PASS |
| UI in `pages/Dashboard.tsx` | PASS |
| Icons re-exported via `components/Icons.tsx` | PASS (LayoutDashboard, ShoppingBag, Activity, ChevronDown all present) |
| Dependency direction: Page -> Hook -> Constants | PASS |

### 6.2 Convention Compliance

| Convention | Check | Status |
|-----------|-------|--------|
| Naming: `PRESET_TEMPLATES` (UPPER_SNAKE_CASE constant) | Correct | PASS |
| Naming: `applyPreset` (camelCase function) | Correct | PASS |
| Naming: `presetOpen`, `presetRef` (camelCase variables) | Correct | PASS |
| i18n keys: nested under `dashboard.preset.*` | Correct | PASS |
| Tailwind classes (no inline styles) | Correct | PASS |
| Import order: external -> internal absolute -> relative -> types | Correct | PASS |

---

## 7. Match Rate Summary

```
Total Check Items: 59

  DP-1 (constants.ts):              10/10 PASS
  DP-2 (useDashboardLayout.ts):      8/8  PASS
  DP-3 (Dashboard.tsx):             16/16 PASS
  DP-4 (ko/pages.json):              8/8  PASS
  DP-5 (en/pages.json):              8/8  PASS
  DP-T1 (hook tests):                5/5  PASS
  DP-T2 (page test mocks):           4/4  PASS

  PASS:    59/59 (100%)
  PARTIAL:  0/59 (0%)
  FAIL:     0/59 (0%)

  Match Rate: 100%
```

---

## 8. Positive Enhancements (Design X, Implementation O)

| # | Enhancement | File:Line | Description |
|---|------------|-----------|-------------|
| 1 | PRESET_ICON_MAP | Dashboard.tsx:36-40 | Dynamic icon component resolution from string name, enabling constant-driven icon rendering |
| 2 | ChevronDown rotation | Dashboard.tsx:495 | `rotate-180` animation on dropdown open for visual feedback |
| 3 | Layout spread copy | useDashboardLayout.ts:126 | `persist([...preset.layout])` prevents mutation of PRESET_TEMPLATES source data |

---

## 9. Missing Features (Design O, Implementation X)

None.

---

## 10. Changed Features (Design != Implementation)

None.

---

## 11. Recommended Actions

No action required. All 59 check items pass. Match rate is 100%.

### Build/Test Verification (deferred to runtime)

| # | Item | Status |
|---|------|--------|
| 1 | All existing tests + new tests pass (target: 310 total) | Deferred |
| 2 | Vite build succeeds | Deferred |
| 3 | 0 TypeScript errors | Deferred |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-12 | Initial analysis | gap-detector |
