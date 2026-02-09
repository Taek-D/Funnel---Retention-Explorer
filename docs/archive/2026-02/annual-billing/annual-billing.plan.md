# Plan: Annual Billing (수익화 로드맵 Phase 4)

> **Feature**: annual-billing
> **Level**: Dynamic
> **Created**: 2026-02-10
> **Status**: Plan
> **Reference**: Phase 3 (subscription-scheduling) 완료, 수익화 점수 80/100

---

## 1. Overview

Phase 3에서 pg_cron 기반 월간 자동결제 + 구독 관리 UI를 완성했다. Phase 4에서는 **연간 결제 옵션** (20% 할인), **결제 수단 변경 UI**, **구독 플랜 전환 로직 (월간↔연간)** 을 추가하여 ARPU를 높이고 Churn Rate을 낮춘다.

### 목표 점수
- **Before**: 80/100
- **After**: 88/100 (+8)

### 핵심 변경
- `PlanType` 확장: `'free' | 'pro'` → `'free' | 'pro_monthly' | 'pro_annual'`
- `billing_cycle` 컬럼 추가: `'monthly' | 'annual'`
- 연간 결제 금액: ₩29,000 × 12 × 0.8 = **₩278,400/년** (월 ₩23,200 환산, 20% 할인)
- TossPayments 빌링키 재사용: 기존 billingKey로 금액만 변경하여 결제

---

## 2. Problem Statement

### 2-1. 연간 결제 옵션 없음

**현재 상태**: 월간 ₩29,000만 제공. SaaS 업계 표준으로 연간 결제(15~25% 할인)를 제공하면 연간 LTV를 확보하고 Churn을 줄일 수 있다. 연간 결제 사용자는 월간 대비 **평균 30% 낮은 해지율**을 보인다.

### 2-2. 결제 수단 변경 불가

**현재 상태**: 카드 만료/변경 시 유저가 구독을 취소하고 재구독해야 함. 이는 결제 실패 → past_due → 다운그레이드의 주요 원인. 빌링키만 재발급하면 기존 구독을 유지할 수 있다.

### 2-3. 플랜 전환 (월간↔연간) 불가

**현재 상태**: 월간 구독자가 연간으로 전환하려면 취소 후 재구독해야 함. 일할 계산(proration) 없이 즉시 전환하면 사용자 경험이 나쁨.

---

## 3. Scope

### In Scope (구현 대상)

| ID | Task | Priority | 영향 |
|----|------|----------|------|
| AB-1 | `fre_user_profiles` 스키마 확장 (billing_cycle 컬럼) | Critical | SQL migration |
| AB-2 | `types/index.ts` + `planManager.ts` 타입 업데이트 | Critical | 타입 변경 |
| AB-3 | `issue-billing` Edge Function 수정 (금액 분기 + billing_cycle 저장) | Critical | 수정 |
| AB-4 | `process-billing` Edge Function 수정 (금액 분기 + 갱신 주기 분기) | Critical | 수정 |
| AB-5 | `change-billing-key` Edge Function (결제 수단 변경) | High | 신규 |
| AB-6 | `switch-plan` Edge Function (월간↔연간 전환, 일할 계산) | High | 신규 |
| AB-7 | PricingPage 리뉴얼 (월간/연간 토글 + 가격 표시) | High | 수정 |
| AB-8 | UpgradeModal 수정 (월간/연간 선택) | High | 수정 |
| AB-9 | SubscriptionPage 확장 (결제 수단 변경 + 플랜 전환 UI) | High | 수정 |
| AB-10 | SubscriptionStatus 확장 (billing_cycle 표시) | Medium | 수정 |
| AB-11 | BillingSuccessPage 수정 (연간 결제 메시지) | Low | 수정 |
| AB-12 | PLAN_LIMITS 상수 확장 + FAQ 업데이트 | Low | 수정 |

### Out of Scope

- Team 플랜 / 다중 사용자 (Phase 5)
- 프로모션 코드 / 쿠폰 (Phase 5)
- 이메일 알림 (결제 성공/실패/만기 예정 — Phase 5)
- 환불 처리 UI (TossPayments 대시보드에서 수동 처리)

---

## 4. Technical Approach

### 4.1 스키마 변경

```sql
-- fre_user_profiles 확장
ALTER TABLE fre_user_profiles
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual'));
```

### 4.2 가격 상수

