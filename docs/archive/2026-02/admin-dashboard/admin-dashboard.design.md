# Admin Dashboard - Design Document

> Plan 참조: `docs/01-plan/features/admin-dashboard.plan.md`

## 현황 분석 (Design 기준)

### 기존 인프라
| 항목 | 상태 | 비고 |
|------|------|------|
| RBAC (role 시스템) | **없음** | UserProfile에 role 필드 없음 |
| Admin 라우트 | **없음** | router.tsx에 /app/admin 없음 |
| Admin 데이터 쿼리 | **없음** | supabaseData.ts는 RLS 기반 사용자 전용 |
| ProtectedRoute | guest 허용 | role 체크 없음 (line 18: `return <Outlet />`) |
| Sidebar 메뉴 | 8개 항목 | admin 항목 없음 |
| 차트 라이브러리 | Recharts 3 | 재사용 가능 |
| i18n | ko/en | 확장 가능 |

### 데이터 소스 (Supabase 테이블)
| 테이블 | 어드민 활용 |
|--------|-----------|
| `fre_user_profiles` | 사용자 목록, 플랜 분포, KPI |
| `fre_billing_history` | 결제 내역, 매출 집계 |
| `fre_projects` | 프로젝트 수 통계 |
| `fre_analysis_snapshots` | 분석 사용량 통계 |
| `fre_notifications` | 알림 통계 |
| `auth.users` | 이메일, last_sign_in_at (Edge Function에서만 접근) |

---

## AD-1: Admin Role 시스템

### 1.1 DB 마이그레이션 (Supabase Dashboard)

```sql
-- role 컬럼 추가
ALTER TABLE fre_user_profiles
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 최초 admin 사용자 설정 (본인 계정 ID로 교체)
-- UPDATE fre_user_profiles SET role = 'admin' WHERE id = 'YOUR_USER_UUID';
```

### 1.2 types/index.ts 수정

```typescript
// line 23 부근, PlanType 아래 추가
export type UserRole = 'user' | 'admin';
```

UserProfile 인터페이스에 추가 (line 27-44):
```typescript
export interface UserProfile {
  id: string;
  role: UserRole;           // NEW
  plan: PlanType;
  // ... 나머지 기존 필드
}
```

### 1.3 lib/planManager.ts 수정

UserProfile 인터페이스에 동일하게 `role` 필드 추가 (line 9-26):
```typescript
export interface UserProfile {
  id: string;
  role: 'user' | 'admin';  // NEW
  plan: PlanType;
  // ... 나머지 기존 필드
}
```

`isAdmin` 유틸리티 함수 추가:
```typescript
export function isAdmin(profile: UserProfile): boolean {
  return profile.role === 'admin';
}
```

### 1.4 components/AdminRoute.tsx (신규 파일)

```typescript
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRoute: React.FC = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !userProfile || userProfile.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
};
```

### 1.5 router.tsx 수정

lazy import 추가:
```typescript
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminBilling = lazy(() => import('./pages/AdminBilling').then(m => ({ default: m.AdminBilling })));
```

`/app` children에 admin 라우트 추가 (line 71 이후):
```typescript
{
  path: 'admin',
  element: <AdminRoute />,
  children: [
    { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense> },
    { path: 'users', element: <Suspense fallback={<PageLoader />}><AdminUsers /></Suspense> },
    { path: 'billing', element: <Suspense fallback={<PageLoader />}><AdminBilling /></Suspense> },
  ],
},
```

### 1.6 Sidebar.tsx 수정

admin 전용 메뉴 항목 조건부 추가:
```typescript
// useAuth에서 userProfile 추가 destructure
const { user, userProfile, signOut } = useAuth();

// menuItems 정의 후, admin 항목 조건부 추가
const adminItems: MenuItem[] = userProfile?.role === 'admin' ? [
  { path: '/app/admin', icon: Settings, labelKey: 'nav.admin' },
] : [];
```

nav 렌더링에서 `[...menuItems, ...adminItems]` 사용.

구분선 추가 (admin 메뉴 전):
```tsx
{adminItems.length > 0 && (
  <div className="w-6 h-px bg-white/[0.06] my-1" />
)}
```

---

## AD-2: Admin Edge Function

### 2.1 Supabase Edge Function: `admin-api`

**파일**: `supabase/functions/admin-api/index.ts`

**인증 흐름**:
1. Authorization 헤더에서 JWT 추출
2. `supabase.auth.getUser(token)`으로 user_id 확인
3. `fre_user_profiles`에서 role 확인 → admin이 아니면 403

