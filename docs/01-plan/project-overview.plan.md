# PDCA Plan: Funnel & Retention Explorer (FRE)

> Project-level plan document covering current state assessment and improvement roadmap.

---

## 1. Project Summary

| Item | Detail |
|------|--------|
| **Project Name** | Funnel & Retention Explorer (FRE) |
| **Type** | CSV-based Analytics SaaS Dashboard |
| **Tech Stack** | React 19 + TypeScript 5.8 + Vite 6 |
| **Deployment** | Vercel (auto-deploy on main push) |
| **Backend** | Supabase (Auth + PostgreSQL) |
| **AI** | Gemini 2.0 Flash API |
| **LOC** | ~6,700 lines (React frontend) |
| **Test Files** | 14 (unit + integration, Vitest) |
| **Domain** | fre-analytics-castletaek9643-9522s-projects.vercel.app |

---

## 2. Current Architecture

### 2.1 Directory Structure

```
funnel-&-retention-explorer frontend/
├── lib/           (13 modules)  Pure TS business logic
├── hooks/         (9 hooks)     React integration layer
├── pages/         (10 pages)    Page components
├── components/    (13 components) Shared UI
├── context/       (4 files)     State management (useReducer)
├── types/         (1 file)      20+ TypeScript interfaces
├── __tests__/     (14 files)    Unit + integration tests
└── public/                      Static assets
```

### 2.2 Provider Hierarchy

```
React.StrictMode
  └─ ErrorBoundary
      └─ AuthProvider (Supabase Auth)
          └─ AppProvider (useReducer, 18 actions)
              └─ ToastProvider
                  └─ NotificationProvider
                      └─ RouterProvider
```

### 2.3 Data Flow

```
CSV File Upload
  → papaparse parsing
  → Auto column detection (name-based + value-based)
  → User confirms mapping
  → processData() → ProcessedEvent[]
  → Analysis engines (funnel / retention / segment / subscription)
  → Insights generation (rule-based + AI)
  → Recharts visualization
```

### 2.4 Routing

| Route | Page | Description |
|-------|------|-------------|
| `/` | LandingPage | Marketing landing page |
| `/login` | LoginPage | Email/password login |
| `/signup` | SignupPage | Registration |
| `/app/dashboard` | Dashboard | KPI cards + summary charts |
| `/app/upload` | DataImport | CSV upload + column mapping |
| `/app/funnels` | FunnelAnalysis | Funnel builder + visualization |
| `/app/retention` | RetentionAnalysis | Cohort retention heatmap |
| `/app/segments` | SegmentComparison | Segment funnel comparison |
| `/app/insights` | Insights | Rule-based + AI insights |

---

## 3. Implemented Features

### 3.1 Core Analytics (Complete)

| Feature | Module | Status |
|---------|--------|--------|
| CSV Upload & Parsing | csvParser.ts | ✅ Complete |
| Auto Column Detection (Name) | dataProcessor.ts, constants.ts | ✅ Complete |
| Auto Column Detection (Value) | columnValueDetector.ts | ✅ Complete |
| Funnel Analysis | funnelEngine.ts | ✅ Complete |
| Funnel Templates | constants.ts | ✅ Complete |
| Activity Retention (D0-D14) | retentionEngine.ts | ✅ Complete |
| Paid Retention (D0-D90) | retentionEngine.ts | ✅ Complete |
| Segment Comparison | segmentEngine.ts | ✅ Complete |
| Statistical Significance (p-value) | segmentEngine.ts | ✅ Complete |
| Subscription KPIs | subscriptionEngine.ts | ✅ Complete |
| Trial/Churn Analysis | subscriptionEngine.ts | ✅ Complete |
| Rule-based Insights (12 patterns) | insightsEngine.ts | ✅ Complete |
| AI Insights (Gemini) | geminiClient.ts | ✅ Complete |

### 3.2 SaaS Features (Complete)

| Feature | Module | Status |
|---------|--------|--------|
| Email/Password Auth | Supabase Auth | ✅ Complete |
| Guest Mode | ProtectedRoute | ✅ Complete |
| Project Management (CRUD) | supabaseData.ts | ✅ Complete |
| Dataset Storage | supabaseData.ts | ✅ Complete |
| Analysis Snapshots | supabaseData.ts | ✅ Complete |

### 3.3 UI/UX (Complete)

| Feature | Module | Status |
|---------|--------|--------|
| Dark Mode Theme | index.html (Tailwind config) | ✅ Complete |
| Responsive Layout | AppShell + Sidebar | ✅ Complete |
| Landing Page | LandingPage.tsx | ✅ Complete |
| Toast Notifications | Toast.tsx | ✅ Complete |
| Search Modal (Cmd+K) | SearchModal component | ✅ Complete |
| Error Boundary | ErrorBoundary.tsx | ✅ Complete |

---

## 4. Quality Assessment

### 4.1 Code Quality Score: 87/100

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | 92/100 | Clean lib/hooks/pages separation |
| Type Safety | 95/100 | Zero `any` types (fixed) |
| Security | 85/100 | Guest mode, no XSS, env vars |
| Performance | 88/100 | retentionEngine optimized (fixed) |
| Test Coverage | 75/100 | 14 test files, missing unit tests for some modules |
| Convention Compliance | 90/100 | 6 inline styles remaining |

