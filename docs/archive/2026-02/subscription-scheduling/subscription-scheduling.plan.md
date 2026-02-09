# Plan: Subscription Scheduling (수익화 로드맵 Phase 3)

> **Feature**: subscription-scheduling
> **Level**: Dynamic
> **Created**: 2026-02-10
> **Status**: Plan
> **Reference**: Phase 2 (payment-integration) 완료, 수익화 점수 70/100

---

## 1. Overview

Phase 2에서 TossPayments 빌링키 발급 + 첫 결제까지 구현했다. 그러나 TossPayments는 자체 구독 스케줄링을 제공하지 않으므로, **월간 자동결제 스케줄링**, **구독 관리 UI**, **결제 실패 재시도**, **Webhook 보안 강화**를 직접 구현해야 한다.

### 목표 점수
- **Before**: 70/100
- **After**: 80/100 (+10)

### 핵심 기술
- **Supabase pg_cron + pg_net**: PostgreSQL 내장 cron 스케줄러로 매일 만기 구독을 찾아 Edge Function 호출
- **TossPayments Billing API**: `/v1/billing/{billingKey}` — 저장된 빌링키로 반복 결제 승인
- **Supabase Vault**: 시크릿 키 안전 저장

---

## 2. Problem Statement

### 2-1. 월간 자동결제 미구현

**현재 상태**: `issue-billing` Edge Function이 첫 결제만 처리. `next_billing_date`를 DB에 저장하지만, 해당 날짜에 자동으로 결제를 실행하는 스케줄러가 없음. 30일 후 Pro 유저의 결제가 갱신되지 않는다.

### 2-2. 구독 취소 UI 없음

**현재 상태**: `toss-webhook`이 `BILLING_DELETED` 이벤트를 처리하지만, 유저가 직접 구독을 취소할 수 있는 UI가 없음. 현재는 TossPayments 대시보드에서만 취소 가능.

### 2-3. 결제 실패 시 재시도 없음

**현재 상태**: `toss-webhook`이 `PAYMENT_STATUS_CHANGED`(`CANCELED`) 이벤트를 `past_due`로 처리하지만, 재시도 로직이 없음. 카드 한도 초과/만료 시 즉시 서비스 중단.

### 2-4. Webhook 보안 부재

**현재 상태**: `toss-webhook`에 IP 화이트리스트나 시크릿 검증이 없음. 아무나 POST 요청을 보내면 유저 플랜을 변경할 수 있는 보안 취약점.

---

## 3. Scope

### In Scope (구현 대상)

| ID | Task | Priority | 영향 |
|----|------|----------|------|
| SS-1 | `supabase/functions/process-billing/index.ts` — 만기 구독 결제 실행 | Critical | 신규 Edge Function |
| SS-2 | pg_cron job: 매일 자정(KST) `process-billing` 호출 | Critical | SQL migration |
| SS-3 | `supabase/functions/cancel-subscription/index.ts` — 구독 취소 | High | 신규 Edge Function |
| SS-4 | `pages/SubscriptionPage.tsx` — 구독 관리 UI | High | 신규 페이지 |
| SS-5 | `components/SubscriptionStatus.tsx` — 구독 상태 카드 | Medium | 신규 컴포넌트 |
| SS-6 | 결제 실패 재시도 로직 (3회, 1/3/7일 간격) | High | SS-1에 통합 |
| SS-7 | `toss-webhook` 보안 강화 (Webhook Secret 검증) | High | 수정 |
| SS-8 | `fre_billing_history` 테이블 (결제 내역) | Medium | SQL migration |
| SS-9 | `components/BillingHistory.tsx` — 결제 내역 UI | Medium | 신규 컴포넌트 |
| SS-10 | `fre_user_profiles` 스키마 확장 (retry_count, grace_period_end) | Medium | SQL migration |
| SS-11 | Sidebar + Router 업데이트 | Low | 수정 |

### Out of Scope

- 연간 결제 할인 (Phase 4)
- Team 플랜 / 다중 사용자 (Phase 4)
- 프로모션 코드 / 쿠폰 (Phase 5)
- 이메일 알림 (결제 성공/실패/만기 예정 — Phase 5)
- 결제 수단 변경 UI (Phase 4)

---

## 4. Technical Approach

### 4.1 자동결제 스케줄링 아키텍처

```
[Supabase pg_cron] ──── 매일 00:05 KST ────→ [pg_net HTTP POST]
                                                    │
                                                    ▼
                                          [process-billing Edge Function]
                                                    │
                                    ┌───────────────┼───────────────┐
                                    ▼               ▼               ▼
                              [쿼리: 만기 구독]  [TossPayments API]  [DB 업데이트]
                              next_billing_date  /v1/billing/{key}   next_billing_date
                              <= today           amount: 29000       += 30일
                              status: 'active'                       billing_history 기록
```

### 4.2 pg_cron + pg_net 설정