**엔드포인트 라우팅** (URL path parameter):
```typescript
const url = new URL(req.url);
const path = url.pathname.replace('/admin-api', '');

switch (true) {
  case path === '/stats' && req.method === 'GET':
    return handleStats(supabaseAdmin);
  case path === '/users' && req.method === 'GET':
    return handleUsers(supabaseAdmin, url);
  case path.match(/^\/users\/[\w-]+$/) && req.method === 'GET':
    return handleUserDetail(supabaseAdmin, path);
  case path.match(/^\/users\/[\w-]+$/) && req.method === 'PATCH':
    return handleUserUpdate(supabaseAdmin, path, req);
  case path === '/billing' && req.method === 'GET':
    return handleBilling(supabaseAdmin, url);
  case path === '/revenue' && req.method === 'GET':
    return handleRevenue(supabaseAdmin);
  default:
    return new Response('Not Found', { status: 404 });
}
```

### 2.2 엔드포인트 상세

**GET /stats** — KPI 집계:
```typescript
async function handleStats(sb: SupabaseClient) {
  const { count: totalUsers } = await sb.from('fre_user_profiles').select('*', { count: 'exact', head: true });
  const { count: proUsers } = await sb.from('fre_user_profiles').select('*', { count: 'exact', head: true }).neq('plan', 'free');
  const today = new Date().toISOString().slice(0, 10);
  const { count: todaySignups } = await sb.from('fre_user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', today);

  // MRR 계산
  const { data: proProfiles } = await sb.from('fre_user_profiles').select('plan, billing_cycle').neq('plan', 'free').eq('subscription_status', 'active');
  let mrr = 0;
  for (const p of proProfiles || []) {
    if (p.plan === 'pro') mrr += p.billing_cycle === 'annual' ? 278400 / 12 : 29000;
    if (p.plan === 'team') mrr += p.billing_cycle === 'annual' ? 758400 / 12 : 79000;
  }

  return Response.json({ totalUsers, proUsers, todaySignups, mrr: Math.round(mrr) });
}
```

**GET /users** — 사용자 목록 (페이지네이션):
```typescript
async function handleUsers(sb: SupabaseClient, url: URL) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  const search = url.searchParams.get('search') || '';
  const planFilter = url.searchParams.get('plan') || '';

  // auth.users에서 이메일/last_sign_in 조회 (admin API)
  const { data: { users: authUsers }, error } = await sb.auth.admin.listUsers({ page, perPage: limit });

  // fre_user_profiles 조인
  const userIds = authUsers.map(u => u.id);
  let query = sb.from('fre_user_profiles').select('*').in('id', userIds);
  if (planFilter) query = query.eq('plan', planFilter);
  const { data: profiles } = await query;

  // 병합
  const merged = authUsers.map(u => ({
    id: u.id,
    email: u.email,
    last_sign_in_at: u.last_sign_in_at,
    created_at: u.created_at,
    ...profiles?.find(p => p.id === u.id),
  }));

  // 검색 필터 (서버사이드)
  const filtered = search
    ? merged.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()))
    : merged;

  return Response.json({ users: filtered, page, total: authUsers.length });
}
```

**GET /users/:id** — 사용자 상세:
```typescript
async function handleUserDetail(sb: SupabaseClient, path: string) {
  const userId = path.split('/').pop()!;
  const { data: { user } } = await sb.auth.admin.getUserById(userId);
  const { data: profile } = await sb.from('fre_user_profiles').select('*').eq('id', userId).single();
  const { data: billing } = await sb.from('fre_billing_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
  const { data: projects } = await sb.from('fre_projects').select('id, name, created_at').eq('user_id', userId);

  return Response.json({
    user: { id: user?.id, email: user?.email, last_sign_in_at: user?.last_sign_in_at, created_at: user?.created_at },
    profile,
    billing: billing || [],
    projects: projects || [],
  });
}
```

**PATCH /users/:id** — 사용자 수정:
```typescript
async function handleUserUpdate(sb: SupabaseClient, path: string, req: Request) {
  const userId = path.split('/').pop()!;
  const body = await req.json();
  // 허용 필드만 업데이트
  const allowed = ['plan', 'role', 'csv_row_limit'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  const { error } = await sb.from('fre_user_profiles').update(updates).eq('id', userId);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
```

**GET /billing** — 전체 결제 내역:
```typescript
async function handleBilling(sb: SupabaseClient, url: URL) {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status') || '';

  let query = sb.from('fre_billing_history').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (status) query = query.eq('status', status);

  const { data, count } = await query;
  return Response.json({ records: data || [], page, total: count || 0 });
}
```