```typescript
export const BILLING_PRICES = {
  monthly: 29_000,      // ₩29,000/월
  annual: 278_400,       // ₩278,400/년 (₩23,200/월 × 12, 20% 할인)
} as const;

export const BILLING_INTERVALS = {
  monthly: 30,   // 30일
  annual: 365,   // 365일
} as const;
```

### 4.3 issue-billing 수정

```
[기존 흐름]
requestBillingAuth → authKey → issue-billing → billingKey + 첫 결제(₩29,000) → plan='pro'

[수정 후]
requestBillingAuth → authKey → issue-billing(billingCycle) → billingKey + 첫 결제(금액 분기) → plan='pro', billing_cycle 저장
```

Body에 `{ authKey, billingCycle: 'monthly' | 'annual' }` 추가. 금액은 `BILLING_PRICES[billingCycle]`로 결정.

### 4.4 process-billing 수정

```
[기존]
amount: 29000, next_billing_date += 30일

[수정 후]
amount: profile.billing_cycle === 'annual' ? 278400 : 29000
next_billing_date += profile.billing_cycle === 'annual' ? 365 : 30
```

### 4.5 결제 수단 변경 흐름

```
[유저: "결제 수단 변경" 클릭]
    ↓
[TossPayments.requestBillingAuth] → authKey 발급
    ↓
[change-billing-key Edge Function]
    ├─ 새 billingKey 발급 (기존 customerKey 사용)
    ├─ 이전 billingKey DELETE (선택적)
    └─ fre_user_profiles: toss_billing_key = 새 billingKey
    ↓
[기존 구독 정보(plan, billing_cycle, next_billing_date) 유지]
```

### 4.6 월간↔연간 전환 (일할 계산)

```
[월간→연간 전환]
1. 남은 월간 일수 계산: remainingDays = next_billing_date - today
2. 월간 미사용분 크레딧: credit = (remainingDays / 30) × 29,000
3. 연간 결제액: 278,400 - credit
4. TossPayments 결제 (차액)
5. DB: billing_cycle='annual', next_billing_date = today + 365일

[연간→월간 전환]
1. 남은 연간 일수 계산: remainingDays = next_billing_date - today
2. 연간 전환은 다음 갱신일에 적용 (즉시 전환 X)
3. DB: billing_cycle='monthly' (next_billing_date 유지)
4. 다음 갱신 시 process-billing이 monthly 금액으로 처리
```

### 4.7 PricingPage 월간/연간 토글

```
[토글 상태: monthly | annual]

            Monthly          Annual (20% OFF)
Free        ₩0/영구          ₩0/영구
Pro         ₩29,000/월       ₩23,200/월 (₩278,400 연간 결제)
```

토글 전환 시 가격 애니메이션 + "연 ₩69,600 절약" 배지 표시.

---

## 5. DB 스키마 변경

### 5.1 `fre_user_profiles` 확장

```sql
ALTER TABLE fre_user_profiles
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual'));
```

기존 Pro 유저는 모두 `billing_cycle = 'monthly'` (DEFAULT).

---

## 6. Files Impact Summary

| 구분 | 파일 | 변경 유형 |
|------|------|-----------|
| 신규 | `supabase/functions/change-billing-key/index.ts` | 결제 수단 변경 Edge Function |
| 신규 | `supabase/functions/switch-plan/index.ts` | 월간↔연간 전환 Edge Function |
| 신규 | `supabase/migrations/20260210_annual_billing.sql` | billing_cycle 컬럼 추가 |
| 수정 | `supabase/functions/issue-billing/index.ts` | billingCycle 파라미터 + 금액 분기 |
| 수정 | `supabase/functions/process-billing/index.ts` | 금액/주기 분기 |
| 수정 | `types/index.ts` | BillingCycle 타입, UserProfile.billing_cycle |
| 수정 | `lib/planManager.ts` | BILLING_PRICES, UserProfile.billing_cycle, changeBillingKey(), switchPlan() |
| 수정 | `pages/PricingPage.tsx` | 월간/연간 토글 + 가격 분기 |
| 수정 | `pages/SubscriptionPage.tsx` | 결제 수단 변경 + 플랜 전환 UI |
| 수정 | `components/UpgradeModal.tsx` | billingCycle 선택 추가 |
| 수정 | `components/SubscriptionStatus.tsx` | billing_cycle 표시 |
| 수정 | `pages/BillingSuccessPage.tsx` | 연간 결제 메시지 분기 |

**신규 3개, 수정 9개 = 총 12개 파일**

---

## 7. Implementation Order

