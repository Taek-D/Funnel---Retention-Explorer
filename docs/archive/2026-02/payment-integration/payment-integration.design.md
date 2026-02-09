# Payment Integration Design Document

> **Summary**: TossPayments 결제 연동 + Free/Pro 기능 게이팅 설계
>
> **Project**: FRE Analytics
> **Date**: 2026-02-10
> **Status**: Draft
> **Planning Doc**: [payment-integration.plan.md](../../01-plan/features/payment-integration.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. TossPayments SDK v2 기반 빌링 인증 + 서버사이드 빌링키 발급/결제 구현
2. `fre_user_profiles` 테이블로 유저별 플랜(free/pro) 및 결제 상태 관리
3. AuthContext 확장으로 앱 전역에서 플랜 정보 접근 가능
4. CSV 업로드 행 수 제한, AI 호출 일일 제한 적용
5. 기존 98개 테스트 유지, 빌드 성공

### 1.2 Design Principles

- **서버사이드 결제 처리**: 모든 결제 로직은 Supabase Edge Function에서 실행. 클라이언트는 UI + SDK만 담당
- **기존 패턴 일관성**: AuthContext/hooks/components 기존 구조 유지하며 확장
- **점진적 적용**: Phase 2에서는 CSV/AI 제한만 적용, 나머지는 Phase 4에서

---

## 2. Architecture

### 2.1 Component Diagram

```
┌───────────────────────────────────────────────────────────┐
│                      Client (Browser)                      │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ AuthContext  │  │ usePlanGate  │  │ UpgradeModal     │ │
│  │ +userProfile │  │ +isPro       │  │ +TossPayments    │ │
│  │             │  │ +canUseAI    │  │  SDK v2          │ │
│  └──────┬──────┘  └──────┬───────┘  └───────┬──────────┘ │
│         │                │                    │            │
│  ┌──────┴────────────────┴────────────────────┴──────────┐│
│  │              TossPayments SDK v2 (CDN)                 ││
│  │  requestBillingAuth() → successUrl redirect            ││
│  └────────────────────────┬───────────────────────────────┘│
└───────────────────────────┼────────────────────────────────┘
                            │ authKey + JWT
                            ▼
┌───────────────────────────────────────────────────────────┐
│                 Supabase Edge Functions                     │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐│
│  │ issue-billing │  │ toss-webhook │  │ ai-proxy         ││
│  │ (빌링키+결제) │  │ (상태변경)   │  │ (+AI 호출 검증)  ││
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘│
└─────────┼──────────────────┼──────────────────────────────┘
          │                  │
          ▼                  ▼
┌───────────────────────────────────────────────────────────┐
│  TossPayments API                                          │
│  /v1/billing/authorizations/issue  (빌링키 발급)           │
│  /v1/billing/{billingKey}          (결제 승인)             │
└───────────────────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────────────────┐
│  Supabase PostgreSQL                                       │
│  fre_user_profiles (plan, billing_key, ai_calls_today)    │
└───────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**결제 흐름**:
```
User clicks "Pro 업그레이드"
  → UpgradeModal opens
  → TossPayments SDK requestBillingAuth()
  → User completes card registration
  → Redirect to /app/billing/success?authKey=...&customerKey=...
  → BillingSuccessPage calls issue-billing Edge Function
  → Edge Function: billingKey 발급 → 첫 결제 승인 → DB 업데이트
  → AuthContext refreshes userProfile
  → Pro features enabled
```

**기능 제한 흐름**:
```
User tries CSV upload / AI call
  → usePlanGate checks userProfile limits
  → If exceeded: show UpgradeModal
  → If allowed: proceed normally
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `planManager.ts` | `supabase.ts` | DB에서 프로필 조회/수정 |
| `AuthContext.tsx` | `planManager.ts` | 프로필 자동 로드 |
| `usePlanGate.ts` | `AuthContext` | 플랜 정보 접근 |
| `UpgradeModal.tsx` | `usePlanGate`, TossPayments SDK | 결제 UI |
| `BillingSuccessPage.tsx` | `AuthContext`, `supabase.ts` | 콜백 처리 |
| `issue-billing` Edge Function | TossPayments API, Supabase | 서버사이드 결제 |
| `toss-webhook` Edge Function | TossPayments Webhook | 상태 동기화 |

---

## 3. Data Model

### 3.1 TypeScript Types (`types/index.ts`에 추가)

```typescript
// ===== Plan & Subscription =====

export type PlanType = 'free' | 'pro';
export type SubscriptionStatus = 'none' | 'active' | 'cancelled' | 'past_due';

export interface UserProfile {
  id: string;
  plan: PlanType;
  plan_started_at: string | null;
  toss_customer_key: string | null;
  toss_billing_key: string | null;
  subscription_status: SubscriptionStatus;
  next_billing_date: string | null;
  ai_calls_today: number;
  ai_calls_reset_at: string;
  csv_row_limit: number;
  created_at: string;
  updated_at: string;
}
```

### 3.2 DB Schema (`fre_user_profiles`)

```sql
CREATE TABLE fre_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  plan_started_at TIMESTAMPTZ,
  toss_customer_key TEXT,
  toss_billing_key TEXT,
  subscription_status TEXT DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'active', 'cancelled', 'past_due')),
  next_billing_date DATE,
  ai_calls_today INT NOT NULL DEFAULT 0,
  ai_calls_reset_at DATE NOT NULL DEFAULT CURRENT_DATE,
  csv_row_limit INT NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.3 Entity Relationships

```
[auth.users] 1 ──── 1 [fre_user_profiles]
                         │
                         ├── plan (free/pro)
                         ├── toss_billing_key (카드 결제용)
                         └── ai_calls_today (일일 제한)
```

---

## 4. Implementation Specifications

### 4.1 PI-1: DB Migration

**SQL 파일**: Supabase Dashboard 또는 CLI migration

**RLS 정책**:
- `own_profile_select`: `auth.uid() = id` (본인 조회)
- `own_profile_update`: `auth.uid() = id` (본인 수정)
- `service_role_all`: `auth.role() = 'service_role'` (Edge Function용)

**Trigger**: `on_auth_user_created` → `handle_new_user()` → INSERT with `gen_random_uuid()::text` as `toss_customer_key`

### 4.2 PI-2: `lib/planManager.ts`

```typescript
// Exports:
export type PlanType = 'free' | 'pro';
export type SubscriptionStatus = 'none' | 'active' | 'cancelled' | 'past_due';
export interface UserProfile { ... }  // 위 3.1 참조

export const PLAN_LIMITS = {
  free: { csvRows: 10_000, aiCallsPerDay: 3, projects: 1, savedAnalyses: 5 },
  pro:  { csvRows: 500_000, aiCallsPerDay: 50, projects: -1, savedAnalyses: -1 },
} as const;

export async function fetchUserProfile(userId: string): Promise<UserProfile | null>
// supabase.from('fre_user_profiles').select('*').eq('id', userId).single()

export function canUseAI(profile: UserProfile): boolean
// ai_calls_today < PLAN_LIMITS[profile.plan].aiCallsPerDay
// + ai_calls_reset_at 날짜 리셋 체크

export async function incrementAIUsage(userId: string): Promise<void>
// supabase.from('fre_user_profiles').update({ ai_calls_today: ai_calls_today + 1 })

export function getCSVRowLimit(profile: UserProfile): number
// PLAN_LIMITS[profile.plan].csvRows

export function isPro(profile: UserProfile): boolean
// profile.plan === 'pro'
```

### 4.3 PI-3: `context/AuthContext.tsx` 확장

**현재** `AuthContextValue`:
```typescript
{ user, session, loading, signIn, signUp, signOut }
```

**변경** `AuthContextValue`:
```typescript
{
  user, session, loading, signIn, signUp, signOut,
  userProfile: UserProfile | null,          // 추가
  refreshProfile: () => Promise<void>,      // 추가
}
```

**동작**:
- `onAuthStateChange`에서 로그인 시 `fetchUserProfile(user.id)` 호출
- 프로필 없으면 upsert (기존 유저 대응)
- `refreshProfile()`은 결제 완료 후 수동 갱신용

### 4.4 PI-4: `hooks/usePlanGate.ts`

```typescript
export function usePlanGate(): {
  isPro: boolean;
  canUseAI: boolean;
  csvRowLimit: number;
  aiCallsRemaining: number;
  showUpgradeModal: boolean;
  openUpgradeModal: (reason: string) => void;
  closeUpgradeModal: () => void;
  upgradeReason: string;
}
```

- `useAuth()`에서 `userProfile` 가져옴
- 프로필 null이면 free 기본값 반환
- `openUpgradeModal`은 reason ('csv_limit' | 'ai_limit') 전달

### 4.5 PI-5: `supabase/functions/issue-billing/index.ts`

**Deno Edge Function** (기존 `ai-proxy` 패턴 참고):

```typescript
serve(async (req) => {
  // 1. CORS preflight
  // 2. JWT 인증 (ai-proxy와 동일한 패턴)
  // 3. req.body에서 authKey 추출
  // 4. fre_user_profiles에서 toss_customer_key 조회
  // 5. TossPayments /v1/billing/authorizations/issue 호출 → billingKey
  // 6. TossPayments /v1/billing/{billingKey} 호출 → 첫 결제 (₩29,000)
  // 7. fre_user_profiles 업데이트:
  //    plan='pro', toss_billing_key, subscription_status='active',
  //    plan_started_at=now(), csv_row_limit=500000,
  //    next_billing_date=30일 후
  // 8. 성공 응답
});
```

**인증 헤더**: `Basic ${btoa(TOSS_SECRET_KEY + ':')}`
**환경변수**: `TOSS_SECRET_KEY` (Supabase Secrets)

### 4.6 PI-6: `supabase/functions/toss-webhook/index.ts`

```typescript
serve(async (req) => {
  // 1. CORS preflight
  // 2. 요청 본문 파싱
  // 3. 이벤트 타입 분기:
  //    - PAYMENT_STATUS_CHANGED: 결제 상태 변경 처리
  //    - BILLING_DELETED: plan='free', billing_key=null
  // 4. fre_user_profiles 업데이트 (service_role 클라이언트 사용)
  // 5. 200 OK 응답 (필수)
});
```

**Supabase 클라이언트**: `createClient(URL, SERVICE_ROLE_KEY)` (service_role로 RLS 우회)

### 4.7 PI-7: `components/UpgradeModal.tsx`

```typescript
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;  // 'csv_limit' | 'ai_limit' | 'general'
}