**GET /revenue** — 월별 매출:
```typescript
async function handleRevenue(sb: SupabaseClient) {
  // 최근 12개월 결제 성공 데이터
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data } = await sb.from('fre_billing_history')
    .select('amount, created_at')
    .eq('status', 'success')
    .gte('created_at', twelveMonthsAgo.toISOString())
    .order('created_at', { ascending: true });

  // 월별 그룹핑
  const monthly: Record<string, number> = {};
  for (const r of data || []) {
    const month = r.created_at.slice(0, 7); // YYYY-MM
    monthly[month] = (monthly[month] || 0) + r.amount;
  }

  const result = Object.entries(monthly).map(([month, revenue]) => ({ month, revenue }));
  return Response.json({ revenue: result });
}
```

### 2.3 프론트엔드 API 클라이언트

**파일**: `lib/adminApi.ts` (신규)

```typescript
import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!supabase || !SUPABASE_URL) throw new Error('Supabase not configured');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-api${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Admin API error: ${res.status}`);
  }
  return res.json();
}

// 타입 정의
export interface AdminStats {
  totalUsers: number;
  proUsers: number;
  todaySignups: number;
  mrr: number;
}

export interface AdminUser {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  role: 'user' | 'admin';
  plan: string;
  subscription_status: string;
  billing_cycle: string;
}

export interface AdminUserDetail {
  user: { id: string; email: string; last_sign_in_at: string | null; created_at: string };
  profile: Record<string, unknown>;
  billing: Array<Record<string, unknown>>;
  projects: Array<{ id: string; name: string; created_at: string }>;
}

export interface AdminBillingRecord {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  created_at: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

// API 함수
export const fetchAdminStats = () => adminFetch<AdminStats>('/stats');
export const fetchAdminUsers = (page: number, search?: string, plan?: string) => {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set('search', search);
  if (plan) params.set('plan', plan);
  return adminFetch<{ users: AdminUser[]; page: number; total: number }>(`/users?${params}`);
};
export const fetchAdminUserDetail = (id: string) => adminFetch<AdminUserDetail>(`/users/${id}`);
export const updateAdminUser = (id: string, updates: Record<string, unknown>) =>
  adminFetch<{ success: boolean }>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
export const fetchAdminBilling = (page: number, status?: string) => {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set('status', status);
  return adminFetch<{ records: AdminBillingRecord[]; page: number; total: number }>(`/billing?${params}`);
};
export const fetchAdminRevenue = () => adminFetch<{ revenue: RevenueData[] }>('/revenue');
```

---

## AD-3: Admin Dashboard 페이지

### 3.1 pages/AdminDashboard.tsx (신규)

**레이아웃**:
```
┌─────────────────────────────────────────────────┐
│ Admin Dashboard                    [Users] [Billing] │
├─────────┬─────────┬─────────┬──────────────────┤
│ 총사용자 │ Pro구독자│ MRR     │ 오늘가입          │
│  1,234  │   89    │₩2.5M   │    3             │
├─────────┴─────────┼─────────┴──────────────────┤
│ 월별 가입자 추이    │ 플랜별 분포                   │
│ [Bar Chart 6mo]   │ [Pie Chart]                  │
└───────────────────┴────────────────────────────┘
```

**구현**:
```tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CreditCard, TrendingUp, UserPlus } from '../components/Icons';
import { fetchAdminStats, fetchAdminRevenue } from '../lib/adminApi';
import type { AdminStats, RevenueData } from '../lib/adminApi';
import { CHART_COLORS } from '../lib/constants';

