# Admin Dashboard Design Document

> **Summary**: Backend implementation design for admin dashboard - Edge Function with path routing + DB migration
>
> **Project**: FRE Analytics
> **Version**: 1.0.0
> **Author**: AI
> **Date**: 2026-02-13
> **Status**: Draft
> **Planning Doc**: [admin-dashboard.plan.md](../../01-plan/features/admin-dashboard.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- Create a single `admin-api` Edge Function with path-based routing to serve 6 endpoints
- Add `role` column to `fre_user_profiles` via migration
- Match the exact API contract defined in `lib/adminApi.ts`
- Ensure admin-only access via JWT verification + role check

### 1.2 Design Principles

- Single Edge Function with URL path routing (matches frontend `adminFetch` pattern)
- Service-role client for cross-user data access (bypass RLS)
- JWT auth for user identity + profile lookup for admin role verification
- Consistent error response format: `{ error: string }`

---

## 2. Architecture

### 2.1 Component Diagram

```
Frontend (adminApi.ts)
  │
  │  Authorization: Bearer <JWT>
  ▼
Supabase Edge Function: admin-api (verify_jwt: true)
  │
  ├─ 1. Extract user from JWT (supabase.auth.getUser)
  ├─ 2. Check role via service_role client
  ├─ 3. Route by URL path + HTTP method
  │
  ▼
Supabase PostgreSQL (service_role, bypass RLS)
  ├─ fre_user_profiles (+ new role column)
  ├─ fre_billing_history
  ├─ fre_projects
  └─ auth.users (admin API only)
```

### 2.2 Request Flow

```
1. Frontend calls: SUPABASE_URL/functions/v1/admin-api/stats
2. Edge Function receives request
3. Extract path: new URL(req.url).pathname → "/admin-api/stats"
4. Strip prefix: "/stats"
5. Verify JWT → get user ID
6. Check fre_user_profiles.role === 'admin' (via service_role)
7. If not admin → 403
8. Route to handler based on path + method
9. Execute SQL query via service_role client
10. Return JSON response
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| admin-api Edge Function | Supabase Auth | JWT verification |
| admin-api Edge Function | fre_user_profiles.role | Admin role check |
| admin-api /stats | fre_user_profiles, fre_billing_history, auth.users | Aggregate stats |
| admin-api /users | auth.users + fre_user_profiles | User listing |
| admin-api /users/:id | auth.users + fre_user_profiles + fre_billing_history + fre_projects | User detail |
| admin-api /billing | fre_billing_history | Billing records |
| admin-api /revenue | fre_billing_history | Monthly aggregation |

---

## 3. Data Model

### 3.1 Migration: Add `role` column

```sql
-- Migration: add_admin_role
ALTER TABLE fre_user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));
```

### 3.2 Existing Tables Used (no changes)

- `fre_user_profiles` - User plan, subscription, billing info
- `fre_billing_history` - Payment records
- `fre_projects` - User projects
- `auth.users` - Email, sign-in timestamps (Supabase managed)

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /stats | Dashboard KPI stats | Admin |
| GET | /users | Paginated user list | Admin |
| GET | /users/:id | User detail | Admin |
| PATCH | /users/:id | Update user profile | Admin |
| GET | /billing | Paginated billing records | Admin |
| GET | /revenue | Monthly revenue data | Admin |

### 4.2 Auth Middleware (all endpoints)

```typescript
// 1. Create anon client with user's JWT
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } }
});
const { data: { user } } = await supabase.auth.getUser();
if (!user) return 401;

// 2. Check admin role via service_role client
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const { data: profile } = await serviceClient
  .from('fre_user_profiles')
  .select('role')
  .eq('id', user.id)
  .single();
if (profile?.role !== 'admin') return 403;
```

### 4.3 GET /stats

**Response:**
```json
{
  "totalUsers": 150,
  "proUsers": 23,
  "todaySignups": 5,
  "mrr": 667000
}
```

**SQL Logic:**
```sql
-- totalUsers: count from auth.users (via admin API)
SELECT count(*) FROM auth.users;

-- proUsers: count from fre_user_profiles where plan = 'pro'
SELECT count(*) FROM fre_user_profiles WHERE plan = 'pro';

-- todaySignups: count from auth.users where created_at >= today
SELECT count(*) FROM auth.users
WHERE created_at >= CURRENT_DATE;

-- mrr: sum of active monthly billings
-- Pro monthly = 29,000, annual = 278,400/12 = 23,200
SELECT
  COALESCE(SUM(CASE
    WHEN billing_cycle = 'monthly' THEN 29000
    WHEN billing_cycle = 'annual' THEN 23200
    ELSE 0
  END), 0) as mrr
