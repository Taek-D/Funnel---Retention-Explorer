# Subscription Scheduling Design Document

> **Summary**: pg_cron 기반 월간 자동결제 스케줄링, 구독 관리 UI, 결제 실패 재시도, Webhook 보안 강화
>
> **Project**: FRE Analytics
> **Version**: 1.0
> **Author**: Claude
> **Date**: 2026-02-10
> **Status**: Draft
> **Planning Doc**: [subscription-scheduling.plan.md](../01-plan/features/subscription-scheduling.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- pg_cron + pg_net으로 매일 만기 구독을 찾아 TossPayments 빌링키 결제 자동 실행
- 결제 실패 시 1/3/7일 간격 재시도 + 7일 grace period 후 자동 다운그레이드
- 유저가 직접 구독을 취소할 수 있는 UI 제공 (next_billing_date까지 Pro 유지)
- Webhook Secret (HMAC-SHA256) 검증으로 위조 요청 차단
- 결제 내역 테이블 + UI로 투명한 결제 이력 제공

### 1.2 Design Principles

- **기존 패턴 준수**: Phase 2 Edge Function 구조(CORS → Auth → API → DB) 재사용
- **서버 의존 최소화**: Supabase 내장 pg_cron/pg_net만 사용, 외부 스케줄러 불필요
- **안전한 실패 처리**: 이중 결제 방지(orderId), 점진적 재시도, grace period
- **관심사 분리**: Edge Function(서버 로직) / planManager(클라이언트 유틸) / UI(컴포넌트)

---

## 2. Architecture

### 2.1 자동결제 스케줄링 아키텍처

```
[Supabase pg_cron]                                   [TossPayments API]
  매일 00:05 KST                                     /v1/billing/{key}
  (15:05 UTC)                                              ▲
       │                                                   │
       ▼                                                   │
[pg_net HTTP POST] ───→ [process-billing Edge Function] ───┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              [fre_user_profiles]  [fre_billing_history]
              next_billing_date    결제 성공/실패 기록
              retry_count
              grace_period_end
```

### 2.2 구독 취소 흐름

```
[SubscriptionPage] ──→ [cancel-subscription Edge Function]
     유저 클릭                    │
                         ┌───────┴───────┐
                         ▼               ▼
                   [fre_user_profiles]   [TossPayments]
                   status='cancelled'    빌링키는 보류
                   cancelled_at=now()    (next_billing_date까지 유지)
                         │
                         ▼
               [pg_cron: 만기 도래 시]
               빌링키 DELETE → plan='free'
```

### 2.3 Webhook 보안 흐름

```
[TossPayments 서버] ──→ [toss-webhook Edge Function]
  POST + Signature         │
                    ┌──────┴──────┐
                    ▼             ▼
             [HMAC-SHA256 검증]  [실패 → 401]
                    │
                    ▼
             [이벤트 처리]
```

### 2.4 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| process-billing | pg_cron, pg_net, TossPayments API, fre_user_profiles, fre_billing_history | 자동결제 실행 |
| cancel-subscription | Supabase Auth, fre_user_profiles | 구독 취소 처리 |
| toss-webhook | TOSS_WEBHOOK_SECRET (Vault) | Webhook 보안 검증 |
| SubscriptionPage | planManager, AuthContext, cancel-subscription | 구독 관리 UI |
| PastDueBanner | AuthContext (userProfile) | 결제 실패 경고 |

---

## 3. Data Model

### 3.1 fre_user_profiles 확장 (SS-10)

```typescript
// 기존 UserProfile에 추가되는 필드
interface UserProfile {
  // ... 기존 11개 필드 유지
  retry_count: number;            // 결제 재시도 횟수 (0~3)
  grace_period_end: string | null; // Grace period 종료일 (DATE)
  cancelled_at: string | null;    // 구독 취소 시각 (TIMESTAMPTZ)
}
```

### 3.2 fre_billing_history 신규 테이블 (SS-8)

```typescript
interface BillingRecord {
  id: string;                    // UUID
  user_id: string;               // auth.users(id) FK
  order_id: string;              // TossPayments orderId
  amount: number;                // 결제 금액 (KRW)
  status: 'success' | 'failed' | 'refunded';
  toss_payment_key: string | null; // 성공 시 paymentKey
  failure_reason: string | null;   // 실패 시 사유
  created_at: string;            // 결제 시각
}
```

### 3.3 Database Schema

#### SS-10: fre_user_profiles ALTER

```sql
ALTER TABLE fre_user_profiles
  ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grace_period_end DATE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
```

#### SS-8: fre_billing_history CREATE

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

#### SS-2: pg_cron + pg_net + Vault 설정

```sql
-- 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Vault에 시크릿 저장
SELECT vault.create_secret(
  'process_billing_url',
  'https://yidyxlwrongecctifiis.supabase.co/functions/v1/process-billing'
);
SELECT vault.create_secret(
  'service_role_key',
  '<SUPABASE_SERVICE_ROLE_KEY>'
);

-- Cron job: 매일 00:05 KST (15:05 UTC)
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

---

## 4. API Specification

### 4.1 Edge Function: process-billing (SS-1 + SS-6)

**파일**: `supabase/functions/process-billing/index.ts`
**인증**: service_role Bearer token (pg_cron에서만 호출)
**트리거**: pg_cron (매일 00:05 KST)

**처리 흐름**:

```
1. Authorization 헤더에서 service_role key 확인
2. SELECT * FROM fre_user_profiles
   WHERE subscription_status = 'active'
   AND next_billing_date <= CURRENT_DATE
   AND toss_billing_key IS NOT NULL
3. 각 유저 처리:
   a. orderId = `FRE-RENEW-{userId.slice(0,8)}-{YYYYMMDD}`
   b. POST /v1/billing/{billingKey} → TossPayments
   c. 성공:
      - next_billing_date += 30일
      - retry_count = 0
      - fre_billing_history INSERT (status='success')
   d. 실패:
      - retry_count += 1
      - fre_billing_history INSERT (status='failed', failure_reason)
      - retry_count < 3: next_billing_date = 재시도 간격 (1/3/7일 후)
      - retry_count >= 3: subscription_status = 'past_due'
                          grace_period_end = today + 7일
4. cancelled 구독 처리:
   SELECT * FROM fre_user_profiles
   WHERE subscription_status = 'cancelled'
   AND next_billing_date <= CURRENT_DATE
   → plan = 'free', subscription_status = 'none'
     toss_billing_key DELETE API → toss_billing_key = null
5. grace_period 만료 처리:
   SELECT * FROM fre_user_profiles
   WHERE subscription_status = 'past_due'
   AND grace_period_end <= CURRENT_DATE
   → plan = 'free', subscription_status = 'none'
     csv_row_limit = 10000
6. 처리 결과 JSON 반환
```

**재시도 간격 상수**:

```typescript
const RETRY_INTERVALS = [1, 3, 7]; // 일
```

**Response (200)**:
```json
{
  "processed": 5,
  "success": 3,
  "failed": 1,
  "cancelled_downgraded": 1,
  "grace_expired": 0
}
```

### 4.2 Edge Function: cancel-subscription (SS-3)

**파일**: `supabase/functions/cancel-subscription/index.ts`
**인증**: JWT Bearer token (유저 인증)
**메서드**: POST

**처리 흐름**:

```
1. Authorization → supabase.auth.getUser()
2. fre_user_profiles에서 유저 프로필 조회
3. subscription_status가 'active'인지 확인
4. DB 업데이트:
   - subscription_status = 'cancelled'
   - cancelled_at = now()
   (plan은 유지, toss_billing_key는 유지 — next_billing_date까지)
5. 성공 응답 반환
```

**Response (200)**:
```json
{
  "success": true,
  "message": "구독이 취소되었습니다. 다음 결제일까지 Pro 기능을 이용할 수 있습니다.",
  "next_billing_date": "2026-03-10"
}
```

**Error Responses**:
- `401`: 인증 필요
- `400`: 활성 구독이 없음
- `500`: DB 업데이트 실패

### 4.3 toss-webhook 보안 강화 (SS-7)

**파일**: `supabase/functions/toss-webhook/index.ts` (수정)
**추가 로직**: CORS 이후, body 파싱 전에 Webhook Secret 검증

```
1. TOSS_WEBHOOK_SECRET 환경변수 로드
2. 시크릿이 설정된 경우:
   a. 요청 body를 text로 읽기
   b. HMAC-SHA256(secret, body) 계산
   c. 요청 헤더의 서명과 비교
   d. 불일치 → 401 Unauthorized
3. 기존 이벤트 처리 로직 유지
```

**Webhook Secret 검증 로직**:

```typescript
async function verifyWebhookSignature(
  req: Request, bodyText: string
): Promise<boolean> {
  const secret = Deno.env.get('TOSS_WEBHOOK_SECRET');
  if (!secret) return true; // 시크릿 미설정 시 검증 건너뜀 (개발 환경)

  const signature = req.headers.get('TossPayments-Signature');
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
  const computed = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return computed === signature;
}
```

---

## 5. UI/UX Design

### 5.1 SubscriptionPage 레이아웃 (SS-4)

```
┌──────────────────────────────────────────────────────────┐
│  구독 관리                                                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─── SubscriptionStatus (SS-5) ──────────────────────┐  │
│  │  현재 플랜: Pro                                      │  │
│  │  구독 상태: 활성 (Active)                             │  │
│  │  다음 결제일: 2026-03-10                              │  │
│  │  결제 금액: ₩29,000/월                                │  │
│  │                                                      │  │
│  │  [구독 취소]                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─── BillingHistory (SS-9) ──────────────────────────┐  │
│  │  결제 내역                                           │  │
│  │  ┌──────────┬────────┬─────────┬──────────────────┐ │  │
│  │  │ 날짜     │ 금액   │ 상태    │ 주문번호          │ │  │
│  │  ├──────────┼────────┼─────────┼──────────────────┤ │  │
│  │  │ 02/10    │ ₩29,000│ 성공 ✓  │ FRE-PRO-a1b2...  │ │  │
│  │  │ 01/10    │ ₩29,000│ 실패 ✗  │ FRE-RENEW-...    │ │  │
│  │  └──────────┴────────┴─────────┴──────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                          │
│  Free 유저 상태:                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  현재 플랜: Free                                      │  │
│  │  Pro 플랜으로 업그레이드하면 다음 혜택을 받을 수 있습니다. │  │
│  │  [Pro 업그레이드]                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 5.2 PastDueBanner (AppShell 상단)

```
┌──────────────────────────────────────────────────────────┐
│ ⚠️ 결제에 문제가 있습니다. 카드 정보를 확인해주세요.        │
│ Grace period: 2026-02-18까지 Pro 기능 유지 [구독 관리 →]  │
└──────────────────────────────────────────────────────────┘
```

### 5.3 Component List

| Component | 파일 | 역할 |
|-----------|------|------|
| SubscriptionPage | `pages/SubscriptionPage.tsx` | 구독 관리 페이지 (SS-4) |
| SubscriptionStatus | `components/SubscriptionStatus.tsx` | 구독 상태 카드 (SS-5) |
| BillingHistory | `components/BillingHistory.tsx` | 결제 내역 테이블 (SS-9) |
| PastDueBanner | `components/PastDueBanner.tsx` | 결제 실패 경고 배너 |

### 5.4 User Flow

```
Pro 유저 구독 취소:
  SubscriptionPage → "구독 취소" 클릭 → 확인 모달
  → cancel-subscription API → 성공: 상태 업데이트
  → "다음 결제일까지 Pro 기능 유지" 메시지

Past Due 유저:
  AppShell → PastDueBanner 표시 (상단 고정)
  → "구독 관리 →" 클릭 → SubscriptionPage
  → 결제 실패 내역 확인

Free 유저:
  SubscriptionPage → "Pro 업그레이드" 클릭 → /pricing 이동
```

---

## 6. Error Handling

### 6.1 process-billing 에러 처리

| 시나리오 | 처리 | billing_history |
|----------|------|-----------------|
| TossPayments API 타임아웃 | retry_count++ (다음 cron에서 재시도) | status='failed', failure_reason='TIMEOUT' |
| 카드 한도 초과 | retry_count++ | status='failed', failure_reason=TossPayments 에러 메시지 |
| 빌링키 만료/삭제 | subscription_status='past_due' 즉시 | status='failed', failure_reason='BILLING_KEY_EXPIRED' |
| DB 업데이트 실패 | console.error + 다음 cron에서 재처리 | 기록 안 됨 |
| 이중 결제 시도 | TossPayments가 동일 orderId 거부 | status='failed', failure_reason='DUPLICATE_ORDER' |

### 6.2 cancel-subscription 에러 처리

| 코드 | 메시지 | 원인 |
|------|--------|------|
| 401 | 인증이 필요합니다. | JWT 토큰 없음/만료 |
| 400 | 활성 구독이 없습니다. | subscription_status != 'active' |
| 500 | 구독 취소 처리 중 오류가 발생했습니다. | DB 업데이트 실패 |

### 6.3 toss-webhook 에러 처리

| 코드 | 메시지 | 원인 |
|------|--------|------|
| 401 | Webhook 서명이 유효하지 않습니다. | HMAC-SHA256 불일치 |
| 400 | 잘못된 요청 형식입니다. | JSON 파싱 실패 |

---

## 7. Security Considerations

- [x] Webhook Secret (HMAC-SHA256) 검증으로 위조 요청 차단 (SS-7)
- [x] process-billing은 service_role token으로만 호출 가능 (pg_cron 전용)
- [x] cancel-subscription은 JWT 인증 필수 (유저 본인만)
- [x] fre_billing_history RLS: 유저는 자신의 기록만 조회
- [x] orderId에 날짜 포함하여 이중 결제 방지
- [x] Supabase Vault에 시크릿 키 저장 (코드에 하드코딩 금지)
- [x] TossPayments Secret Key는 Edge Function 환경변수에만 존재

---

## 8. Test Plan

### 8.1 기존 테스트 유지

| 유형 | 대상 | 도구 |
|------|------|------|
| Unit Test | planManager (새 함수) | Vitest |
| Unit Test | 기존 98개 테스트 전체 | Vitest |
| Build Test | Vite 빌드 성공 | vite build |

### 8.2 수동 검증 항목

- [ ] process-billing: service_role 아닌 토큰으로 호출 시 거부
- [ ] process-billing: 만기 구독 없을 때 processed=0 반환
- [ ] cancel-subscription: 활성 구독 취소 후 subscription_status='cancelled'
- [ ] cancel-subscription: Free 유저가 호출 시 400 에러
- [ ] toss-webhook: 잘못된 서명 시 401 반환
- [ ] toss-webhook: 올바른 서명 시 정상 처리
- [ ] SubscriptionPage: Pro 유저에게 구독 상태 + 취소 버튼 표시
- [ ] SubscriptionPage: Free 유저에게 업그레이드 CTA 표시
- [ ] BillingHistory: 결제 내역 시간순 정렬
- [ ] PastDueBanner: past_due 상태에서만 표시
- [ ] Sidebar: 구독 관리 메뉴 아이콘 표시 + 활성 상태

---

## 9. Implementation Guide

### 9.1 File Structure

```
funnel-&-retention-explorer frontend/
├── supabase/
│   ├── functions/
│   │   ├── process-billing/
│   │   │   └── index.ts              [SS-1, SS-6] 신규
│   │   ├── cancel-subscription/
│   │   │   └── index.ts              [SS-3] 신규
│   │   └── toss-webhook/
│   │       └── index.ts              [SS-7] 수정
│   └── migrations/
│       └── 20260210_billing_scheduling.sql  [SS-2, SS-8, SS-10] 신규
├── lib/
│   └── planManager.ts                [SS-3, SS-9] 수정
├── types/
│   └── index.ts                      [SS-8] 수정
├── pages/
│   └── SubscriptionPage.tsx          [SS-4] 신규
├── components/
│   ├── SubscriptionStatus.tsx        [SS-5] 신규
│   ├── BillingHistory.tsx            [SS-9] 신규
│   ├── PastDueBanner.tsx             [신규]
│   ├── Sidebar.tsx                   [SS-11] 수정
│   └── AppShell.tsx                  [수정]
└── router.tsx                        [SS-11] 수정
```

### 9.2 Implementation Order

```
Phase A — DB & Infrastructure (선행)
  1. [SS-10] fre_user_profiles ALTER (retry_count, grace_period_end, cancelled_at)
  2. [SS-8]  fre_billing_history 테이블 + RLS + 인덱스
  3. [SS-2]  pg_cron + pg_net + Vault 설정

Phase B — Edge Functions (서버 로직)
  4. [SS-1]  process-billing Edge Function (자동결제)
  5. [SS-6]  재시도 로직 (SS-1에 통합)
  6. [SS-7]  toss-webhook Webhook Secret 검증
  7. [SS-3]  cancel-subscription Edge Function

Phase C — Frontend Types & Utilities
  8. types/index.ts: BillingRecord 타입 추가
  9. planManager.ts: cancelSubscription, fetchBillingHistory 함수 추가

Phase D — UI Components
  10. [SS-5]  SubscriptionStatus 컴포넌트
  11. [SS-9]  BillingHistory 컴포넌트
  12. PastDueBanner 컴포넌트
  13. [SS-4]  SubscriptionPage (SS-5 + SS-9 + PastDueBanner 조합)

Phase E — Integration
  14. [SS-11] Sidebar 메뉴 항목 추가 (CreditCard 아이콘)
  15. [SS-11] router.tsx: /app/subscription 라우트 추가
  16. AppShell.tsx: PastDueBanner 렌더링
```

---

## 10. Detailed Implementation Specifications

### 10.1 process-billing/index.ts (SS-1 + SS-6)

**구조**:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RETRY_INTERVALS = [1, 3, 7];
const GRACE_PERIOD_DAYS = 7;
const BILLING_AMOUNT = 29000;

serve(async (req) => {
  // 1. CORS 처리
  // 2. service_role 인증 확인 (Authorization: Bearer <service_role_key>)
  // 3. serviceClient 생성 (SUPABASE_SERVICE_ROLE_KEY)
  // 4. 만기 구독 조회 + 결제 처리
  // 5. cancelled 구독 만기 처리
  // 6. grace_period 만료 처리
  // 7. 결과 반환
});
```

**service_role 인증 확인**:
```typescript
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (token !== serviceRoleKey) {
  return new Response(JSON.stringify({ error: '권한이 없습니다.' }), { status: 401 });
}
```

**만기 구독 결제 처리**:
```typescript
const { data: dueProfiles } = await serviceClient
  .from('fre_user_profiles')
  .select('*')
  .eq('subscription_status', 'active')
  .lte('next_billing_date', new Date().toISOString().slice(0, 10))
  .not('toss_billing_key', 'is', null);

for (const profile of dueProfiles ?? []) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const orderId = `FRE-RENEW-${profile.id.slice(0, 8)}-${dateStr}`;

  const tossAuth = `Basic ${btoa(TOSS_SECRET_KEY + ':')}`;
  const res = await fetch(`https://api.tosspayments.com/v1/billing/${profile.toss_billing_key}`, {
    method: 'POST',
    headers: { Authorization: tossAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerKey: profile.toss_customer_key,
      amount: BILLING_AMOUNT,
      orderId,
      orderName: 'FRE Analytics Pro 월간 구독 갱신',
    }),
  });

  if (res.ok) {
    const data = await res.json();
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);

    await serviceClient.from('fre_user_profiles').update({
      next_billing_date: nextDate.toISOString().slice(0, 10),
      retry_count: 0,
    }).eq('id', profile.id);

    await serviceClient.from('fre_billing_history').insert({
      user_id: profile.id, order_id: orderId, amount: BILLING_AMOUNT,
      status: 'success', toss_payment_key: data.paymentKey,
    });
  } else {
    const errData = await res.json();
    const newRetryCount = (profile.retry_count ?? 0) + 1;

    await serviceClient.from('fre_billing_history').insert({
      user_id: profile.id, order_id: orderId, amount: BILLING_AMOUNT,
      status: 'failed', failure_reason: errData.message ?? 'Unknown error',
    });

    if (newRetryCount >= 3) {
      const gracEnd = new Date();
      gracEnd.setDate(gracEnd.getDate() + GRACE_PERIOD_DAYS);
      await serviceClient.from('fre_user_profiles').update({
        retry_count: newRetryCount,
        subscription_status: 'past_due',
        grace_period_end: gracEnd.toISOString().slice(0, 10),
      }).eq('id', profile.id);
    } else {
      const retryDate = new Date();
      retryDate.setDate(retryDate.getDate() + RETRY_INTERVALS[newRetryCount - 1]);
      await serviceClient.from('fre_user_profiles').update({
        retry_count: newRetryCount,
        next_billing_date: retryDate.toISOString().slice(0, 10),
      }).eq('id', profile.id);
    }
  }
}
```

### 10.2 cancel-subscription/index.ts (SS-3)

**구조**: issue-billing과 동일한 패턴 (CORS → JWT Auth → DB 업데이트)

```typescript
serve(async (req) => {
  // 1. CORS
  // 2. JWT 인증 → user
  // 3. serviceClient로 프로필 조회
  // 4. subscription_status === 'active' 확인
  // 5. UPDATE: subscription_status='cancelled', cancelled_at=now()
  // 6. 성공 응답 (next_billing_date 포함)
});
```

### 10.3 toss-webhook/index.ts 수정 (SS-7)

**변경 사항**: 기존 코드 앞에 Webhook Secret 검증 추가

```typescript
serve(async (req) => {
  // CORS (기존)

  // === SS-7: Webhook Secret 검증 (신규) ===
  const bodyText = await req.text();
  const isValid = await verifyWebhookSignature(req, bodyText);
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Webhook 서명이 유효하지 않습니다.' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const body = JSON.parse(bodyText); // req.json() 대신 text → parse

  // 기존 이벤트 처리 로직 유지...
});
```

### 10.4 planManager.ts 추가 함수

```typescript
// 구독 취소 요청
export async function cancelSubscription(accessToken: string): Promise<{ success: boolean; message: string; next_billing_date?: string }> {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.json();
}

