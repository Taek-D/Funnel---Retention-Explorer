# Design: Phase 1 — Stability & Security

> Plan Reference: `docs/01-plan/project-overview.plan.md` (Phase 1)

---

## Overview

| Item | Detail |
|------|--------|
| Phase | 1: Stability & Security |
| Tasks | 5 (W2, W3, W4, W5, W6) |
| Goal | Production-grade reliability + security hardening |

---

## D1. CSV File Validation (W4)

### Problem
`parseCSV(file)` accepts files of any size. Large or malicious CSV files can crash the browser.

### Design
- Add `MAX_FILE_SIZE = 50 * 1024 * 1024` (50MB)
- Add `MAX_ROW_COUNT = 100_000`
- Validate in `parseCSV()` before parsing — reject with Korean error message
- Also validate in `handleFileUpload()` for immediate user feedback

### Files Changed
- `lib/csvParser.ts`: Add size check before `readAsText`, add row count check after parse
- `hooks/useCSVUpload.ts`: Add file size check with toast notification

---

## D2. Remove CSV Data from localStorage (W3)

### Problem
`RecentFile.csvData` stores entire CSV text in localStorage (5-10MB limit). Security risk + performance issue.

### Design
- Remove `csvData` from `RecentFile` interface — replace with metadata-only fields
- Recent files become metadata records (file name, date, row/column counts) — no reload capability
- Remove `loadRecentFileByIndex` functionality (users must re-upload)
- Update `saveRecentFile` to store only metadata
- Update UI to show "다시 업로드 필요" instead of clickable reload

### Files Changed
- `types/index.ts`: Remove `csvData`, add `rowCount`, `columnCount`
- `lib/recentFiles.ts`: Update `saveRecentFile` signature
- `hooks/useCSVUpload.ts`: Remove `loadRecentFileByIndex`, update `saveRecentFile` call

---

## D3. Supabase Placeholder Client (W2)

### Problem
When env vars are missing, a placeholder Supabase client is created with fake credentials. This could leak in network requests or confuse debugging.

### Design
- Change `supabase` export to `SupabaseClient | null`
- When `isSupabaseConfigured` is false, export `null`
- Guard all `supabase` usage with null checks
- `AuthContext`: Skip auth setup when supabase is null (pure guest mode)
- `supabaseData`: Return empty arrays / throw descriptive errors when supabase is null

### Files Changed
- `lib/supabase.ts`: Export null when not configured
- `context/AuthContext.tsx`: Guard supabase calls
- `lib/supabaseData.ts`: Guard all DB operations

---

## D4. Event Name Sanitization (W5)

### Problem
CSV event names are rendered directly in UI. While React escapes text, adding a sanitization layer prevents future issues.

### Design
- Add `sanitizeEventName()` in `lib/formatters.ts`
- Strip `<`, `>`, `"`, `'`, `&` characters
- Apply during `processData()` in `dataProcessor.ts`

### Files Changed
- `lib/formatters.ts`: Add `sanitizeEventName()`
- `lib/dataProcessor.ts`: Apply to event names during processing

---

## D5. Funnel Engine Null Checks (W6)

### Problem
`calculateMedianTimeBetweenSteps` doesn't guard against empty events or identical timestamps gracefully.

### Design
- Add early return when `userSet` is empty
- Guard `step1Events[0]` access with length check
- Return `{ median: 0 }` for edge cases

### Files Changed
- `lib/funnelEngine.ts`: Add guards in `calculateMedianTimeBetweenSteps`

---

## Implementation Order

```
D1 (CSV validation) → D2 (localStorage) → D3 (Supabase) → D4 (sanitization) → D5 (null checks)
```

D1-D2 are related (CSV pipeline), D3 is independent, D4-D5 are small fixes.

---

*Created: 2026-02-09*
*PDCA Phase: Design*
