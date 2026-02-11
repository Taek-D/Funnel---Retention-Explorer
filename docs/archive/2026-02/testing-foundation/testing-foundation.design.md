# Design: Testing Foundation (Phase 8)

> Plan Reference: `docs/01-plan/features/testing-foundation.plan.md`

## 1. Architecture Overview

```
__tests__/
├── setupTests.ts                          ← TF-1 (NEW)
├── helpers/
│   ├── renderWithProviders.tsx            ← TF-6 (NEW)
│   └── mocks.ts                          ← TF-6 (NEW)
├── unit/
│   ├── reducer.test.ts                   ← TF-2 (NEW)
│   ├── planManager.test.ts               ← TF-5 (NEW)
│   ├── recentFiles.test.ts              ← TF-5 (NEW)
│   ├── eventUtils.test.ts               ← TF-5 (NEW)
│   └── (existing 7 unit tests)
├── hooks/
│   ├── usePlanGate.test.tsx              ← TF-3 (NEW)
│   ├── useColumnMapping.test.tsx         ← TF-3 (NEW)
│   ├── useClickOutside.test.tsx          ← TF-3 (NEW)
│   ├── useFunnelAnalysis.test.tsx        ← TF-3 (NEW)
│   └── useRetentionAnalysis.test.tsx     ← TF-3 (NEW)
├── components/
│   ├── Modal.test.tsx                    ← TF-4 (NEW)
│   ├── Toast.test.tsx                    ← TF-4 (NEW)
│   ├── PlanBadge.test.tsx               ← TF-4 (NEW)
│   ├── PageLoader.test.tsx              ← TF-4 (NEW)
│   └── ErrorBoundary.test.tsx           ← TF-4 (NEW)
├── integration/
│   └── (existing 7 integration tests)
└── fixtures/
    └── (existing 4 fixture files)

vitest.config.ts                          ← TF-1 (MODIFY)
package.json                              ← TF-1 (MODIFY)
```

## 2. Detailed Specifications

---

### TF-1: React Testing Infrastructure Setup

#### 2.1.1 Dependencies (package.json)

**Add to devDependencies:**

```json
{
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.6.0",
  "@testing-library/user-event": "^14.6.0",
  "jsdom": "^26.0.0"
}
```

#### 2.1.2 Vitest Config (vitest.config.ts)

```typescript
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['__tests__/**/*.test.{ts,tsx}'],
    setupFiles: ['__tests__/setupTests.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

**Changes from current:**
- `environment`: `'node'` → `'jsdom'`
- `include`: `.ts` → `.{ts,tsx}`
- `setupFiles`: NEW — `['__tests__/setupTests.ts']`
- `globals`: NEW — `true` (vi.fn, describe, it 글로벌 사용)

#### 2.1.3 Setup File (__tests__/setupTests.ts)

```typescript
import '@testing-library/jest-dom';

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_GEMINI_API_KEY: 'test-gemini-key',
    },
  },
});

// Mock window.matchMedia (Tailwind/responsive)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
vi.stubGlobal('IntersectionObserver', class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
});

// Mock ResizeObserver (Recharts)
vi.stubGlobal('ResizeObserver', class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
});
```

#### Verification Checklist (8 items)
- [ ] `@testing-library/react` in devDependencies
- [ ] `@testing-library/jest-dom` in devDependencies
- [ ] `@testing-library/user-event` in devDependencies
- [ ] `jsdom` in devDependencies
- [ ] `vitest.config.ts` environment = `'jsdom'`
- [ ] `vitest.config.ts` include pattern has `{ts,tsx}`
- [ ] `vitest.config.ts` setupFiles includes `setupTests.ts`
- [ ] `__tests__/setupTests.ts` exists with jest-dom import + browser API mocks

---

### TF-2: Context & Reducer Tests

**File**: `__tests__/unit/reducer.test.ts`

Test `appReducer` from `context/reducer.ts` — 19 action types + initialState.

```typescript
import { describe, it, expect } from 'vitest';
import { appReducer, initialState } from '../../context/reducer';

