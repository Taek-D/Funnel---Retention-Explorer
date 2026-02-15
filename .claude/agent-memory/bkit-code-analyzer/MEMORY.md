# Code Analyzer Memory

## Project: Funnel & Retention Explorer (React Frontend)

### Architecture
- Provider hierarchy: ErrorBoundary > AuthProvider > AppProvider > ToastProvider > NotificationProvider > RouterProvider
- State management: useReducer with typed actions (discriminated union)
- Lazy loading: All pages except LandingPage use React.lazy
- i18n: react-i18next with ko/en, 3 namespaces (common, pages, insights)
- Vite chunk splitting configured for vendor-react, vendor-charts, vendor-supabase, vendor-data, vendor-monitoring

### Security Issues (2026-02-15 Audit)
See `security-audit-2026-02-15.md` for full details.

**CRITICAL**:
- SQL Injection in `connector-proxy` (PostgreSQL/MySQL handlers) - user query executed without sanitization
- SSRF in `webhook-dispatch` - no URL validation, no authentication
- OAuth CSRF in `connector-oauth` - state param is unsigned base64
- `webhook-dispatch` has zero auth checks

**HIGH**:
- `toss-webhook` bypasses signature verification when secret env not set (returns true)
- `connector-sync` uses `String.includes()` for auth instead of strict equality
- `ai-proxy` forwards entire request body to Gemini without validation
- Connector credentials (OAuth tokens, DB passwords) stored in plain text in DB

**WARNING**:
- All 14 Edge Functions use `Access-Control-Allow-Origin: '*'`
- `console.error` in client-side supabaseData.ts (4 locations)
- Admin API `select('*')` returns billing keys in user detail
- Missing `.env.example` template

### Known Code Issues (2026-02-11 Analysis)
- `ProtectedRoute` is a no-op (always renders Outlet) - guest mode design choice
- `reportEngine.ts` uses `window.open('')` for iOS Safari fallback (previous `document.write()` fixed)
- Duplicate `generateInsights()` call pattern across 4 hooks
- TermsPage and PrivacyPage have hardcoded Korean text (no i18n)

### Feature Analysis Batch 1 (2026-02-15)
**5 Features**: Chart Annotations, Anomaly Detection, NL Query, Saved Views, Multi-CSV Blending
**Quality**: 87/100

### Feature Analysis Batch 2 (2026-02-15)
**5 Features**: Funnel Breakdown, Period Comparison, Goal Tracker, Alert Watchlist, Quick Share
**Quality**: 85/100

**P0 Issues**:
- Incomplete localStorage schema validation in goalTracker.ts and alertWatchlist.ts (unit/status/condition fields not validated against union types)
- useAlertWatchlist effect fires on every metrics ref change, writing to localStorage unnecessarily

**P1 Issues**:
- Hardcoded English strings in GoalTrackerPanel (STATUS_STYLES, METRIC_OPTIONS) and AlertWatchlist (ALERT_METRICS) bypass i18n
- Zero ARIA attributes on all 5 new components
- Missing React.memo on PeriodComparisonCard and GoalRow
- DRY violation: goalTracker.ts and alertWatchlist.ts share identical CRUD pattern
- Prototype pollution vector in funnelBreakdown bucket keys

**Patterns Confirmed**:
- localStorage CRUD pattern: try/catch + JSON.parse + Array.isArray + type guard filter (used in 4+ files now, needs generic extraction)
- New features consistently miss accessibility (ARIA) -- recurring theme across batches

### Code Quality Positives
- Zero `any` types in source code
- Zero `console.log` in source (only in supabase edge functions)
- Zero `eval()`, `innerHTML`, `dangerouslySetInnerHTML` in source
- No hardcoded API keys or secrets in source
- Proper ErrorBoundary with Sentry integration
- sanitizeEventName strips `<>"'&` from CSV input
- CSV parser has file size (50MB) and row count (100K) limits
- Auth tokens in Authorization header, not localStorage
- `.env.local` gitignored via `*.local` pattern
- tsconfig `strict: true` enabled (fixed from previous audit)
- 351 unit/integration tests passing