export function AdminDashboard() { ... }
```

**KPI 카드**: 4개 (Users/TrendingUp/CreditCard/UserPlus 아이콘)
- 로딩: `animate-pulse` 스켈레톤
- 에러: toast 표시, 값 = '-'

**월별 가입자 차트**: Recharts BarChart (CHART_COLORS[0])
- X축: YYYY-MM, Y축: 명수

**플랜 분포 차트**: Recharts PieChart (3 slices: Free/Pro/Team)
- CHART_COLORS 활용, 범례 표시

### 3.2 Admin 서브 내비게이션

AdminDashboard 상단에 탭 내비게이션:
```tsx
const adminTabs = [
  { path: '/app/admin', labelKey: 'admin.dashboard' },
  { path: '/app/admin/users', labelKey: 'admin.users' },
  { path: '/app/admin/billing', labelKey: 'admin.billing' },
];
```

공통 컴포넌트로 추출: `components/AdminNav.tsx` (신규)

---

## AD-4: 사용자 관리 페이지

### 4.1 pages/AdminUsers.tsx (신규)

**레이아웃**:
```
┌─────────────────────────────────────────────────┐
│ Admin > Users                                    │
├──────────────────────────────────────────────────│
│ [🔍 Search email...]  [Plan: All ▾]             │
├──────────────────────────────────────────────────│
│ Email          │ Plan  │ Status  │ Joined  │ ⋮  │
│ user@mail.com  │ Pro   │ Active  │ 2026-01 │ ⋮  │
│ test@mail.com  │ Free  │ None    │ 2026-02 │ ⋮  │
├──────────────────────────────────────────────────│
│              ← 1 2 3 ... →                      │
└──────────────────────────────────────────────────┘
```

**기능**:
- 이메일 검색 (debounce 300ms)
- 플랜 필터 (all / free / pro / team)
- 테이블 행 클릭 → UserDetailModal 열기
- 페이지네이션 (20명씩, prev/next 버튼)

### 4.2 components/UserDetailModal.tsx (신규)

**레이아웃**:
```
┌──────────────────────────────────┐
│ user@example.com           [X]  │
├──────────────────────────────────│
│ Profile                         │
│  Plan: [Pro ▾]  Role: [user ▾] │
│  Status: Active                 │
│  Billing: Monthly               │
│  Joined: 2026-01-15             │
│  Last Login: 2026-02-12         │
│                    [Save]       │
├──────────────────────────────────│
│ Billing History (최근 10건)      │
│  2026-02-01 ₩29,000 Success    │
│  2026-01-01 ₩29,000 Success    │
├──────────────────────────────────│
│ Projects (3)                    │
│  My Project    2026-01-20       │
│  Test Data     2026-02-05       │
└──────────────────────────────────┘
```

**수정 가능 필드**: plan, role (select dropdown)
- Save 버튼 → `updateAdminUser(id, { plan, role })` 호출
- 성공 → toast + 목록 새로고침

---

## AD-5: 매출/결제 페이지

### 5.1 pages/AdminBilling.tsx (신규)

**레이아웃**:
```
┌─────────────────────────────────────────────────┐
│ Admin > Billing                                  │
├──────────────────────────────────────────────────│
│ 월별 매출 추이 (최근 12개월)                       │
│ [Bar Chart ₩]                                    │
├──────────────────────────────────────────────────│
│ [Status: All ▾]                                  │
│ Date       │ User        │ Amount │ Status │ ID  │
│ 2026-02-01 │ a@mail.com  │ ₩29K  │ ✅     │ ... │
│ 2026-01-01 │ b@mail.com  │ ₩29K  │ ❌     │ ... │
├──────────────────────────────────────────────────│
│              ← 1 2 3 ... →                      │
└──────────────────────────────────────────────────┘
```

**기능**:
- 월별 매출 Bar chart (fetchAdminRevenue)
- 결제 내역 테이블 (fetchAdminBilling, 20건씩)
- 상태 필터 (all / success / failed / refunded)
- 페이지네이션

---

## i18n 키 추가

### locales/ko/common.json
```json
{
  "nav": {
    "admin": "관리자"
  },
  "admin": {
    "dashboard": "대시보드",
    "users": "사용자 관리",
    "billing": "매출/결제",
    "totalUsers": "총 사용자",
    "proUsers": "Pro 구독자",
    "mrr": "월 반복 매출",
    "todaySignups": "오늘 가입",
    "monthlySignups": "월별 가입자 추이",
    "planDistribution": "플랜별 분포",
    "searchEmail": "이메일 검색...",
    "allPlans": "전체 플랜",
    "userDetail": "사용자 상세",
    "profile": "프로필",
    "billingHistory": "결제 내역",
    "projects": "프로젝트",
    "save": "저장",
    "saveSuccess": "사용자 정보가 수정되었습니다",
    "saveFailed": "수정에 실패했습니다",
    "role": "역할",
    "plan": "플랜",
    "status": "상태",
    "joined": "가입일",
    "lastLogin": "마지막 로그인",
    "monthlyRevenue": "월별 매출 추이",
    "allStatus": "전체 상태",
    "noData": "데이터가 없습니다",
    "loading": "로딩 중...",
    "prev": "이전",
    "next": "다음",
    "page": "{{page}} 페이지"
  }
}
```

### locales/en/common.json
```json
{
  "nav": {
    "admin": "Admin"
  },
  "admin": {
    "dashboard": "Dashboard",
    "users": "Users",
    "billing": "Billing",
    "totalUsers": "Total Users",
    "proUsers": "Pro Subscribers",
    "mrr": "MRR",
    "todaySignups": "Today's Signups",
    "monthlySignups": "Monthly Signups",
    "planDistribution": "Plan Distribution",
    "searchEmail": "Search email...",
    "allPlans": "All Plans",
    "userDetail": "User Detail",
    "profile": "Profile",
    "billingHistory": "Billing History",
    "projects": "Projects",
    "save": "Save",
    "saveSuccess": "User updated successfully",
    "saveFailed": "Failed to update user",
    "role": "Role",
    "plan": "Plan",
    "status": "Status",
    "joined": "Joined",
    "lastLogin": "Last Login",
    "monthlyRevenue": "Monthly Revenue",
    "allStatus": "All Status",
    "noData": "No data",
    "loading": "Loading...",
    "prev": "Prev",
    "next": "Next",
    "page": "Page {{page}}"
  }
}
```

---

## Icons.tsx 수정

lucide-react에서 `UserPlus` 추가 import + export:
```typescript
import { ..., UserPlus } from 'lucide-react';
export { ..., UserPlus };
```

(`Settings` 아이콘은 이미 export됨 — line 65)

---

## 파일 변경 요약

### 수정 파일 (기존)
| 파일 | 변경 내용 | AD |
|------|----------|-----|
| `types/index.ts` | UserRole 타입 + UserProfile.role 필드 | AD-1 |
| `lib/planManager.ts` | UserProfile.role + isAdmin() 함수 | AD-1 |
| `router.tsx` | AdminRoute + admin 하위 라우트 3개 | AD-1 |
| `components/Sidebar.tsx` | admin 조건부 메뉴 | AD-1 |
| `components/Icons.tsx` | UserPlus import/export | AD-3 |
| `locales/ko/common.json` | admin.* i18n 키 ~30개 | AD-3~5 |
| `locales/en/common.json` | admin.* i18n 키 ~30개 | AD-3~5 |

### 신규 파일
| 파일 | 내용 | AD |
|------|------|-----|
| `components/AdminRoute.tsx` | admin role 가드 컴포넌트 | AD-1 |
| `lib/adminApi.ts` | Admin Edge Function API 클라이언트 | AD-2 |
| `pages/AdminDashboard.tsx` | KPI + 차트 대시보드 | AD-3 |
| `components/AdminNav.tsx` | admin 서브 내비게이션 탭 | AD-3 |
| `pages/AdminUsers.tsx` | 사용자 목록/검색/필터 | AD-4 |
| `components/UserDetailModal.tsx` | 사용자 상세 + 수정 모달 | AD-4 |
| `pages/AdminBilling.tsx` | 매출 차트 + 결제 내역 | AD-5 |

### Edge Function (외부 배포)
| 파일 | 내용 | AD |
|------|------|-----|
| `supabase/functions/admin-api/index.ts` | 6개 엔드포인트 | AD-2 |

### DB 마이그레이션 (Supabase Dashboard)
| SQL | 내용 | AD |
|-----|------|-----|
| ALTER TABLE fre_user_profiles ADD COLUMN role | admin 역할 | AD-1 |

---

## 구현 순서 (Do Phase 가이드)

```
Step 1: AD-1 Admin Role 시스템
  ├── types/index.ts (UserRole, UserProfile.role)
  ├── lib/planManager.ts (UserProfile.role, isAdmin)
  ├── components/AdminRoute.tsx (신규)
  ├── router.tsx (admin 라우트)
  ├── components/Sidebar.tsx (admin 메뉴)
  └── components/Icons.tsx (UserPlus)

Step 2: AD-2 API 클라이언트 (Edge Function은 외부 배포)
  └── lib/adminApi.ts (신규)

Step 3: AD-3 Admin Dashboard
  ├── components/AdminNav.tsx (신규)
  └── pages/AdminDashboard.tsx (신규)

Step 4: AD-4 사용자 관리
  ├── components/UserDetailModal.tsx (신규)
  └── pages/AdminUsers.tsx (신규)

Step 5: AD-5 매출/결제
  └── pages/AdminBilling.tsx (신규)

Step 6: i18n
  ├── locales/ko/common.json
  └── locales/en/common.json
```

## 테스트 계획

- 기존 310개 테스트 유지
- AdminRoute 컴포넌트 테스트 (admin/non-admin/guest 리다이렉트)
- adminApi 함수 단위 테스트 (mock fetch)
- Sidebar admin 메뉴 조건부 렌더링 테스트