describe('appReducer', () => {
  it('returns initialState by default', () => {
    const result = appReducer(initialState, { type: 'UNKNOWN' } as any);
    expect(result).toEqual(initialState);
  });

  it('SET_RAW_DATA sets rawData, headers, currentDataset', () => { ... });
  it('SET_COLUMN_MAPPING sets columnMapping', () => { ... });
  it('SET_PROCESSED_DATA sets processedData', () => { ... });
  it('SET_DETECTED_TYPE sets detectedType', () => { ... });
  it('SET_UNIQUE_EVENTS sets uniqueEvents', () => { ... });
  it('SET_FUNNEL_STEPS sets funnelSteps', () => { ... });
  it('SET_FUNNEL_RESULTS sets funnelResults', () => { ... });
  it('SET_RETENTION_RESULTS sets retentionResults', () => { ... });
  it('SET_RETENTION_TYPE sets retentionType', () => { ... });
  it('SET_SEGMENT_RESULTS sets segmentResults', () => { ... });
  it('SET_INSIGHTS sets insights', () => { ... });
  it('SET_SUBSCRIPTION_KPIS sets subscriptionKPIs', () => { ... });
  it('SET_TRIAL_ANALYSIS sets trialAnalysis', () => { ... });
  it('SET_CHURN_ANALYSIS sets churnAnalysis', () => { ... });
  it('SET_PAID_RETENTION sets paidRetentionResults', () => { ... });
  it('SET_PROCESSING sets isProcessing, progress, message', () => { ... });
  it('SET_DATA_QUALITY sets dataQualityReport', () => { ... });
  it('SET_RECENT_FILES sets recentFiles', () => { ... });
  it('SET_AI_SUMMARY sets aiSummary', () => { ... });
  it('RESET_ANALYSIS resets analysis fields but preserves data', () => {
    // Verify rawData, headers, currentDataset are preserved
    // Verify funnelSteps, funnelResults, retentionResults etc. are reset
  });
  it('does not mutate previous state', () => {
    // Verify immutability
  });
});
```

**Test Count**: 22 tests

#### Verification Checklist (4 items)
- [ ] `__tests__/unit/reducer.test.ts` exists
- [ ] Tests all 19 action types + unknown action + initialState
- [ ] `RESET_ANALYSIS` verifies data preservation + analysis reset
- [ ] Immutability test (previous state unchanged)

---

### TF-3: Custom Hook Tests

#### 2.3.1 usePlanGate (`__tests__/hooks/usePlanGate.test.tsx`)

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePlanGate } from '../../hooks/usePlanGate';
// Mock AuthContext, planManager
```

**Test Cases:**
- Returns `isPro: false` when no userProfile
- Returns `isPro: true` for pro user
- `canUseAI` reflects planManager result
- `csvRowLimit` returns free limit (10,000) for free user
- `csvRowLimit` returns pro limit (500,000) for pro user
- `openUpgradeModal` sets showUpgradeModal + reason
- `closeUpgradeModal` resets showUpgradeModal + reason

**Test Count**: 7 tests

#### 2.3.2 useColumnMapping (`__tests__/hooks/useColumnMapping.test.tsx`)

```typescript
import { renderHook, act } from '@testing-library/react';
import { useColumnMapping } from '../../hooks/useColumnMapping';
// Mock AppContext
```

**Test Cases:**
- Returns initial mapping from AppContext state
- `updateMapping` updates specific field
- `updateMapping` with empty string sets undefined
- Syncs with AppContext columnMapping changes
- Returns headers from state

**Test Count**: 5 tests

#### 2.3.3 useClickOutside (`__tests__/hooks/useClickOutside.test.tsx`)

```typescript
import { renderHook } from '@testing-library/react';
import { useClickOutside } from '../../hooks/useClickOutside';
```

**Test Cases:**
- Calls handler on mousedown outside ref element
- Does NOT call handler on mousedown inside ref element
- Does NOT call handler when enabled = false
- Cleans up event listener on unmount

**Test Count**: 4 tests

