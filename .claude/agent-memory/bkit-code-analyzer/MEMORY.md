# Code Analyzer Memory

## Project: Funnel & Retention Explorer (React Frontend)

### Architecture
- Provider hierarchy: ErrorBoundary > AuthProvider > AppProvider > ToastProvider > NotificationProvider > RouterProvider
- State management: useReducer with typed actions (discriminated union)
- Lazy loading: All pages except LandingPage use React.lazy
- i18n: react-i18next with ko/en, 3 namespaces (common, pages, insights)
- Vite chunk splitting configured for vendor-react, vendor-charts, vendor-supabase, vendor-data, vendor-monitoring

### Known Issues (2026-02-11 Analysis)
- **CRITICAL**: `insightsEngine.ts` line 31 - `const t = i18n.t.bind(i18n)` defined inside block scope, used outside
- tsconfig has no `strict: true` - many potential type safety issues go undetected
- `ProtectedRoute` is a no-op (always renders Outlet) - guest mode design choice
- `reportEngine.ts` line 385 uses `document.write()` - XSS risk with data URLs
- Duplicate `generateInsights()` call pattern across 4 hooks
- Duplicate `buildAnalysisPrompt()` context building in useAIInsights (2x identical)
- TermsPage and PrivacyPage have hardcoded Korean text (no i18n)
- FunnelAnalysis.tsx line 152 has hardcoded "Lifecycle" string

### Code Quality Positives
- Zero `any` types in source code
- Zero `console.log` in source (only in supabase edge functions)
- Proper ErrorBoundary with Sentry integration
- Good i18n coverage across pages/components
- Accessibility: aria-labels on Sidebar, Modal, Toast; role="dialog" on modals
- 35 test files covering unit, integration, hooks, components
- sanitizeEventName strips XSS chars from CSV input