export const UpgradeModal: React.FC<UpgradeModalProps>
```

**UI 구성**:
- 제한 도달 이유 표시 (CSV 행 초과 / AI 일일 한도 초과)
- Free vs Pro 비교 테이블
- "Pro로 업그레이드" 버튼 → `requestBillingAuth()` 호출
- 기존 Modal 컴포넌트 패턴 활용 (bg-surface, border-white/[0.06])

**TossPayments SDK 호출**:
```typescript
const tossPayments = TossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY);
await tossPayments.requestBillingAuth({
  method: 'CARD',
  successUrl: `${window.location.origin}/app/billing/success`,
  failUrl: `${window.location.origin}/app/billing/fail`,
  customerKey: userProfile.toss_customer_key,
  customerEmail: user?.email,
});
```

### 4.8 PI-8: `components/PlanBadge.tsx`

```typescript
export const PlanBadge: React.FC
```

- `useAuth()`에서 `userProfile.plan` 읽기
- Free: 작은 배지 + "업그레이드" 텍스트 링크
- Pro: accent 색상 배지
- 사이드바 하단 (`Sidebar.tsx`의 `mt-auto` 영역)에 삽입

### 4.9 PI-9: CSV 업로드 제한 (`hooks/useCSVUpload.ts`)

**변경 위치**: `handleFileUpload` 함수 내, `parseCSV(file)` 이후

```typescript
// 기존 코드:
const result = await parseCSV(file);

