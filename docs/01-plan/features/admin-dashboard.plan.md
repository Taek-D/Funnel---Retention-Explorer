# Admin Dashboard Planning Document

> **Summary**: Complete admin dashboard backend (Edge Function + DB migration) to activate existing frontend
>
> **Project**: FRE Analytics
> **Version**: 1.0.0
> **Author**: AI
> **Date**: 2026-02-13
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

The admin dashboard frontend (3 pages, 7 components, API client) is fully implemented but has no backend. This feature creates the `admin-api` Edge Function and applies the `role` column migration to make the admin dashboard functional.

### 1.2 Background

- Admin pages already exist: `AdminDashboard.tsx`, `AdminUsers.tsx`, `AdminBilling.tsx`
- Route guard exists: `AdminRoute.tsx` checks `userProfile.role === 'admin'`
- API client exists: `adminApi.ts` calls `/functions/v1/admin-api/*`
- Sidebar conditionally shows admin link when `role === 'admin'`
- i18n keys exist in both ko/en (25+ admin keys)
- **Blocker**: `fre_user_profiles` has no `role` column in production DB
- **Blocker**: `admin-api` Edge Function does not exist

### 1.3 Related Documents

- Existing frontend: `pages/AdminDashboard.tsx`, `pages/AdminUsers.tsx`, `pages/AdminBilling.tsx`
- API contract: `lib/adminApi.ts`
- Route definition: `router.tsx` lines 35-37, 95-100
- Type definitions: `types/index.ts` (UserRole, UserProfile)

---

## 2. Scope

### 2.1 In Scope

- [ ] AD-01: Add `role` column to `fre_user_profiles` (DB migration)
- [ ] AD-02: Create `admin-api` Edge Function with 6 endpoints
- [ ] AD-03: Deploy Edge Function to Supabase production
- [ ] AD-04: Set initial admin user via SQL
- [ ] AD-05: Verify end-to-end flow (build + tests pass)

### 2.2 Out of Scope

- Admin audit logging (future feature)
- Admin notification system
- Bulk user operations
- Admin analytics export
- Team plan management in admin panel

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Add `role TEXT DEFAULT 'user' CHECK(role IN ('user','admin'))` to `fre_user_profiles` | High | Pending |
| FR-02 | `GET /stats` endpoint: totalUsers, proUsers, todaySignups, mrr | High | Pending |
| FR-03 | `GET /users?page&search&plan` endpoint: paginated user list with auth.users join | High | Pending |
| FR-04 | `GET /users/:id` endpoint: user detail (profile + billing history + projects) | High | Pending |
| FR-05 | `PATCH /users/:id` endpoint: update user plan and role | High | Pending |
| FR-06 | `GET /billing?page&status` endpoint: paginated billing records | High | Pending |
| FR-07 | `GET /revenue` endpoint: monthly revenue aggregation (last 12 months) | Medium | Pending |
| FR-08 | Admin role verification on all endpoints (service_role + role check) | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Security | Only admin-role users can access endpoints | Role check via JWT + profile lookup |
| Performance | Response time < 500ms for all endpoints | Manual verification |
| Data | Pagination with 20 items per page | API response validation |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] DB migration applied to production
- [ ] Edge Function deployed and responding
- [ ] All 6 API endpoints return correct data
- [ ] Admin user can access `/app/admin` pages
- [ ] Non-admin users are redirected from admin pages
- [ ] Build succeeds with no errors
- [ ] Existing tests pass (310/310)

### 4.2 Quality Criteria

- [ ] Zero lint errors
- [ ] Build succeeds
- [ ] No regression in existing tests

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `role` column migration fails | High | Low | Use ALTER TABLE with DEFAULT, no downtime |
| Admin API exposes sensitive data | High | Medium | service_role auth + role check + RLS |
| No admin user exists after migration | Medium | High | Run SET role='admin' for specific user |
| plan CHECK constraint blocks 'team' plan | Medium | Low | Already allows only 'free'/'pro', admin can update via service_role |

---

## 6. Architecture Considerations

### 6.1 Project Level

Dynamic (existing project, Supabase Edge Functions pattern)

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Edge Function pattern | Single function with path routing / Multiple functions | Single function with path routing | Frontend already calls `/admin-api/*` paths |
| Auth strategy | JWT only / JWT + role check / service_role | JWT + role check (via service_role) | User authenticates with JWT, server verifies admin role via service_role |
| User listing | RLS-based / service_role bypass | service_role bypass | Admin needs to see all users, not just own data |

### 6.3 API Endpoints Design

```
admin-api Edge Function (verify_jwt: true)
├── GET  /stats          → AdminStats
├── GET  /users          → { users[], page, total }
├── GET  /users/:id      → AdminUserDetail
├── PATCH /users/:id     → { success: boolean }
├── GET  /billing        → { records[], page, total }
└── GET  /revenue        → { revenue[] }

Auth flow:
1. Frontend sends JWT via Authorization header
2. Edge Function extracts user from JWT
3. Edge Function uses service_role to check role in fre_user_profiles
4. If role !== 'admin', return 403
5. Process request using service_role client (bypass RLS)
```

---

## 7. Convention Prerequisites

### 7.1 Existing Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] TypeScript configuration (`tsconfig.json`)
- [x] Edge Function pattern established (8 existing functions)
- [x] DB migration pattern (local SQL files)

### 7.2 Environment Variables Needed

| Variable | Purpose | Scope | Status |
|----------|---------|-------|:------:|
| `SUPABASE_URL` | Supabase endpoint | Edge Function (auto) | Exists |
| `SUPABASE_ANON_KEY` | Anonymous key | Edge Function (auto) | Exists |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Edge Function (auto) | Exists |

No new environment variables needed.

---

## 8. Implementation Order

1. **DB Migration**: Add `role` column + set initial admin
2. **Edge Function**: Create `admin-api/index.ts` with all 6 endpoints
3. **Deploy**: Deploy Edge Function to Supabase
4. **Verify**: Build check + test run + manual verification

---

## 9. Next Steps

1. [ ] Write design document (`admin-dashboard.design.md`)
2. [ ] Review and approve plan
3. [ ] Start implementation

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-13 | Initial draft | AI |