#### 2.3.4 useFunnelAnalysis (`__tests__/hooks/useFunnelAnalysis.test.tsx`)

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFunnelAnalysis } from '../../hooks/useFunnelAnalysis';
// Mock AppContext, Toast, Notifications, analytics, funnelEngine, insightsEngine
```

**Test Cases:**
- Returns funnelSteps from state
- `setFunnelSteps` dispatches SET_FUNNEL_STEPS
- `runFunnelAnalysis` shows warning when < 2 steps
- `runFunnelAnalysis` dispatches results when >= 2 steps
- `applyTemplate` dispatches filtered template steps
- `hasData` reflects processedData presence

**Test Count**: 6 tests

#### 2.3.5 useRetentionAnalysis (`__tests__/hooks/useRetentionAnalysis.test.tsx`)

```typescript
import { renderHook, act } from '@testing-library/react';
import { useRetentionAnalysis } from '../../hooks/useRetentionAnalysis';
// Mock AppContext, Toast, analytics, retentionEngine, insightsEngine
```

**Test Cases:**
- Returns retentionType from state
- `setRetentionType` dispatches SET_RETENTION_TYPE
- `runRetentionAnalysis` shows warning when no cohortEvent
- `runRetentionAnalysis` shows warning when no activeEvents
- `runRetentionAnalysis` dispatches results for activity type
- `hasData` reflects processedData presence

**Test Count**: 6 tests

#### Verification Checklist (10 items)
- [ ] `__tests__/hooks/usePlanGate.test.tsx` exists with 7 tests
- [ ] `__tests__/hooks/useColumnMapping.test.tsx` exists with 5 tests
- [ ] `__tests__/hooks/useClickOutside.test.tsx` exists with 4 tests
- [ ] `__tests__/hooks/useFunnelAnalysis.test.tsx` exists with 6 tests
- [ ] `__tests__/hooks/useRetentionAnalysis.test.tsx` exists with 6 tests
- [ ] All hooks properly mocked (AuthContext, AppContext, Toast, analytics)
- [ ] `renderHook` used from `@testing-library/react`
- [ ] `act` used for state updates
- [ ] Provider wrappers properly configured for each hook
- [ ] Total hook tests: 28+

---

### TF-4: UI Component Tests

#### 2.4.1 Modal (`__tests__/components/Modal.test.tsx`)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../components/Modal';
```

**Test Cases:**
- Renders nothing when `isOpen` is false
- Renders title and children when `isOpen` is true
- Calls `onClose` after Escape key press (with animation delay)
- Calls `onClose` on overlay click (outside content area)
- Does NOT close on content area click (stopPropagation)
- Has `role="dialog"` and `aria-modal="true"`
- Has `aria-labelledby` pointing to title element
- Close button has `aria-label="닫기"`

**Test Count**: 8 tests

#### 2.4.2 Toast (`__tests__/components/Toast.test.tsx`)

```typescript
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../../components/Toast';
```

**Test Cases:**
- `useToast` throws when outside ToastProvider
- Toast appears when `toast()` is called
- Toast shows correct title text
- Toast shows optional message text
- Toast auto-removes after timeout
- Toast has `role="alert"` attribute
- Close button has `aria-label="알림 닫기"`
- Container has `role="status"` and `aria-live="polite"`
- `calcTimeout` returns minimum 3000ms
- `calcTimeout` returns maximum 8000ms

**Test Count**: 10 tests

#### 2.4.3 PlanBadge (`__tests__/components/PlanBadge.test.tsx`)

```typescript
import { render, screen } from '@testing-library/react';
import { PlanBadge } from '../../components/PlanBadge';
// Mock AuthContext
```

**Test Cases:**
- Renders "Pro" text for pro plan user
- Renders Zap icon for pro plan
- Renders "Free" text for free plan user
- Renders "업그레이드" text for free plan
- Renders "Free" when userProfile is null

**Test Count**: 5 tests

#### 2.4.4 PageLoader (`__tests__/components/PageLoader.test.tsx`)

```typescript
import { render, screen } from '@testing-library/react';
import { PageLoader } from '../../components/PageLoader';
```

**Test Cases:**
- Renders spinner element
- Renders "로딩 중..." text
- Has correct layout classes

**Test Count**: 3 tests

