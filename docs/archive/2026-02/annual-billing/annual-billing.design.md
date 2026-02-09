# Annual Billing Design Document

> **Summary**: 연간 결제 옵션 (20% 할인), 결제 수단 변경 UI, 월간↔연간 전환 로직 (일할 계산)
>
> **Project**: Funnel & Retention Explorer (FRE Analytics)
> **Author**: Claude Code (PDCA)
> **Date**: 2026-02-10
> **Status**: Draft
> **Planning Doc**: [annual-billing.plan.md](../../01-plan/features/annual-billing.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 연간 결제 옵션 추가로 ARPU 증가 + Churn Rate 감소
- 기존 월간 구독 흐름을 유지하면서 billing_cycle 분기 추가
- 결제 수단 변경으로 카드 만료/변경 시 무중단 구독 유지
- 월간→연간 전환 시 일할 계산(proration)으로 공정한 과금

### 1.2 Design Principles

- **하위 호환성**: billing_cycle DEFAULT='monthly'로 기존 유저 무영향
- **서버 측 금액 결정**: 클라이언트에서 금액을 보내지 않고, billing_cycle만 전달. 서버에서 BILLING_PRICES 참조
- **최소 변경**: PlanType은 'free' | 'pro' 유지. billing_cycle을 별도 컬럼으로 분리

---

## 2. Architecture

### 2.1 결제 흐름 (신규 + 기존 수정)

```
[신규 구독]
PricingPage/UpgradeModal (billingCycle 선택)
    ↓
TossPayments.requestBillingAuth (method: 'CARD')
    ↓
BillingSuccessPage → issue-billing(authKey, billingCycle)
    ├─ billingKey 발급
    ├─ 첫 결제: BILLING_PRICES[billingCycle]
    └─ DB: plan='pro', billing_cycle, next_billing_date += interval

[자동 갱신]
pg_cron → process-billing
    ├─ amount = BILLING_PRICES[profile.billing_cycle]
    └─ next_billing_date += BILLING_INTERVALS[profile.billing_cycle]

[결제 수단 변경]
SubscriptionPage "결제 수단 변경" 버튼
    ↓
TossPayments.requestBillingAuth → authKey
    ↓
/app/billing/success?authKey=...&mode=change
    ↓
change-billing-key(authKey)
    ├─ 새 billingKey 발급
    ├─ 이전 billingKey DELETE
    └─ DB: toss_billing_key = 새 billingKey (나머지 유지)

[월간→연간 전환]
SubscriptionPage "연간 전환" 버튼
    ↓
switch-plan(accessToken, targetCycle='annual')
    ├─ remainingDays 계산
    ├─ credit = (remainingDays / 30) × 29,000
    ├─ chargeAmount = max(0, 278,400 - credit)
    ├─ TossPayments 즉시 결제
    └─ DB: billing_cycle='annual', next_billing_date = today + 365

[연간→월간 전환]
SubscriptionPage "월간 전환" 버튼
    ↓
switch-plan(accessToken, targetCycle='monthly')
    └─ DB: billing_cycle='monthly' (next_billing_date 유지, 다음 갱신부터 적용)
```

### 2.2 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| issue-billing | BILLING_PRICES constant | 금액 결정 |
| process-billing | profile.billing_cycle | 갱신 금액/주기 |
| change-billing-key | TossPayments billingAuth API | 새 billingKey 발급 |
| switch-plan | TossPayments billing API + proration calc | 차액 결제 |
| PricingPage | billingCycle state | 토글 UI |
| UpgradeModal | billingCycle prop | 선택 전달 |
| BillingSuccessPage | searchParams.mode | 신규 vs 변경 분기 |

---

## 3. Data Model

### 3.1 fre_user_profiles 확장

```sql
ALTER TABLE fre_user_profiles
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual'));
```

### 3.2 TypeScript 타입 변경

```typescript
// types/index.ts
export type BillingCycle = 'monthly' | 'annual';

export interface UserProfile {
  // ... existing fields ...
  billing_cycle: BillingCycle;  // NEW
}
```

```typescript
// lib/planManager.ts
export type BillingCycle = 'monthly' | 'annual';

export const BILLING_PRICES = {
  monthly: 29_000,
  annual: 278_400,
} as const;

export const BILLING_INTERVALS = {
  monthly: 30,
  annual: 365,
} as const;

export interface UserProfile {
  // ... existing fields ...
  billing_cycle: BillingCycle;  // NEW
}
```

---

## 4. API Specification

### 4.1 issue-billing 수정

**변경**: Body에 `billingCycle` 파라미터 추가

**Request Body:**
```json
{
  "authKey": "string",
  "billingCycle": "monthly" | "annual"  // NEW (default: "monthly")
}
```

**변경 로직:**
- `billingCycle`이 없으면 `'monthly'` 기본값
- `billingCycle` 유효성 검증: `['monthly', 'annual']`에 포함되지 않으면 400
- 결제 금액: `BILLING_PRICES[billingCycle]` (29,000 or 278,400)
- orderName: `'FRE Analytics Pro ${billingCycle === 'annual' ? '연간' : '월간'} 구독'`
- next_billing_date: `today + BILLING_INTERVALS[billingCycle]` (30 or 365)
- DB UPDATE에 `billing_cycle` 필드 추가

**Response (기존과 동일 + billing_cycle):**
```json
{
  "success": true,
  "plan": "pro",
  "orderId": "string",
  "nextBillingDate": "YYYY-MM-DD",
  "billingCycle": "monthly" | "annual"
}
```

### 4.2 process-billing 수정

**변경**: 금액/주기를 `profile.billing_cycle` 기반으로 분기

**변경 로직:**
- `BILLING_AMOUNT` 상수 제거 → `BILLING_PRICES[profile.billing_cycle]`
- 갱신 주기: `BILLING_INTERVALS[profile.billing_cycle]` (30 or 365)
- orderName: `'FRE Analytics Pro ${profile.billing_cycle === 'annual' ? '연간' : '월간'} 구독 갱신'`
- billing_history INSERT의 amount도 동적

### 4.3 change-billing-key (신규)

**POST** `/functions/v1/change-billing-key`

**Auth**: JWT (supabase.auth.getUser)

**Request Body:**
```json
{
  "authKey": "string"
}
```

**로직:**
1. JWT 인증 → user
2. authKey로 TossPayments `/v1/billing/authorizations/issue` 호출 → 새 billingKey
3. 이전 billingKey가 있으면 TossPayments DELETE `/v1/billing/{oldBillingKey}`
4. DB UPDATE: `toss_billing_key = newBillingKey` (다른 필드 변경 없음)

**Response (200):**
```json
{
  "success": true,
  "message": "결제 수단이 변경되었습니다."
}
```

**Error Responses:**
- 401: 인증 실패
- 400: authKey 누락
- 500: 빌링키 발급 실패 / DB 업데이트 실패

### 4.4 switch-plan (신규)

**POST** `/functions/v1/switch-plan`

**Auth**: JWT (supabase.auth.getUser)

**Request Body:**
```json
{
  "targetCycle": "monthly" | "annual"
}
```

**로직 (월간→연간):**
1. JWT 인증 → user
2. profile.billing_cycle === targetCycle이면 400 ("이미 해당 주기입니다.")
3. profile.subscription_status !== 'active'이면 400
4. remainingDays = daysBetween(today, next_billing_date)
5. credit = Math.round((remainingDays / 30) * 29_000)
6. chargeAmount = Math.max(0, 278_400 - credit)
7. chargeAmount > 0이면 TossPayments `/v1/billing/{billingKey}` POST (차액 결제)
   - orderId: `FRE-SWITCH-{userId.slice(0,8)}-{YYYYMMDD}`
   - orderName: `'FRE Analytics Pro 연간 전환 (차액)'`
8. billing_history INSERT (성공 or 실패)
9. DB UPDATE: `billing_cycle = 'annual'`, `next_billing_date = today + 365`

**로직 (연간→월간):**
1. JWT 인증 → user
2. 같은 검증
3. 즉시 결제 없음 (다음 갱신일부터 적용)
4. DB UPDATE: `billing_cycle = 'monthly'` (next_billing_date 유지)

**Response (200):**
```json
{
  "success": true,
  "message": "연간 구독으로 전환되었습니다.",
  "billingCycle": "annual",
  "nextBillingDate": "YYYY-MM-DD",
  "charged": 200000
}
```

**Error Responses:**
- 401: 인증 실패
- 400: 잘못된 targetCycle / 이미 해당 주기 / 비활성 구독
- 402: 차액 결제 실패

---

## 5. UI/UX Design

### 5.1 PricingPage 월간/연간 토글

```
┌──────────────────────────────────────────────────┐
│              요금제                                │
│  무료로 시작하고, 필요할 때 업그레이드하세요.        │
│                                                  │
│        [ 월간 ]  ────────  [ 연간 (20% OFF) ]    │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────────┐  │
│  │     Free         │  │  Pro   [추천]        │  │
│  │     ₩0           │  │  ₩29,000/월          │  │
│  │     영구 무료     │  │  또는                │  │
│  │                  │  │  ₩23,200/월 (연간)   │  │
│  │  [무료로 시작]   │  │  ₩278,400 연간 결제  │  │
│  │                  │  │                      │  │
│  │                  │  │  [Pro 시작하기 →]     │  │
│  │                  │  │                      │  │
│  │                  │  │  연 ₩69,600 절약     │  │
│  └──────────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────────┘
```

- 토글 기본값: `monthly`
- `annual` 선택 시: Pro 카드에 "연 ₩69,600 절약" 배지 표시
- 가격 전환 시 숫자 애니메이션 (선택)
- Pro 시작 버튼 클릭 → UpgradeModal(billingCycle) 또는 직접 requestBillingAuth

### 5.2 UpgradeModal 수정

```
┌──────────────────────────────────────────┐
│  ⚡ Pro로 업그레이드                [X]   │
├──────────────────────────────────────────┤
│                                          │
│  {reason message}                        │
│                                          │
│  ┌───────┐  ┌──────────┐                │
│  │ Free  │  │   Pro    │                │
│  │ ...   │  │   ...    │                │
│  └───────┘  └──────────┘                │
│                                          │
│  결제 주기 선택:                          │
│  ┌────────────────────────────────────┐  │
│  │  [● 월간  ₩29,000/월]            │  │
│  │  [○ 연간  ₩23,200/월 (20% 할인)] │  │
│  │       ₩278,400 연간 결제           │  │
│  └────────────────────────────────────┘  │
│                                          │
│           ₩29,000/월                     │
│                                          │
│  [          Pro 업그레이드          ]     │
└──────────────────────────────────────────┘
```

- 라디오 버튼으로 월간/연간 선택
- 선택에 따라 하단 가격 변경
- `handleUpgrade` 호출 시 `billingCycle` state를 successUrl의 query param으로 전달

### 5.3 SubscriptionPage 확장

```
┌──────────────────────────────────────────┐
│  구독 관리                               │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │  구독 상태           [활성]         ││
│  │  현재 플랜     ⚡ Pro               ││
│  │  결제 주기       월간 구독          ││
│  │  다음 결제일     2026-03-10         ││
│  │  결제 금액       ₩29,000/월         ││
│  │                                     ││
│  │  [결제 수단 변경]  [연간 전환]      ││
│  │  [구독 취소]                        ││
│  └──────────────────────────────────────┘│
│                                          │
│  ┌──────────────────────────────────────┐│
│  │  결제 내역                          ││
│  │  ...                                ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

- "결제 수단 변경" 버튼: TossPayments.requestBillingAuth → `/app/billing/success?mode=change`
- "연간 전환" / "월간 전환" 버튼: 확인 모달 → switch-plan API
- billing_cycle에 따라 버튼 텍스트 변경

### 5.4 BillingSuccessPage 분기

- `searchParams.get('mode')` 확인
  - `mode=change`: change-billing-key 호출 → "결제 수단이 변경되었습니다"
  - `mode` 없음 (기본): issue-billing 호출 (기존 흐름)
- `searchParams.get('billingCycle')` 확인 → issue-billing에 전달

---

## 6. Error Handling

### 6.1 Error Codes

| Endpoint | Code | Message | Cause |
|----------|------|---------|-------|
| issue-billing | 400 | 유효하지 않은 결제 주기입니다. | billingCycle not in ['monthly', 'annual'] |
| change-billing-key | 400 | authKey가 필요합니다. | authKey missing |
| change-billing-key | 500 | 빌링키 발급에 실패했습니다. | TossPayments API error |
| switch-plan | 400 | 이미 해당 주기입니다. | targetCycle === current billing_cycle |
| switch-plan | 400 | 활성 구독이 필요합니다. | subscription_status !== 'active' |
| switch-plan | 402 | 차액 결제에 실패했습니다. | TossPayments billing API error |

---

## 7. Security Considerations

- [x] JWT auth for change-billing-key, switch-plan (supabase.auth.getUser)
- [x] service_role auth for process-billing (pg_cron only)
- [x] Server-side billingCycle validation (never trust client amount)
- [x] billingKey DELETE only after new key confirmed
- [x] Proration calculation server-side only

---

## 8. Implementation Order

```
Phase A: 스키마 + 타입 (AB-1, AB-2)
    ↓
Phase B: Edge Functions (AB-3, AB-4, AB-5, AB-6)
    ↓
Phase C: UI (AB-7, AB-8, AB-9, AB-10, AB-11, AB-12)
    ↓
Phase D: 빌드 + 테스트 검증
```

---

## 9. Check Items

### AB-1: fre_user_profiles 스키마 확장 (5 items)

| # | Check Item |
|---|-----------|
| 1 | Migration SQL file `supabase/migrations/20260210_annual_billing.sql` exists |
| 2 | ALTER TABLE adds `billing_cycle TEXT NOT NULL DEFAULT 'monthly'` |
| 3 | CHECK constraint: `billing_cycle IN ('monthly', 'annual')` |
| 4 | `IF NOT EXISTS` for idempotent execution |
| 5 | No destructive changes to existing columns |

### AB-2: types/index.ts + planManager.ts 타입 업데이트 (8 items)

| # | Check Item |
|---|-----------|
| 6 | `types/index.ts` exports `BillingCycle = 'monthly' \| 'annual'` |
| 7 | `types/index.ts` `UserProfile` has `billing_cycle: BillingCycle` field |
| 8 | `planManager.ts` has `BillingCycle` type |
| 9 | `planManager.ts` `UserProfile` has `billing_cycle` field |
| 10 | `planManager.ts` exports `BILLING_PRICES` constant `{ monthly: 29_000, annual: 278_400 }` |
| 11 | `planManager.ts` exports `BILLING_INTERVALS` constant `{ monthly: 30, annual: 365 }` |
| 12 | Both UserProfile definitions are consistent (same fields) |
| 13 | PLAN_LIMITS unchanged (Pro features same regardless of cycle) |

### AB-3: issue-billing Edge Function 수정 (8 items)

| # | Check Item |
|---|-----------|
| 14 | Reads `billingCycle` from request body |
| 15 | Default billingCycle = 'monthly' when not provided |
| 16 | Validates billingCycle is 'monthly' or 'annual' (400 if invalid) |
| 17 | Payment amount uses `BILLING_PRICES[billingCycle]` (29,000 or 278,400) |
| 18 | next_billing_date uses `BILLING_INTERVALS[billingCycle]` (30 or 365 days) |
| 19 | DB UPDATE includes `billing_cycle` field |
| 20 | Response includes `billingCycle` field |
| 21 | orderName reflects billing cycle ("월간" or "연간") |

### AB-4: process-billing Edge Function 수정 (7 items)

| # | Check Item |
|---|-----------|
| 22 | BILLING_AMOUNT constant removed or replaced with dynamic lookup |
| 23 | Payment amount = `BILLING_PRICES[profile.billing_cycle]` or equivalent |
| 24 | Renewal interval = `BILLING_INTERVALS[profile.billing_cycle]` or equivalent (30 or 365 days) |
| 25 | orderName reflects profile.billing_cycle |
| 26 | billing_history INSERT uses dynamic amount |
| 27 | Fallback to monthly if billing_cycle is null/undefined |
| 28 | Existing retry logic unchanged (RETRY_INTERVALS, GRACE_PERIOD_DAYS) |

### AB-5: change-billing-key Edge Function (9 items)

| # | Check Item |
|---|-----------|
| 29 | File `supabase/functions/change-billing-key/index.ts` exists |
| 30 | corsHeaders + OPTIONS handling |
| 31 | JWT auth (supabase.auth.getUser) |
| 32 | authKey extracted from request body |
| 33 | TossPayments `/v1/billing/authorizations/issue` called with authKey + customerKey |
| 34 | Previous billingKey DELETE attempted (with try-catch) |
| 35 | DB UPDATE: `toss_billing_key = newBillingKey` only (no plan/cycle/date change) |
| 36 | Success response: `{ success: true, message: "결제 수단이 변경되었습니다." }` |
| 37 | Error responses: 401 (auth), 400 (authKey missing), 500 (API/DB failure) |

### AB-6: switch-plan Edge Function (12 items)

| # | Check Item |
|---|-----------|
| 38 | File `supabase/functions/switch-plan/index.ts` exists |
| 39 | corsHeaders + OPTIONS handling |
| 40 | JWT auth (supabase.auth.getUser) |
| 41 | targetCycle extracted from request body |
| 42 | Validates targetCycle !== current billing_cycle (400 if same) |
| 43 | Validates subscription_status === 'active' (400 if not) |
| 44 | Monthly→Annual: remainingDays calculated from next_billing_date |
| 45 | Monthly→Annual: credit = Math.round((remainingDays / 30) * 29_000) |
| 46 | Monthly→Annual: chargeAmount = Math.max(0, 278_400 - credit) |
| 47 | Monthly→Annual: TossPayments billing API called with chargeAmount (if > 0) |
| 48 | Monthly→Annual: DB UPDATE billing_cycle='annual', next_billing_date = today + 365 |
| 49 | Annual→Monthly: DB UPDATE billing_cycle='monthly' only (next_billing_date preserved) |

### AB-7: PricingPage 리뉴얼 (7 items)

| # | Check Item |
|---|-----------|
| 50 | billingCycle state: `useState<'monthly' \| 'annual'>('monthly')` |
| 51 | Toggle UI between monthly/annual |
| 52 | Pro card shows ₩29,000/월 (monthly) or ₩23,200/월 + ₩278,400/년 (annual) |
| 53 | "연 ₩69,600 절약" badge visible when annual selected |
| 54 | Pro start button passes billingCycle to navigation/modal |
| 55 | FAQ answer updated to mention annual option |
| 56 | Free card unchanged regardless of toggle |

### AB-8: UpgradeModal 수정 (6 items)

| # | Check Item |
|---|-----------|
| 57 | `billingCycle` state or prop |
| 58 | Radio/toggle UI for monthly vs annual selection |
| 59 | Price display changes based on billingCycle |
| 60 | handleUpgrade passes billingCycle via successUrl query param |
| 61 | Monthly shows ₩29,000/월, Annual shows ₩23,200/월 (₩278,400/년) |
| 62 | Default selection: monthly |

### AB-9: SubscriptionPage 확장 (8 items)

| # | Check Item |
|---|-----------|
| 63 | "결제 수단 변경" button visible for active subscriptions |
| 64 | "결제 수단 변경" calls TossPayments.requestBillingAuth with mode=change |
| 65 | "연간 전환" or "월간 전환" button visible based on current billing_cycle |
| 66 | Plan switch confirmation modal with proration explanation |
| 67 | switchPlan() function in planManager.ts called with accessToken + targetCycle |
| 68 | changeBillingKey() function in planManager.ts (or redirect approach) |
| 69 | After successful switch: refreshProfile() + refetch billingHistory |
| 70 | Error display for failed switch/change |

### AB-10: SubscriptionStatus 확장 (4 items)

| # | Check Item |
|---|-----------|
| 71 | "결제 주기" row showing "월간 구독" or "연간 구독" based on billing_cycle |
| 72 | "결제 금액" row shows correct amount based on billing_cycle |
| 73 | billing_cycle='monthly': "₩29,000/월", billing_cycle='annual': "₩278,400/년" |
| 74 | "결제 수단 변경" and "플랜 전환" buttons added (or in parent SubscriptionPage) |

### AB-11: BillingSuccessPage 수정 (5 items)

| # | Check Item |
|---|-----------|
| 75 | Reads `mode` from searchParams |
| 76 | `mode=change`: calls change-billing-key instead of issue-billing |
| 77 | `mode=change`: success message "결제 수단이 변경되었습니다." |
| 78 | Default mode: reads `billingCycle` from searchParams, passes to issue-billing |
| 79 | Success message reflects billing cycle ("Pro 월간/연간 업그레이드 완료") |

### AB-12: 상수 + FAQ 업데이트 (3 items)

| # | Check Item |
|---|-----------|
| 80 | PricingPage FAQ includes annual billing question/answer |
| 81 | PricingPage FAQ mentions proration for plan switching |
| 82 | comparisonFeatures array unchanged (Pro features same for both cycles) |

### Common: planManager.ts 함수 추가 (4 items)

| # | Check Item |
|---|-----------|
| 83 | `changeBillingKey(accessToken, authKey)` function exported |
| 84 | `switchPlan(accessToken, targetCycle)` function exported |
| 85 | Both functions call Supabase Edge Functions via fetch |
| 86 | Both functions return `{ success, message, ... }` format |

### Common: Build & Test (3 items)

| # | Check Item |
|---|-----------|
| 87 | Existing tests all pass |
| 88 | Vite build succeeds |
| 89 | No TypeScript type errors |

---

**Total Check Items: 89**

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-10 | Initial design — 89 check items, 12 categories | Claude Code (PDCA) |
