# Security Architect Memory

## Project Architecture
- React 19 + TypeScript + Vite 6 SaaS dashboard
- Supabase (Auth + PostgreSQL + Edge Functions) backend
- 14 Edge Functions (Deno runtime)
- Client env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY
- Tailwind via CDN, TossPayments CDN script
- .env.local excluded from git via `*.local` in .gitignore

## Security Audit History
- 2026-02-15: Full OWASP Top 10 audit completed. See `audit-2026-02-15.md`.
- 2026-02-15: Medium severity scan completed. See `medium-scan-2026-02-15.md`.

## Key Findings (Critical/High) -- ALL FIXED
- SQL injection in connector-proxy (FIXED - validateSQLQuery)
- SSRF in webhook-dispatch (FIXED - URL validation + JWT auth)
- Overly permissive CORS (FIXED - FRONTEND_URL env var)
- OAuth state not signed (FIXED - HMAC-SHA256)
- Guest mode on sensitive routes (FIXED - AuthRequiredRoute)
- No security headers (FIXED - vercel.json)
- AI proxy unvalidated (FIXED - schema validation + limits)

## Medium Findings (2026-02-15) -- 10 issues found
- See `medium-scan-2026-02-15.md` for full details
- ErrorBoundary exposes error.message to UI
- No CSP header in vercel.json
- DB credentials stored in Supabase unencrypted
- Toss-webhook signature bypass when TOSS_WEBHOOK_SECRET not set
- scheduled-report has no auth gate
- admin-api error messages reveal Supabase internals
- console.error in production supabaseData.ts
- OAuth redirect URL from server not validated on client
- Shared report share_token is UUID (low entropy for public tokens)
- No client-side rate limiting on login/signup

## Low Findings (2026-02-15) -- 18 issues found
- See `low-scan-2026-02-15.md` for full details
- Key themes: missing autocomplete/maxLength on forms, CSP blocks Google Fonts,
  no SRI on CDN scripts, .env.example missing, HMAC not timing-safe,
  connector-sync weak auth (.includes), webhook secret in client JS,
  no Cache-Control on Edge Function responses, outdated Deno std lib