#### 2.4.5 ErrorBoundary (`__tests__/components/ErrorBoundary.test.tsx`)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
```

**Test Cases:**
- Renders children when no error
- Shows error UI when child component throws
- Displays "오류가 발생했습니다" heading
- Shows error message in pre element
- "다시 시도" button resets error state
- "페이지 새로고침" button calls location.reload

**Test Count**: 6 tests

#### Verification Checklist (10 items)
- [ ] `__tests__/components/Modal.test.tsx` exists with 8 tests
- [ ] `__tests__/components/Toast.test.tsx` exists with 10 tests
- [ ] `__tests__/components/PlanBadge.test.tsx` exists with 5 tests
- [ ] `__tests__/components/PageLoader.test.tsx` exists with 3 tests
- [ ] `__tests__/components/ErrorBoundary.test.tsx` exists with 6 tests
- [ ] Modal tests verify keyboard (Escape) and click interactions
- [ ] Toast tests verify auto-removal timing
- [ ] ErrorBoundary tests verify error catch and reset
- [ ] All tests use `@testing-library/react` render/screen
- [ ] Total component tests: 32+

---

### TF-5: Lib Module Tests

#### 2.5.1 planManager (`__tests__/unit/planManager.test.ts`)

Test pure functions from `lib/planManager.ts` (mock `supabase` for async functions):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { canUseAI, getAICallsRemaining, getCSVRowLimit, isPro, PLAN_LIMITS, BILLING_PRICES } from '../../lib/planManager';
```

**Test Cases:**
- `PLAN_LIMITS.free.csvRows` equals 10,000
- `PLAN_LIMITS.pro.csvRows` equals 500,000
- `PLAN_LIMITS.free.aiCallsPerDay` equals 3
- `PLAN_LIMITS.pro.aiCallsPerDay` equals 50
- `BILLING_PRICES.monthly` equals 29,000
- `BILLING_PRICES.annual` equals 278,400
- `isPro` returns true for `plan: 'pro'`
- `isPro` returns false for `plan: 'free'`
- `getCSVRowLimit` returns correct limit per plan
- `canUseAI` returns true when reset date is not today
- `canUseAI` returns true when calls < limit today
- `canUseAI` returns false when calls >= limit today
- `getAICallsRemaining` returns full limit when reset date differs
- `getAICallsRemaining` returns remaining when same day

**Test Count**: 14 tests

#### 2.5.2 recentFiles (`__tests__/unit/recentFiles.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadRecentFiles, saveRecentFile, removeRecentFile } from '../../lib/recentFiles';
```

**Mock**: `localStorage` via `vi.stubGlobal`

**Test Cases:**
- `loadRecentFiles` returns empty array when no data
- `loadRecentFiles` returns parsed data from localStorage
- `loadRecentFiles` returns empty array on invalid JSON
- `saveRecentFile` adds file to front of list
- `saveRecentFile` removes duplicate fileName before adding
- `saveRecentFile` limits to RECENT_FILES_MAX_COUNT
- `removeRecentFile` removes file at given index
- `removeRecentFile` updates localStorage

**Test Count**: 8 tests

#### 2.5.3 eventUtils (`__tests__/unit/eventUtils.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { getUsersByEvent, getUsersByEventFuzzy } from '../../lib/eventUtils';
```

**Test Cases:**
- `getUsersByEvent` returns exact matches only
- `getUsersByEvent` returns empty set for no matches
- `getUsersByEventFuzzy` returns partial matches (case-insensitive)
- `getUsersByEventFuzzy` handles null eventName gracefully
- Both functions return Set of unique userIds

**Test Count**: 5 tests

#### Verification Checklist (6 items)
- [ ] `__tests__/unit/planManager.test.ts` exists with 14 tests
- [ ] `__tests__/unit/recentFiles.test.ts` exists with 8 tests
- [ ] `__tests__/unit/eventUtils.test.ts` exists with 5 tests
- [ ] planManager tests cover `PLAN_LIMITS`, `canUseAI`, `getAICallsRemaining`, `isPro`
- [ ] recentFiles tests mock localStorage properly
- [ ] Total lib tests: 27+

---

### TF-6: Test Utilities & Mocking

#### 2.6.1 renderWithProviders (`__tests__/helpers/renderWithProviders.tsx`)

```tsx
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../context/AppContext';
import { ToastProvider } from '../../components/Toast';

type Options = {
  route?: string;
  withRouter?: boolean;
};

export function renderWithProviders(ui: React.ReactElement, options: Options = {}) {
  const { route = '/', withRouter = true } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    const content = (
      <AppProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AppProvider>
    );
    if (withRouter) {
      return <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>;
    }
    return content;
  }

  return render(ui, { wrapper: Wrapper });
}
```

#### 2.6.2 mocks.ts (`__tests__/helpers/mocks.ts`)

```typescript
import { vi } from 'vitest';

// Supabase client mock
export const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
};