FROM fre_user_profiles
WHERE plan = 'pro' AND subscription_status = 'active';
```

**Implementation:** Use `serviceClient.rpc()` or raw SQL via `serviceClient.from()` queries.

### 4.4 GET /users

**Query Params:** `page` (default 1), `search` (email filter), `plan` (free/pro)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "last_sign_in_at": "2026-02-13T10:00:00Z",
      "created_at": "2026-01-01T00:00:00Z",
      "role": "user",
      "plan": "free",
      "subscription_status": "none",
      "billing_cycle": "monthly"
    }
  ],
  "page": 1,
  "total": 150
}
```

**Implementation:**
```typescript
// Use Supabase Admin API to list auth.users
const PAGE_SIZE = 20;
const { data: { users }, error } = await serviceClient.auth.admin.listUsers({
  page, perPage: PAGE_SIZE
});

// Join with fre_user_profiles for plan/role data
// For each user, fetch profile and merge
```

**Note:** `serviceClient.auth.admin.listUsers()` requires service_role. For search/filter, post-filter on email and plan after fetch. For efficiency with large user bases, use raw SQL via `serviceClient.rpc()`.

### 4.5 GET /users/:id

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "last_sign_in_at": "2026-02-13T10:00:00Z",
    "created_at": "2026-01-01T00:00:00Z"
  },
  "profile": {
    "plan": "pro",
    "role": "user",
    "subscription_status": "active",
    "billing_cycle": "monthly",
    "...": "all fre_user_profiles columns"
  },
  "billing": [
    { "id": "uuid", "order_id": "FRE-...", "amount": 29000, "status": "success", "created_at": "..." }
  ],
  "projects": [
    { "id": "uuid", "name": "My Project", "created_at": "..." }
  ]
}
```

**Implementation:**
```typescript
// 1. Get auth user
const { data: { user: targetUser } } = await serviceClient.auth.admin.getUserById(userId);

// 2. Get profile
const { data: profile } = await serviceClient
  .from('fre_user_profiles').select('*').eq('id', userId).single();

// 3. Get billing history (last 20)
const { data: billing } = await serviceClient
  .from('fre_billing_history').select('*').eq('user_id', userId)
  .order('created_at', { ascending: false }).limit(20);

// 4. Get projects
const { data: projects } = await serviceClient
  .from('fre_projects').select('id, name, created_at').eq('user_id', userId);
```

### 4.6 PATCH /users/:id

**Request:**
```json
{
  "plan": "pro",
  "role": "admin"
}
```

**Response:**
```json
{ "success": true }
```

**Implementation:**
```typescript
const body = await req.json();
const updates: Record<string, unknown> = {};
if (body.plan) updates.plan = body.plan;
if (body.role) updates.role = body.role;

await serviceClient
  .from('fre_user_profiles')
  .update(updates)
  .eq('id', userId);
```

**Security:** Validate `plan` is in `['free', 'pro']` and `role` is in `['user', 'admin']`.

### 4.7 GET /billing

**Query Params:** `page` (default 1), `status` (success/failed/refunded)

**Response:**
```json
{
  "records": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "order_id": "FRE-RENEW-...",
      "amount": 29000,
      "status": "success",
      "created_at": "2026-02-01T00:00:00Z"
    }
  ],
  "page": 1,
  "total": 50
}
```

**Implementation:**
```typescript
const PAGE_SIZE = 20;
let query = serviceClient
  .from('fre_billing_history')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

if (status) query = query.eq('status', status);
const { data, count } = await query;
```

### 4.8 GET /revenue

**Response:**
```json
{
  "revenue": [
    { "month": "2026-01", "revenue": 580000 },
    { "month": "2026-02", "revenue": 667000 }
  ]
}
```

**Implementation (SQL):**
```sql
SELECT
  TO_CHAR(created_at, 'YYYY-MM') as month,
  SUM(amount) as revenue