// 추가:
const rowLimit = planGate.csvRowLimit;
if (result.data.length > rowLimit) {
  planGate.openUpgradeModal('csv_limit');
  dispatch({ type: 'SET_PROCESSING', ... });
  return;
}
```

- `usePlanGate()` 훅 import 필요
- 행 초과 시 파싱 결과를 버리고 UpgradeModal 표시
- 기존 흐름(dispatch, toast)은 그대로 유지

### 4.10 PI-10: AI 인사이트 제한 (`hooks/useAIInsights.ts`)

**변경 위치**: `generateSummary`와 `askQuestion` 함수 시작 부분

```typescript
// 추가 (generateSummary/askQuestion 맨 앞):
if (!planGate.canUseAI) {
  planGate.openUpgradeModal('ai_limit');
  return;
}
```

**서버사이드 검증** (`ai-proxy/index.ts` 수정):
- `user.id`로 `fre_user_profiles` 조회
- `ai_calls_today >= limit` 이면 429 응답
- 정상이면 `ai_calls_today += 1` 후 Gemini API 호출

### 4.11 PI-11: Pricing 업데이트

**LandingPage.tsx `pricingPlans` 배열 수정**:
- Pro: `price: '₩39,000'` → `'₩29,000'`, `cta: '출시 예정'` → `'Pro 시작하기'`
- Free: `features` 배열에 '10,000행' 명시
- Pro disabled 버튼 → `/pricing` 링크 또는 직접 결제 트리거

**PricingPage.tsx** (신규):
- 독립 `/pricing` 페이지
- Free/Pro 상세 비교 테이블
- FAQ 섹션
- CTA 버튼 → 로그인 유저는 결제 흐름, 미로그인은 `/signup`

### 4.12 PI-12: Sidebar PlanBadge 통합

**Sidebar.tsx `mt-auto` 영역에 PlanBadge 삽입**:
- 현재: `LogOut` 버튼 + 유저 이니셜
- 변경: `PlanBadge` + `LogOut` 버튼 + 유저 이니셜

### 4.13 BillingSuccessPage.tsx (신규)

```typescript
export const BillingSuccessPage: React.FC
```

- URL params에서 `authKey`, `customerKey` 추출
- `issue-billing` Edge Function 호출
- 성공: Pro 활성화 메시지 + `/app/dashboard`로 리다이렉트
- 실패: 에러 메시지 + 재시도 안내
- 로딩 상태 UI (결제 처리 중...)

### 4.14 Router 변경 (`router.tsx`)

**추가 라우트**:
```typescript
// 공개 라우트
{ path: '/pricing', element: <Suspense><PricingPage /></Suspense> }