### 4.2 Critical Issues (Resolved)

| Issue | Status |
|-------|--------|
| Forbidden `any` types (5 occurrences) | ✅ Fixed |
| Missing ErrorBoundary | ✅ Fixed |
| retentionEngine O(n^2) performance | ✅ Fixed |

### 4.3 Remaining Issues (from Code Review)

#### Warning Level (8 items)

| # | Issue | Priority |
|---|-------|----------|
| W1 | Inline styles in 6 components | Medium |
| W2 | Supabase placeholder client | Medium |
| W3 | CSV data stored in localStorage | High |
| W4 | No CSV file size validation | High |
| W5 | Event name not sanitized | Medium |
| W6 | Missing null checks in funnelEngine | Medium |
| W7 | Deep nesting in columnValueDetector | Low |
| W8 | Duplicate code in segment/funnel engines | Low |

#### Info Level (6 items)

| # | Issue | Priority |
|---|-------|----------|
| I1 | Missing unit tests for critical algorithms | Medium |
| I2 | Magic numbers without constants | Low |
| I3 | Long function in useCSVUpload (62 lines) | Low |
| I4 | No AI query timeout/retry | Low |
| I5 | Mixed Korean/English error messages | Low |
| I6 | React 19 features not utilized | Low |

---

## 5. Improvement Roadmap

### Phase 1: Stability & Security (High Priority)

**Goal**: Production-grade reliability and security hardening

| Task | Effort | Impact |
|------|--------|--------|
| CSV file size/row validation (W4) | 1h | High |
| Remove CSV data from localStorage (W3) | 2h | High |
| Remove Supabase placeholder client (W2) | 1h | Medium |
| Add event name sanitization (W5) | 1h | Medium |
| Add null checks in funnelEngine (W6) | 1h | Medium |

### Phase 2: Code Quality (Medium Priority)

**Goal**: Convention compliance and maintainability

| Task | Effort | Impact |
|------|--------|--------|
| Replace inline styles with Tailwind (W1) | 2h | Medium |
| Extract duplicate code (W8) | 1h | Medium |
| Add unit tests for business logic (I1) | 4h | High |
| Extract magic numbers to constants (I2) | 1h | Low |
| Refactor long useCSVUpload function (I3) | 2h | Low |

### Phase 3: Enhancement (Low Priority)

**Goal**: Feature improvements and modernization

| Task | Effort | Impact |
|------|--------|--------|
| AI query timeout/retry logic (I4) | 1h | Low |
| Standardize error messages to Korean (I5) | 1h | Low |
| Explore React 19 features (I6) | 3h | Low |
| Bundle size optimization (code splitting) | 3h | Medium |
| Accessibility improvements (ARIA labels) | 3h | Medium |

---

## 6. Technical Debt Summary

### Dependencies

| Package | Current | Category |
|---------|---------|----------|
| react | 19.2.4 | Core |
| react-router-dom | 7.13.0 | Routing |
| recharts | 3.7.0 | Charts |
| @supabase/supabase-js | 2.95.2 | Backend |
| papaparse | 5.5.3 | CSV |
| vite | 6.2.0 | Build |
| typescript | 5.8.2 | Language |
| vitest | 4.0.18 | Testing |

### Bundle Size

- Current: ~1,013 KB (minified)
- Major contributors: recharts (~400KB), supabase (~200KB), papaparse (~100KB)
- Recommendation: Dynamic imports for recharts (code splitting)

### Database Schema

```
fre_projects (with RLS)
├── id, user_id, name, description, created_at

fre_datasets (with RLS)
├── id, project_id, name, file_name, row_count, column_mapping, created_at

fre_analysis_snapshots (with RLS)
├── id, dataset_id, analysis_type, config, results, created_at
```

---

## 7. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Code Quality Score | 87/100 | 95/100 |
| `any` Type Count | 0 | 0 (maintained) |
| Test Coverage (files) | 14 files | 20+ files |
| Build Success Rate | 100% | 100% |
| Bundle Size | 1,013 KB | < 800 KB |
| Convention Violations | 8 warnings | 0 warnings |
| Error Boundary Coverage | Root only | Root + per-page |

---

## 8. PDCA Cycle Plan

```
[Plan] ✅ (this document)
  ↓
[Design] ⏳ — Feature-level design docs for each improvement phase
  ↓
[Do] ⏳ — Implementation of improvements
  ↓
[Check] ⏳ — Gap analysis (target: 90%+ match rate)
  ↓
[Act] ⏳ — Iterate if needed
  ↓
[Report] ⏳ — Completion report
```

### Suggested Next Steps

1. `/pdca design stability-security` — Phase 1 design document
2. `/pdca design code-quality` — Phase 2 design document
3. Implementation → Gap analysis → Iterate

---

*Generated: 2026-02-09*
*PDCA Phase: Plan*
*Project Level: Dynamic (SaaS with Auth + DB)*