FROM fre_billing_history
WHERE status = 'success'
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;
```

Since Supabase JS client doesn't support GROUP BY directly, use raw SQL via `serviceClient.rpc()` or create a DB function.

---

## 5. UI/UX Design

All UI is already implemented (frontend-complete). No UI changes needed.

| Component | File | Status |
|-----------|------|--------|
| AdminDashboard | `pages/AdminDashboard.tsx` | Complete |
| AdminUsers | `pages/AdminUsers.tsx` | Complete |
| AdminBilling | `pages/AdminBilling.tsx` | Complete |
| AdminRoute | `components/AdminRoute.tsx` | Complete |
| AdminNav | `components/AdminNav.tsx` | Complete |
| UserDetailModal | `components/UserDetailModal.tsx` | Complete |
| adminApi client | `lib/adminApi.ts` | Complete |
| Sidebar admin link | `components/Sidebar.tsx` | Complete |
| i18n keys | `locales/ko,en/common.json` | Complete |

---

## 6. Error Handling

### 6.1 Error Codes

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 401 | Authentication required | No JWT or invalid JWT | Frontend redirects to login |
| 403 | Admin access required | User is not admin | Frontend shows error toast |
| 400 | Invalid request | Bad path or params | Frontend shows error message |
| 404 | User not found | Invalid user ID | Frontend shows error in modal |
| 500 | Internal server error | DB query failure | Log + generic error message |

### 6.2 Error Response Format

```json
{ "error": "Human-readable error message" }
```

---

## 7. Security Considerations

- [x] JWT verification via `verify_jwt: true` in function config
- [x] Admin role check on every request (service_role lookup)
- [x] Service-role client only created after admin verification
- [x] Input validation for PATCH (whitelist allowed fields/values)
- [x] No sensitive data leakage (billing keys, secrets not exposed)
- [x] CORS headers configured (same pattern as other edge functions)

### 7.1 PATCH Validation Rules

```typescript
const ALLOWED_PLANS = ['free', 'pro'];
const ALLOWED_ROLES = ['user', 'admin'];

// Reject invalid values
if (body.plan && !ALLOWED_PLANS.includes(body.plan)) return 400;
if (body.role && !ALLOWED_ROLES.includes(body.role)) return 400;
```

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Build | Vite build succeeds | `vite build` |
| Unit | Existing 310 tests pass | Vitest |
| Manual | Admin pages load with data | Browser |

### 8.2 Test Cases

- [ ] Build passes with no TypeScript errors
- [ ] All 310 existing tests pass
- [ ] Edge Function returns 401 for unauthenticated requests
- [ ] Edge Function returns 403 for non-admin users
- [ ] GET /stats returns valid AdminStats shape
- [ ] GET /users returns paginated user list
- [ ] GET /users/:id returns user detail with billing + projects
- [ ] PATCH /users/:id updates plan and role
- [ ] GET /billing returns paginated billing records
- [ ] GET /revenue returns monthly aggregation

---

## 9. Implementation Guide

### 9.1 File Structure

```
supabase/functions/admin-api/
└── index.ts            # Single file with path routing

supabase/migrations/
└── 20260213_add_admin_role.sql  # role column migration
```

### 9.2 Implementation Order

1. [ ] Create migration SQL file: `supabase/migrations/20260213_add_admin_role.sql`
2. [ ] Apply migration to production via Supabase MCP
3. [ ] Create `supabase/functions/admin-api/index.ts` with all 6 route handlers
4. [ ] Deploy Edge Function to production
5. [ ] Set initial admin user via SQL: `UPDATE fre_user_profiles SET role = 'admin' WHERE id = '<user-id>'`
6. [ ] Run `vite build` to verify no frontend regressions
7. [ ] Run `vitest run` to verify all tests pass

### 9.3 Edge Function Structure

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { /* ... */ };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 1. Auth
  const authHeader = req.headers.get('Authorization');
  // ... verify JWT, check admin role ...

  // 2. Route
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/admin-api/, '');

  // 3. Dispatch
  if (path === '/stats' && req.method === 'GET') return handleStats(serviceClient);
  if (path === '/users' && req.method === 'GET') return handleUsers(serviceClient, url);
  if (path.match(/^\/users\/[^/]+$/) && req.method === 'GET') return handleUserDetail(serviceClient, path);
  if (path.match(/^\/users\/[^/]+$/) && req.method === 'PATCH') return handleUserUpdate(serviceClient, path, req);
  if (path === '/billing' && req.method === 'GET') return handleBilling(serviceClient, url);
  if (path === '/revenue' && req.method === 'GET') return handleRevenue(serviceClient);

  return jsonResponse({ error: 'Not found' }, 404);
});
```

---

## 10. Revenue SQL Function

Since Supabase JS client doesn't support `GROUP BY`, create a database function:

```sql
-- Create DB function for monthly revenue aggregation
CREATE OR REPLACE FUNCTION admin_monthly_revenue()
RETURNS TABLE(month TEXT, revenue BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COALESCE(SUM(amount), 0)::BIGINT as revenue
  FROM fre_billing_history
  WHERE status = 'success'
    AND created_at >= NOW() - INTERVAL '12 months'
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY month;
$$;
```

This can be called via `serviceClient.rpc('admin_monthly_revenue')`.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-13 | Initial draft | AI |