```sql
-- 1. 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Vault에 Edge Function URL + service_role key 저장
SELECT vault.create_secret(
  'process_billing_url',
  'https://yidyxlwrongecctifiis.supabase.co/functions/v1/process-billing'
);
SELECT vault.create_secret(
  'service_role_key',
  '<SUPABASE_SERVICE_ROLE_KEY>'
);

-- 3. Cron job 등록 (매일 00:05 KST = 15:05 UTC)
SELECT cron.schedule(
  'daily-billing',
  '5 15 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'process_billing_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 4.3 process-billing Edge Function

```typescript
// 1. service_role 인증 확인 (cron job에서만 호출 가능)
// 2. SELECT * FROM fre_user_profiles
//    WHERE subscription_status = 'active'
//    AND next_billing_date <= CURRENT_DATE
//    AND toss_billing_key IS NOT NULL
// 3. 각 유저에 대해:
//    a. TossPayments /v1/billing/{billingKey} API 호출
//    b. 성공 → next_billing_date += 30일, billing_history INSERT
//    c. 실패 → retry_count += 1
//       - retry_count < 3 → next_billing_date를 재시도 간격으로 설정 (1/3/7일)
//       - retry_count >= 3 → subscription_status = 'past_due', grace_period_end 설정
// 4. 처리 결과 로그
```

### 4.4 결제 실패 재시도 전략

```
시도 1: 만기일 (D+0) → 실패
시도 2: D+1 (1일 후) → 실패
시도 3: D+4 (3일 후) → 실패
시도 4: D+11 (7일 후) → 실패
────────────────────────────────────
Grace Period: D+11부터 7일간 (D+18까지)
- 이 기간: subscription_status = 'past_due'
- Pro 기능 유지하되 "결제 실패" 배너 표시
- Grace Period 종료 후: plan = 'free' 다운그레이드
```

### 4.5 구독 취소 흐름

```
[유저: "구독 취소" 클릭]
    ↓
[확인 모달: "다음 결제일까지 Pro 유지, 이후 Free 전환"]
    ↓
[cancel-subscription Edge Function]
    ├─ TossPayments /v1/billing/{billingKey} DELETE (빌링키 삭제)
    └─ fre_user_profiles: subscription_status = 'cancelled'
       (plan은 next_billing_date까지 'pro' 유지)
    ↓
[pg_cron: next_billing_date 도래 시 결제 건너뜀 (status != 'active')]
    ↓
[Grace period 후 plan = 'free' 다운그레이드]
```

### 4.6 Webhook 보안 강화

```typescript
// TossPayments Webhook Secret 검증
// 개발자센터 > 웹훅 설정에서 Webhook Secret 발급
// 요청 헤더의 'TossPayments-Signature' 검증

const webhookSecret = Deno.env.get('TOSS_WEBHOOK_SECRET');
const signature = req.headers.get('TossPayments-Signature');
// HMAC-SHA256 검증 로직
```

---

## 5. DB 스키마 변경

### 5.1 `fre_user_profiles` 확장

```sql
ALTER TABLE fre_user_profiles
  ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grace_period_end DATE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
```

### 5.2 `fre_billing_history` 신규 테이블

```sql
CREATE TABLE fre_billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  amount INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'refunded')),
  toss_payment_key TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fre_billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_history_select ON fre_billing_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY service_role_all ON fre_billing_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_billing_history_user ON fre_billing_history(user_id);
CREATE INDEX idx_billing_history_created ON fre_billing_history(created_at DESC);
```

---

## 6. Files Impact Summary

| 구분 | 파일 | 변경 유형 |
|------|------|-----------|
| 신규 | `supabase/functions/process-billing/index.ts` | 자동결제 실행 Edge Function |
| 신규 | `supabase/functions/cancel-subscription/index.ts` | 구독 취소 Edge Function |
| 신규 | `supabase/migrations/20260210_billing_scheduling.sql` | pg_cron, billing_history, profile 확장 |
| 신규 | `pages/SubscriptionPage.tsx` | 구독 관리 페이지 |
| 신규 | `components/SubscriptionStatus.tsx` | 구독 상태 카드 |
| 신규 | `components/BillingHistory.tsx` | 결제 내역 테이블 |
| 신규 | `components/PastDueBanner.tsx` | 결제 실패 경고 배너 |
| 수정 | `supabase/functions/toss-webhook/index.ts` | Webhook Secret 검증 추가 |
| 수정 | `lib/planManager.ts` | cancelSubscription, fetchBillingHistory 함수 추가 |
| 수정 | `types/index.ts` | BillingRecord, SubscriptionPageProps 타입 추가 |
| 수정 | `components/Sidebar.tsx` | 구독 관리 메뉴 항목 추가 |
| 수정 | `router.tsx` | /app/subscription 라우트 추가 |
| 수정 | `components/AppShell.tsx` | PastDueBanner 렌더링 |

**신규 7개, 수정 6개 = 총 13개 파일**

---

## 7. Implementation Order

```
SS-10 (DB 스키마 확장) ──────────── [Critical, 선행 작업]
SS-8  (billing_history 테이블) ──── [Critical, 선행 작업]
    ↓