// Mock Supabase module
export function mockSupabaseModule() {
  vi.mock('../../lib/supabase', () => ({
    supabase: mockSupabase,
  }));
}

// Mock AuthContext
export function createMockAuthContext(overrides = {}) {
  return {
    user: null,
    session: null,
    userProfile: null,
    isLoading: false,
    isGuest: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
    ...overrides,
  };
}

// Mock analytics (no-op)
export function mockAnalytics() {
  vi.mock('../../lib/analytics', () => ({
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
  }));
}

// Mock Sentry (no-op)
export function mockSentry() {
  vi.mock('../../lib/sentry', () => ({
    Sentry: {
      captureException: vi.fn(),
      init: vi.fn(),
    },
  }));
}

// localStorage mock helper
export function createMockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
}
```

#### Verification Checklist (6 items)
- [ ] `__tests__/helpers/renderWithProviders.tsx` exists
- [ ] `renderWithProviders` wraps with AppProvider + ToastProvider
- [ ] `renderWithProviders` supports optional MemoryRouter
- [ ] `__tests__/helpers/mocks.ts` exists
- [ ] `mocks.ts` exports Supabase mock, AuthContext mock, localStorage mock, analytics mock
- [ ] Mock helpers use `vi.fn()` and `vi.mock()` patterns

---

## 3. Implementation Order

| Step | Task ID | File(s) | Description |
|------|---------|---------|-------------|
| 1 | TF-1 | `package.json`, `vitest.config.ts`, `setupTests.ts` | npm install + config + setup |
| 2 | TF-6 | `helpers/renderWithProviders.tsx`, `helpers/mocks.ts` | Test utilities + mock helpers |
| 3 | TF-5 | `unit/planManager.test.ts`, `unit/recentFiles.test.ts`, `unit/eventUtils.test.ts` | Lib module tests (27 tests) |
| 4 | TF-2 | `unit/reducer.test.ts` | Reducer tests (22 tests) |
| 5 | TF-3 | `hooks/*.test.tsx` (5 files) | Hook tests (28 tests) |
| 6 | TF-4 | `components/*.test.tsx` (5 files) | Component tests (32 tests) |

## 4. Total Verification Items

| Task | Items |
|------|-------|
| TF-1: Infrastructure Setup | 8 |
| TF-2: Reducer Tests | 4 |
| TF-3: Hook Tests | 10 |
| TF-4: Component Tests | 10 |
| TF-5: Lib Module Tests | 6 |
| TF-6: Test Utilities | 6 |
| **Total** | **44** |

## 5. Test Count Summary

| Category | Files | Tests |
|----------|:-----:|:-----:|
| Existing unit tests | 7 | ~48 |
| Existing integration tests | 7 | ~50 |
| NEW: Reducer (TF-2) | 1 | 22 |
| NEW: Lib modules (TF-5) | 3 | 27 |
| NEW: Hooks (TF-3) | 5 | 28 |
| NEW: Components (TF-4) | 5 | 32 |
| **Total** | **28** | **207+** |

## 6. Dependencies

**New devDependencies:**
- `@testing-library/react` ^16.3.0
- `@testing-library/jest-dom` ^6.6.0
- `@testing-library/user-event` ^14.6.0
- `jsdom` ^26.0.0

**No production dependency changes.**

## 7. Key Mocking Strategy

| Module | Mock Approach |
|--------|---------------|
| `lib/supabase` | `vi.mock` → chainable mock object |
| `context/AuthContext` | `vi.mock` → `useAuth` returns mock profile |
| `context/AppContext` | `vi.mock` → `useAppContext` returns mock state/dispatch |
| `lib/analytics` | `vi.mock` → no-op `trackEvent`/`trackPageView` |
| `lib/sentry` | `vi.mock` → no-op `captureException` |
| `components/Toast` | Either real ToastProvider or `vi.mock` → mock `useToast` |
| `localStorage` | `vi.stubGlobal` → in-memory store |
| `window.matchMedia` | `vi.fn` → returns mock MediaQueryList |
| `ResizeObserver` | `vi.stubGlobal` → no-op class |

## 8. Existing Test Compatibility

기존 14개 테스트 파일은 순수 Node.js 함수 테스트이므로 jsdom 환경에서도 정상 동작합니다.
만약 호환 문제 발생 시 파일 상단에 `// @vitest-environment node` 주석을 추가하여 개별 환경 지정 가능합니다.
