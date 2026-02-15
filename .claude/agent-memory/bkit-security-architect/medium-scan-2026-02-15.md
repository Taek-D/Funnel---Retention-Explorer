# Medium Severity Security Scan - 2026-02-15

## Scope
- Frontend: `funnel-&-retention-explorer frontend/` (lib, hooks, pages, components, context)
- Backend: 14 Supabase Edge Functions
- Focus: MEDIUM severity only (Critical/High already fixed)

## Summary
- Files scanned: ~80 (TS/TSX + Edge Functions)
- Issues found: 10 (all MEDIUM)

## Findings

### M-01: ErrorBoundary Exposes Raw Error Messages to Users
### M-02: Missing Content-Security-Policy Header
### M-03: Database Credentials Stored Unencrypted in Supabase
### M-04: Toss Webhook Signature Bypass in Dev Mode
### M-05: scheduled-report Edge Function Lacks Authentication
### M-06: Admin API Leaks Supabase Error Details
### M-07: console.error Statements in Production Code
### M-08: Unvalidated OAuth Redirect URL on Client Side
### M-09: Share Token Uses UUID (Guessable for Enumeration)
### M-10: No Client-Side Rate Limiting on Authentication Forms

See main response for full details with file paths, line numbers, and fixes.