// 결제 내역 조회
export async function fetchBillingHistory(userId: string): Promise<BillingRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('fre_billing_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  return (data ?? []) as BillingRecord[];
}
```

### 10.5 types/index.ts 추가

```typescript
// ===== Billing History =====

export interface BillingRecord {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded';
  toss_payment_key: string | null;
  failure_reason: string | null;
  created_at: string;
}
```

### 10.6 SubscriptionPage.tsx (SS-4)

```typescript
// 주요 구조:
// - useAuth()에서 user, userProfile 가져오기
// - useState로 billingHistory, cancelling, showCancelModal 관리
// - useEffect로 fetchBillingHistory 호출
// - handleCancel: cancelSubscription → userProfile 리프레시
// 렌더:
// - Pro + active: SubscriptionStatus(취소 버튼) + BillingHistory
// - Pro + cancelled: SubscriptionStatus(취소됨 표시) + BillingHistory
// - Pro + past_due: SubscriptionStatus(결제 실패 표시) + BillingHistory
// - Free: 업그레이드 CTA + BillingHistory (있으면)
```

### 10.7 SubscriptionStatus.tsx (SS-5)

```typescript
// Props: userProfile, onCancel, cancelling
// 표시 정보:
// - 현재 플랜 (Free/Pro)
// - 구독 상태 뱃지 (active=초록, cancelled=노랑, past_due=빨강)
// - 다음 결제일 (Pro only)
// - 결제 금액 (₩29,000/월)
// - grace_period_end (past_due only)
// - 취소 버튼 (active only)
```

### 10.8 BillingHistory.tsx (SS-9)

```typescript
// Props: records: BillingRecord[]
// 테이블 컬럼: 날짜, 금액, 상태(뱃지), 주문번호
// 상태 뱃지: success=초록, failed=빨강, refunded=회색
// 빈 상태: "결제 내역이 없습니다."
```

### 10.9 PastDueBanner

```typescript
// AuthContext에서 userProfile 가져오기
// subscription_status === 'past_due'일 때만 렌더
// 노란색 경고 배너 + grace_period_end 표시
// "구독 관리 →" 링크 (navigate('/app/subscription'))
```

### 10.10 Sidebar.tsx 수정 (SS-11)

**변경**: menuItems 배열에 구독 관리 항목 추가

```typescript
import { CreditCard } from './Icons';