SS-1  (process-billing Edge Fn) ── [Critical, SS-10 의존]
SS-2  (pg_cron job 등록) ────────── [Critical, SS-1 의존]
    ↓
SS-6  (재시도 로직) ──────────────── [High, SS-1에 통합]
SS-7  (Webhook 보안) ─────────────── [High, 독립]
    ↓
SS-3  (cancel-subscription) ──────── [High, 독립]
SS-4  (SubscriptionPage) ──────────── [High, SS-3 의존]
SS-5  (SubscriptionStatus) ────────── [Medium, SS-4 내부]
SS-9  (BillingHistory) ────────────── [Medium, SS-8 의존]
    ↓
SS-11 (Sidebar + Router) ──────────── [Low, SS-4 의존]
```

---

## 8. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| pg_cron job 실패 (서버 점검 등) | 만기 구독 결제 누락 | pg_cron은 이전 실행 기록을 `cron.job_run_details`에 저장 → 모니터링 가능. 다음 실행 시 누적 처리 |
| TossPayments API 일시 장애 | 결제 실패 | 재시도 전략 (1/3/7일) + grace period로 유저 영향 최소화 |
| 동시 결제 처리 시 race condition | 이중 결제 | `orderId`에 날짜 포함 (`FRE-RENEW-{userId}-{YYYYMMDD}`), TossPayments가 동일 orderId 거부 |
| pg_cron이 Supabase Free 플랜에서 미지원 | 스케줄링 불가 | Supabase Free 플랜에서도 pg_cron 사용 가능 (확인 완료) |
| Webhook Secret 변경 시 기존 연동 중단 | 이벤트 처리 실패 | Vault에 저장, 변경 시 migration으로 업데이트 |
| Grace period 중 유저가 카드 변경 원할 때 | 결제 불가 | Phase 4에서 결제 수단 변경 UI 구현 예정 |

---

## 9. Acceptance Criteria

- [ ] pg_cron job이 매일 실행되어 만기 구독을 찾아 결제 처리
- [ ] 결제 성공 시 `next_billing_date`가 30일 연장
- [ ] 결제 실패 시 1/3/7일 간격으로 3회 재시도
- [ ] 3회 실패 후 grace period (7일) 진입, `past_due` 상태
- [ ] Grace period 종료 후 `plan='free'` 자동 다운그레이드
- [ ] 유저가 `/app/subscription` 페이지에서 구독 취소 가능
- [ ] 구독 취소 시 `next_billing_date`까지 Pro 기능 유지
- [ ] Webhook Secret 검증으로 위조 요청 차단
- [ ] 결제 내역 테이블에 성공/실패 기록 저장
- [ ] 결제 내역 UI에서 과거 결제 조회 가능
- [ ] `past_due` 상태에서 앱 상단에 경고 배너 표시
- [ ] 기존 테스트 98/98 전체 통과
- [ ] 빌드 성공

---

## 10. Dependencies

| 의존성 | 상태 | 비고 |
|--------|------|------|
| Phase 2 (payment-integration) | 완료 | billingKey, fre_user_profiles, Edge Functions |
| pg_cron extension | 활성화 필요 | Supabase Dashboard > Database > Extensions |
| pg_net extension | 활성화 필요 | Supabase Dashboard > Database > Extensions |
| Supabase Vault | 활성화 필요 | 시크릿 키 저장용 |
| `TOSS_SECRET_KEY` | Supabase Secrets에 저장됨 | Phase 2에서 설정 |
| `TOSS_WEBHOOK_SECRET` | 설정 필요 | TossPayments 개발자센터에서 발급 |
| `fre_user_profiles` 테이블 | 생성됨 | Phase 2 migration |

---

## 11. TossPayments 반복결제 API 참조

### 빌링키로 결제 승인

```
POST /v1/billing/{billingKey}
Authorization: Basic {base64(secretKey + ':')}
Content-Type: application/json

{
  "customerKey": "고객 고유 키",
  "amount": 29000,
  "orderId": "FRE-RENEW-{userId}-{YYYYMMDD}",
  "orderName": "FRE Analytics Pro 월간 구독 갱신"
}
```

**중요**: TossPayments는 자체 스케줄링을 제공하지 않음. 빌링키 저장 후, 직접 스케줄러(pg_cron)로 원하는 주기에 결제 API를 호출해야 함.

### 빌링키 삭제 (구독 취소 시)

```
DELETE /v1/billing/{billingKey}
Authorization: Basic {base64(secretKey + ':')}
```

빌링키를 삭제하면 해당 빌링키로 더 이상 결제할 수 없음. 구독 취소 시 빌링키를 즉시 삭제하지 않고, `next_billing_date`까지 보유한 뒤 만료 시 삭제하는 방식 권장.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-02-10 | Initial plan — pg_cron 기반 구독 스케줄링 |