```
AB-1  (DB 스키마 확장) ──────────── [Critical, 선행 작업]
AB-2  (타입 업데이트) ───────────── [Critical, AB-1 후]
    ↓
AB-3  (issue-billing 수정) ──────── [Critical, AB-2 의존]
AB-4  (process-billing 수정) ────── [Critical, AB-2 의존]
    ↓
AB-5  (change-billing-key) ──────── [High, 독립]
AB-6  (switch-plan) ─────────────── [High, AB-2 의존]
    ↓
AB-7  (PricingPage 리뉴얼) ──────── [High, AB-2 의존]
AB-8  (UpgradeModal 수정) ────────── [High, AB-3 의존]
AB-9  (SubscriptionPage 확장) ────── [High, AB-5 + AB-6 의존]
    ↓
AB-10 (SubscriptionStatus 확장) ──── [Medium, AB-9 내부]
AB-11 (BillingSuccessPage 수정) ──── [Low, AB-3 의존]
AB-12 (상수 + FAQ 업데이트) ──────── [Low, 독립]
```

---

## 8. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 기존 월간 구독자 영향 | billing_cycle DEFAULT='monthly'로 무영향 | 스키마 변경이 하위 호환적 |
| 연간→월간 전환 시 환불 요청 | 부분 환불 복잡성 | 연간→월간은 다음 갱신일부터 적용 (즉시 환불 없음) |
| 일할 계산 오류 | 과다/과소 청구 | 남은 일수 기반 단순 계산, 최소 금액 ₩0 보장 |
| TossPayments 빌링키 교체 실패 | 결제 수단 변경 실패 | 이전 billingKey 보존 (새 키 발급 후 삭제) |
| process-billing 금액 분기 오류 | 잘못된 금액 청구 | billing_cycle DB값 참조 (하드코딩 아님) |
| PricingPage 토글 상태와 결제 불일치 | 월간 선택했는데 연간 청구 | billingCycle을 authKey와 함께 서버로 전달, 서버측 검증 |

---

## 9. Acceptance Criteria

- [ ] PricingPage에서 월간/연간 토글로 가격 전환
- [ ] 연간 결제 시 ₩278,400 청구, next_billing_date + 365일
- [ ] 월간 결제 시 기존과 동일 (₩29,000, +30일)
- [ ] UpgradeModal에서 월간/연간 선택 가능
- [ ] issue-billing이 billingCycle 파라미터에 따라 금액 분기
- [ ] process-billing이 billing_cycle에 따라 금액/주기 분기
- [ ] SubscriptionPage에서 "결제 수단 변경" 버튼 동작
- [ ] change-billing-key가 새 빌링키 발급 + DB 업데이트
- [ ] SubscriptionPage에서 "월간↔연간 전환" 버튼 동작
- [ ] switch-plan이 일할 계산 후 차액 결제 (월간→연간)
- [ ] switch-plan이 다음 갱신일부터 적용 (연간→월간)
- [ ] SubscriptionStatus에 billing_cycle 표시 ("월간 구독" / "연간 구독")
- [ ] BillingSuccessPage가 연간 결제 메시지 표시
- [ ] 기존 테스트 전체 통과
- [ ] 빌드 성공

---

## 10. Dependencies

| 의존성 | 상태 | 비고 |
|--------|------|------|
| Phase 3 (subscription-scheduling) | 완료 | process-billing, cancel-subscription, billing_history |
| TossPayments billingKey | 사용 중 | 기존 빌링키로 금액만 변경 가능 |
| fre_user_profiles 테이블 | 생성됨 | Phase 2에서 생성, Phase 3에서 확장 |
| fre_billing_history 테이블 | 생성됨 | Phase 3에서 생성 |
| pg_cron + pg_net | 설정됨 | Phase 3에서 설정 |
| UpgradeModal + TossPayments SDK | 구현됨 | Phase 2에서 구현 |

---

## 11. TossPayments 참조

### 빌링키 재발급 (결제 수단 변경)

기존 `customerKey`로 `requestBillingAuth`를 다시 호출하면 새로운 `authKey`가 발급되고, 이를 서버에서 `issue` API로 보내면 **새 billingKey**가 생성된다. 이전 billingKey는 별도로 DELETE해야 한다.

### 빌링키로 금액 변경 결제

빌링키 결제 시 `amount` 필드만 변경하면 된다. 같은 billingKey로 금액이 다른 결제가 가능하다:
- 월간: `amount: 29000`
- 연간: `amount: 278400`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-02-10 | Initial plan — 연간 결제, 결제 수단 변경, 플랜 전환 |