const menuItems: MenuItem[] = [
  // ... 기존 6개 유지
  { path: '/app/subscription', icon: CreditCard, label: '구독 관리' },
];
```

### 10.11 router.tsx 수정 (SS-11)

**변경**: lazy import + route 추가

```typescript
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })));

// /app children에 추가:
{ path: 'subscription', element: <Suspense fallback={<PageLoader />}><SubscriptionPage /></Suspense> },
```

### 10.12 AppShell.tsx 수정

**변경**: PastDueBanner 렌더링 (header 아래, 페이지 콘텐츠 위)

```typescript
import { PastDueBanner } from './PastDueBanner';

// <main> 내부, <header> 바로 아래:
<PastDueBanner />
```

---

## 11. Check Items (Gap Analysis 체크리스트)

### SS-1: process-billing Edge Function

- [ ] `supabase/functions/process-billing/index.ts` 파일 존재
- [ ] corsHeaders 정의 + OPTIONS 처리
- [ ] service_role 인증 확인 로직
- [ ] serviceClient (SUPABASE_SERVICE_ROLE_KEY) 생성
- [ ] 만기 구독 쿼리: subscription_status='active' AND next_billing_date<=today AND toss_billing_key IS NOT NULL
- [ ] TossPayments `/v1/billing/{billingKey}` POST 호출
- [ ] orderId 형식: `FRE-RENEW-{userId.slice(0,8)}-{YYYYMMDD}`
- [ ] 결제 성공: next_billing_date += 30일, retry_count = 0
- [ ] 결제 성공: fre_billing_history INSERT (status='success')
- [ ] 결제 실패: retry_count++, fre_billing_history INSERT (status='failed')

### SS-2: pg_cron job

- [ ] migration SQL 파일에 pg_cron extension CREATE
- [ ] migration SQL 파일에 pg_net extension CREATE
- [ ] vault.create_secret('process_billing_url', ...) 호출
- [ ] vault.create_secret('service_role_key', ...) 호출
- [ ] cron.schedule('daily-billing', '5 15 * * *', ...) 호출
- [ ] net.http_post에 Authorization + Content-Type 헤더

### SS-3: cancel-subscription Edge Function

- [ ] `supabase/functions/cancel-subscription/index.ts` 파일 존재
- [ ] corsHeaders 정의 + OPTIONS 처리
- [ ] JWT 인증 (supabase.auth.getUser)
- [ ] subscription_status='active' 확인 (아닐 시 400)
- [ ] DB UPDATE: subscription_status='cancelled', cancelled_at=now()
- [ ] plan 유지 (변경하지 않음)
- [ ] 성공 응답에 next_billing_date 포함

### SS-4: SubscriptionPage

- [ ] `pages/SubscriptionPage.tsx` 파일 존재
- [ ] export named `SubscriptionPage`
- [ ] useAuth()에서 user, userProfile 사용
- [ ] fetchBillingHistory 호출
- [ ] Pro + active: SubscriptionStatus + 취소 버튼 표시
- [ ] Free: 업그레이드 CTA 표시
- [ ] 취소 확인 모달 (Modal 컴포넌트)
- [ ] cancelSubscription 호출 + 에러 처리

### SS-5: SubscriptionStatus

- [ ] `components/SubscriptionStatus.tsx` 파일 존재
- [ ] 현재 플랜 표시 (Free/Pro)
- [ ] 구독 상태 뱃지 (active/cancelled/past_due 색상 구분)
- [ ] 다음 결제일 표시 (Pro only)
- [ ] 결제 금액 표시 (₩29,000/월)
- [ ] grace_period_end 표시 (past_due only)
- [ ] 취소 버튼 (active only, onCancel prop)

### SS-6: 결제 실패 재시도 로직

- [ ] RETRY_INTERVALS 상수 [1, 3, 7]
- [ ] GRACE_PERIOD_DAYS 상수 (7)
- [ ] retry_count < 3: next_billing_date를 재시도 간격으로 설정
- [ ] retry_count >= 3: subscription_status='past_due', grace_period_end 설정
- [ ] cancelled 구독 만기 처리: plan='free', toss_billing_key=null
- [ ] grace_period 만료 처리: plan='free', csv_row_limit=10000

### SS-7: toss-webhook 보안 강화

- [ ] verifyWebhookSignature 함수 (HMAC-SHA256)
- [ ] TOSS_WEBHOOK_SECRET 환경변수 사용
- [ ] 서명 불일치 시 401 반환
- [ ] 시크릿 미설정 시 검증 건너뜀 (개발 환경 호환)
- [ ] req.text() → JSON.parse (req.json() 대신)
- [ ] 기존 이벤트 처리 로직 유지 (BILLING_DELETED, PAYMENT_STATUS_CHANGED)

### SS-8: fre_billing_history 테이블

- [ ] CREATE TABLE fre_billing_history
- [ ] id UUID PK, user_id UUID FK, order_id TEXT, amount INT
- [ ] status CHECK ('success', 'failed', 'refunded')
- [ ] toss_payment_key TEXT nullable, failure_reason TEXT nullable
- [ ] RLS 활성화 + own_history_select + service_role_all 정책
- [ ] idx_billing_history_user 인덱스
- [ ] idx_billing_history_created 인덱스

### SS-9: BillingHistory 컴포넌트

- [ ] `components/BillingHistory.tsx` 파일 존재
- [ ] records prop (BillingRecord[])
- [ ] 테이블: 날짜, 금액, 상태 뱃지, 주문번호
- [ ] 상태 뱃지 색상 구분 (success=초록, failed=빨강, refunded=회색)
- [ ] 빈 상태 메시지
- [ ] 금액 포맷: ₩29,000 형식

### SS-10: fre_user_profiles 스키마 확장

- [ ] ALTER TABLE: retry_count INT NOT NULL DEFAULT 0
- [ ] ALTER TABLE: grace_period_end DATE nullable
- [ ] ALTER TABLE: cancelled_at TIMESTAMPTZ nullable
- [ ] types/index.ts UserProfile에 retry_count 필드
- [ ] types/index.ts UserProfile에 grace_period_end 필드
- [ ] types/index.ts UserProfile에 cancelled_at 필드
- [ ] planManager.ts UserProfile에 동일 3개 필드

### SS-11: Sidebar + Router 업데이트

- [ ] Sidebar menuItems에 '/app/subscription' 항목
- [ ] CreditCard 아이콘 import (Icons.tsx에서)
- [ ] router.tsx: SubscriptionPage lazy import
- [ ] router.tsx: /app children에 'subscription' path
- [ ] AppShell.tsx: PastDueBanner import + 렌더링

### 공통: Types & Utilities

- [ ] types/index.ts에 BillingRecord interface
- [ ] planManager.ts에 cancelSubscription 함수
- [ ] planManager.ts에 fetchBillingHistory 함수
- [ ] Icons.tsx에 CreditCard export (Lucide)

### 공통: 빌드 & 테스트

- [ ] 기존 테스트 전체 통과 (98/98)
- [ ] Vite 빌드 성공
- [ ] TypeScript 타입 에러 없음

**총 체크 항목: 83개**

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-02-10 | Initial design — 11 tasks, 13 files, 83 check items |