// /app 하위 라우트 (ProtectedRoute 내)
{ path: 'billing/success', element: <Suspense><BillingSuccessPage /></Suspense> }
```

### 4.15 index.html 변경

**TossPayments SDK v2 스크립트 추가**:
```html
<script src="https://js.tosspayments.com/v2/standard"></script>
```

`<head>` 내 tailwind CDN 아래에 추가.

---

## 5. Security Considerations

- [x] TossPayments Secret Key는 서버사이드만 (Supabase Secrets, 클라이언트 노출 X)
- [x] Client Key는 `VITE_TOSS_CLIENT_KEY`로 프론트에서 사용 (공개 가능한 키)
- [x] 모든 Edge Function은 JWT 인증 후 처리
- [x] `fre_user_profiles` RLS로 본인 프로필만 접근
- [x] Webhook은 service_role 클라이언트로 DB 업데이트
- [x] AI 호출 제한은 클라이언트 + 서버 이중 검증

---

## 6. Check Items (Gap Analysis 기준)

### PI-1: DB Schema (8 items)

| ID | Check Item |
|----|-----------|
| PI-1.1 | `fre_user_profiles` 테이블이 `plan.md`의 스키마와 일치 (12개 컬럼) |
| PI-1.2 | `plan` 컬럼에 CHECK 제약 (`'free'`, `'pro'`) |
| PI-1.3 | `subscription_status` 컬럼에 CHECK 제약 (`'none'`, `'active'`, `'cancelled'`, `'past_due'`) |
| PI-1.4 | RLS 활성화 (`ENABLE ROW LEVEL SECURITY`) |
| PI-1.5 | `own_profile_select` 정책: `auth.uid() = id` |
| PI-1.6 | `own_profile_update` 정책: `auth.uid() = id` |
| PI-1.7 | `service_role_all` 정책: `auth.role() = 'service_role'` |
| PI-1.8 | `on_auth_user_created` 트리거: `handle_new_user()` + `gen_random_uuid()` as `toss_customer_key` |

### PI-2: planManager.ts (10 items)

| ID | Check Item |
|----|-----------|
| PI-2.1 | `lib/planManager.ts` 파일 존재 |
| PI-2.2 | `PlanType` 타입 export (`'free' \| 'pro'`) |
| PI-2.3 | `SubscriptionStatus` 타입 export |
| PI-2.4 | `UserProfile` 인터페이스 export (12개 필드) |
| PI-2.5 | `PLAN_LIMITS` 상수 export (free/pro 객체) |
| PI-2.6 | `PLAN_LIMITS.free.csvRows === 10_000` |
| PI-2.7 | `PLAN_LIMITS.free.aiCallsPerDay === 3` |
| PI-2.8 | `fetchUserProfile(userId)` 함수 export |
| PI-2.9 | `canUseAI(profile)` 함수 export (날짜 리셋 로직 포함) |
| PI-2.10 | `isPro(profile)` 함수 export |

### PI-3: AuthContext 확장 (6 items)

| ID | Check Item |
|----|-----------|
| PI-3.1 | `AuthContextValue`에 `userProfile: UserProfile \| null` 필드 |
| PI-3.2 | `AuthContextValue`에 `refreshProfile: () => Promise<void>` 필드 |
| PI-3.3 | `import` from `../lib/planManager` (fetchUserProfile) |
| PI-3.4 | `onAuthStateChange`에서 로그인 시 `fetchUserProfile` 호출 |
| PI-3.5 | 프로필 없을 때 upsert 처리 (기존 유저 대응) |
| PI-3.6 | `<AuthContext.Provider value={}>`에 `userProfile`, `refreshProfile` 포함 |

### PI-4: usePlanGate Hook (6 items)

| ID | Check Item |
|----|-----------|
| PI-4.1 | `hooks/usePlanGate.ts` 파일 존재 |
| PI-4.2 | `usePlanGate()` 함수 export |
| PI-4.3 | 반환값에 `isPro`, `canUseAI`, `csvRowLimit` 포함 |
| PI-4.4 | 반환값에 `showUpgradeModal`, `openUpgradeModal`, `closeUpgradeModal` 포함 |
| PI-4.5 | `useAuth()`에서 `userProfile` 접근 |
| PI-4.6 | 프로필 null 시 free 기본값 반환 |

### PI-5: issue-billing Edge Function (10 items)

| ID | Check Item |
|----|-----------|
| PI-5.1 | `supabase/functions/issue-billing/index.ts` 파일 존재 |
| PI-5.2 | CORS preflight (`OPTIONS`) 처리 |
| PI-5.3 | JWT 인증 (`supabase.auth.getUser()`) |
| PI-5.4 | `TOSS_SECRET_KEY`를 `Deno.env.get()` |
| PI-5.5 | Basic 인증 헤더 생성 (`btoa(secretKey + ':')`) |
| PI-5.6 | `/v1/billing/authorizations/issue` API 호출 (authKey + customerKey) |
| PI-5.7 | `/v1/billing/{billingKey}` API 호출 (결제 승인, amount: 29000) |
| PI-5.8 | orderId에 고유값 포함 (`FRE-PRO-` prefix) |
| PI-5.9 | DB 업데이트: `plan='pro'`, `toss_billing_key`, `subscription_status='active'` |
| PI-5.10 | 에러 시 적절한 한국어 에러 메시지 반환 |

### PI-6: toss-webhook Edge Function (5 items)

| ID | Check Item |
|----|-----------|
| PI-6.1 | `supabase/functions/toss-webhook/index.ts` 파일 존재 |
| PI-6.2 | `serve()` 패턴 (Deno Edge Function) |
| PI-6.3 | service_role Supabase 클라이언트 사용 (`SUPABASE_SERVICE_ROLE_KEY`) |
| PI-6.4 | `BILLING_DELETED` 이벤트: `plan='free'`, `toss_billing_key=null` |
| PI-6.5 | 200 OK 응답 반환 |

### PI-7: UpgradeModal (8 items)

| ID | Check Item |
|----|-----------|
| PI-7.1 | `components/UpgradeModal.tsx` 파일 존재 |
| PI-7.2 | `UpgradeModal` named export |
| PI-7.3 | props: `isOpen`, `onClose`, `reason` |
| PI-7.4 | Free vs Pro 비교 표시 (가격 ₩29,000) |
| PI-7.5 | "업그레이드" 버튼이 `requestBillingAuth()` 호출 |
| PI-7.6 | `successUrl`이 `/app/billing/success` |
| PI-7.7 | `customerKey`로 `userProfile.toss_customer_key` 사용 |
| PI-7.8 | 다크 테마 스타일 (`bg-surface`, `border-white/[0.06]`) |

### PI-8: PlanBadge (4 items)

| ID | Check Item |
|----|-----------|
| PI-8.1 | `components/PlanBadge.tsx` 파일 존재 |
| PI-8.2 | `PlanBadge` named export |
| PI-8.3 | `useAuth()`에서 `userProfile.plan` 접근 |
| PI-8.4 | Free/Pro 구분 표시 |

### PI-9: CSV Upload Limit (4 items)

| ID | Check Item |
|----|-----------|
| PI-9.1 | `useCSVUpload.ts`에서 `usePlanGate` import |
| PI-9.2 | `handleFileUpload`에서 `result.data.length > csvRowLimit` 체크 |
| PI-9.3 | 초과 시 `openUpgradeModal('csv_limit')` 호출 |
| PI-9.4 | 초과 시 `return` (데이터 dispatch 안 함) |

### PI-10: AI Insights Limit (5 items)

| ID | Check Item |
|----|-----------|
| PI-10.1 | `useAIInsights.ts`에서 플랜 게이팅 로직 존재 |
| PI-10.2 | `generateSummary`에서 `canUseAI` 체크 |
| PI-10.3 | `askQuestion`에서 `canUseAI` 체크 |
| PI-10.4 | 제한 도달 시 `openUpgradeModal('ai_limit')` |
| PI-10.5 | `ai-proxy/index.ts`에서 서버사이드 `ai_calls_today` 검증 |

### PI-11: Pricing Update (6 items)

| ID | Check Item |
|----|-----------|
| PI-11.1 | `pages/PricingPage.tsx` 파일 존재 |
| PI-11.2 | `PricingPage` named export |
| PI-11.3 | LandingPage의 Pro `price`가 `₩29,000` |
| PI-11.4 | LandingPage의 Pro `cta`가 `'출시 예정'`이 아님 (실제 CTA) |
| PI-11.5 | Free 플랜에 행 수 제한 명시 (`10,000행`) |
| PI-11.6 | router.tsx에 `/pricing` 라우트 존재 |

### PI-12: Sidebar Integration (2 items)

| ID | Check Item |
|----|-----------|
| PI-12.1 | `Sidebar.tsx`에서 `PlanBadge` import 및 렌더링 |
| PI-12.2 | PlanBadge가 `mt-auto` 영역(하단)에 위치 |

### RT: Routing, Build, SDK (10 items)

| ID | Check Item |
|----|-----------|
| RT-1 | `/pricing` 라우트 in router.tsx |
| RT-2 | `/app/billing/success` 라우트 in router.tsx |
| RT-3 | `BillingSuccessPage` React.lazy 적용 |
| RT-4 | `PricingPage` React.lazy 적용 |
| RT-5 | `index.html`에 TossPayments SDK v2 스크립트 (`js.tosspayments.com/v2/standard`) |
| RT-6 | `vite build` 성공 (exit code 0) |
| RT-7 | 500KB 이하 chunk 경고 없음 (또는 기존 수준 유지) |
| RT-8 | 기존 테스트 전체 통과 (98/98) |
| RT-9 | `types/index.ts`에 `PlanType`, `UserProfile` 타입 존재 |
| RT-10 | `VITE_TOSS_CLIENT_KEY` 환경변수 참조 (코드 내) |

---

## 7. Check Items Summary

| Category | Items |
|----------|:-----:|
| PI-1 (DB Schema) | 8 |
| PI-2 (planManager) | 10 |
| PI-3 (AuthContext) | 6 |
| PI-4 (usePlanGate) | 6 |
| PI-5 (issue-billing) | 10 |
| PI-6 (toss-webhook) | 5 |
| PI-7 (UpgradeModal) | 8 |
| PI-8 (PlanBadge) | 4 |
| PI-9 (CSV Limit) | 4 |
| PI-10 (AI Limit) | 5 |
| PI-11 (Pricing) | 6 |
| PI-12 (Sidebar) | 2 |
| RT (Routing/Build/SDK) | 10 |
| **Total** | **84** |

---

## 8. Implementation Order

```
 1. PI-1:  DB Migration (SQL 실행)
 2. PI-2:  lib/planManager.ts 생성
 3. PI-3:  context/AuthContext.tsx 수정
 4. PI-4:  hooks/usePlanGate.ts 생성
 5. PI-5:  supabase/functions/issue-billing/index.ts 생성
 6. PI-6:  supabase/functions/toss-webhook/index.ts 생성
 7. PI-7:  components/UpgradeModal.tsx 생성
 8. PI-8:  components/PlanBadge.tsx 생성
 9. PI-9:  hooks/useCSVUpload.ts 수정 (행 수 제한)
10. PI-10a: hooks/useAIInsights.ts 수정 (클라이언트 제한)
11. PI-10b: supabase/functions/ai-proxy/index.ts 수정 (서버 제한)
12. PI-11a: pages/PricingPage.tsx 생성
13. PI-11b: pages/LandingPage.tsx 수정 (가격표 업데이트)
14. PI-12:  components/Sidebar.tsx 수정 (PlanBadge 통합)
15. RT-a:  pages/BillingSuccessPage.tsx 생성
16. RT-b:  router.tsx 수정 (새 라우트 추가)
17. RT-c:  index.html 수정 (TossPayments SDK 스크립트)
18. RT-d:  types/index.ts 수정 (타입 추가)
19. Build: vite build 검증
20. Test:  vitest run 검증
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-02-10 | Initial draft — TossPayments 기반 설계 |
