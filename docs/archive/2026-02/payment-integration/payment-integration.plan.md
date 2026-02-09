# Plan: Payment Integration (수익화 로드맵 Phase 2)

> **Feature**: payment-integration
> **Level**: Dynamic
> **Created**: 2026-02-09
> **Updated**: 2026-02-10
> **Status**: Plan
> **Reference**: `docs/MONETIZATION-ROADMAP.md` Phase 2

---

## 1. Overview

수익화 로드맵 Phase 2로, TossPayments 결제 연동 + Free/Pro 기능 게이팅을 구현한다. Phase 1에서 보안/신뢰 기반(50/100)을 갖췄으므로 이제 "돈 받는 구조"를 만든다.

### 목표 점수
- **Before**: 50/100
- **After**: 70/100 (+20)

### 결제 PG 선택: TossPayments
- 국내 PG 중 개발자 경험(DX) 최고 수준
- SDK v2 통합 SDK로 간편 연동
- 테스트 모드 즉시 사용 가능 (계약 전 개발 가능)
- 한국 원화(KRW) 결제에 최적화

---

## 2. Problem Statement

### 2-1. 유저 플랜 시스템 부재

**현재 상태**: `AuthContext`는 `User | null`만 관리. 플랜(free/pro), 구독 상태, 결제 연동 정보를 어디에도 저장하지 않음. `types/index.ts`에도 구독 관련 타입이 없음 (SubscriptionKPIs는 분석 대상 데이터의 구독 지표이지, 자체 서비스 구독이 아님).

### 2-2. 기능 제한 없음

**현재 상태**: `ProtectedRoute`가 게스트 모드를 허용하고, 모든 기능에 대한 접근 제한이 없음. AI 인사이트(`useAIInsights`)는 로그인만 요구하고 호출 횟수 제한 없음. CSV 업로드(`useCSVUpload`)에 행 수 제한 없음.

### 2-3. 결제 수단 없음

**현재 상태**: 랜딩 페이지에 가격표가 있지만 Pro/Team은 "출시 예정" disabled 버튼. 실제 결제 흐름이 없음.

---

## 3. Scope

### In Scope (구현 대상)

| ID | Task | Priority | 영향 |
|----|------|----------|------|
| PI-1 | `fre_user_profiles` 테이블 생성 (Supabase Migration) | Critical | DB schema |
| PI-2 | `lib/planManager.ts` — 플랜 조회, 제한 체크 유틸리티 | Critical | 신규 파일 |
| PI-3 | `context/AuthContext.tsx` — userProfile 추가 | Critical | 수정 |
| PI-4 | `hooks/usePlanGate.ts` — 기능별 접근 제어 훅 | High | 신규 파일 |
| PI-5 | `supabase/functions/issue-billing/index.ts` — 빌링키 발급 + 첫 결제 | High | 신규 파일 |
| PI-6 | `supabase/functions/toss-webhook/index.ts` — TossPayments Webhook 처리 | High | 신규 파일 |
| PI-7 | `components/UpgradeModal.tsx` — 업그레이드 유도 모달 (TossPayments SDK v2) | High | 신규 파일 |
| PI-8 | `components/PlanBadge.tsx` — 사이드바 플랜 표시 | Medium | 신규 파일 |
| PI-9 | CSV 업로드 행 수 제한 적용 | Medium | hooks/useCSVUpload.ts 수정 |
| PI-10 | AI 인사이트 일일 호출 제한 적용 | Medium | hooks/useAIInsights.ts 수정, Edge Function 수정 |
| PI-11 | 랜딩 페이지 가격표 업데이트 + Pricing 독립 페이지 | Medium | pages/LandingPage.tsx, pages/PricingPage.tsx |
| PI-12 | Sidebar에 PlanBadge 통합 | Low | components/Sidebar.tsx 수정 |

### Out of Scope (이 Phase에서 안 함)

- 구독 관리 포털 (Phase 4에서)
- 연간 결제 할인 (초기에는 월간만)
- Team 플랜 (다중 사용자 — Phase 4에서)
- 리포트 내보내기 워터마크/PDF (Phase 4에서)
- 세그먼트 비교 제한 (Phase 4에서)
- 프로젝트 수 제한 (Phase 4에서)
- 자동 빌링 스케줄링 (Supabase pg_cron — Phase 3에서)

---

## 4. Technical Approach

### TossPayments 자동결제(빌링) 흐름

```
[유저: Pro 업그레이드 클릭]
    ↓
[클라이언트: TossPayments SDK v2 빌링 인증 창 열기]
    ↓ requestBillingAuth()
[구매자: 카드 등록 + 본인인증]
    ↓ 성공 시 successUrl로 리다이렉트
[클라이언트: authKey, customerKey 수신]
    ↓
[서버(Edge Function): issue-billing]
    ├─ 1) /v1/billing/authorizations/issue API → billingKey 발급
    ├─ 2) /v1/billing/{billingKey} API → 첫 결제 승인 (₩29,000)
    └─ 3) fre_user_profiles 업데이트: plan='pro', billing_key 저장
    ↓
[유저: Pro 기능 즉시 사용 가능]
```

**구독 취소 시**:
```
[유저: 구독 취소 클릭]
    ↓
[서버(Edge Function): cancel-subscription]
    ├─ 빌링키 삭제 API 호출 (선택)
    └─ fre_user_profiles: plan='free', billing_key=NULL
```

**참고**: TossPayments는 자체 스케줄링을 제공하지 않음. 월간 자동 결제는 Phase 3에서 Supabase pg_cron 또는 외부 스케줄러로 구현. Phase 2에서는 수동 결제(첫 결제)만 구현.

---

### PI-1: DB 스키마 — `fre_user_profiles`

```sql
CREATE TABLE fre_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  plan_started_at TIMESTAMPTZ,
  toss_customer_key TEXT,
  toss_billing_key TEXT,
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'cancelled', 'past_due')),
  next_billing_date DATE,
  ai_calls_today INT NOT NULL DEFAULT 0,
  ai_calls_reset_at DATE NOT NULL DEFAULT CURRENT_DATE,
  csv_row_limit INT NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fre_user_profiles ENABLE ROW LEVEL SECURITY;

-- 자신의 프로필만 조회 가능
CREATE POLICY "own_profile_select" ON fre_user_profiles
  FOR SELECT USING (auth.uid() = id);

-- 자신의 프로필만 수정 가능 (결제 관련 필드 제외 — 서버만 수정)
CREATE POLICY "own_profile_update" ON fre_user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 서비스 역할(webhook, Edge Function)은 모든 프로필 수정 가능
CREATE POLICY "service_role_all" ON fre_user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- 회원가입 시 자동 프로필 생성 (trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO fre_user_profiles (id, toss_customer_key)
  VALUES (NEW.id, gen_random_uuid()::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Stripe → TossPayments 변경 사항**:
- `stripe_customer_id` → `toss_customer_key` (UUID, 우리 시스템에서 생성)
- `stripe_subscription_id` → `toss_billing_key` (TossPayments에서 발급)
- `subscription_status` 추가 (TossPayments는 구독 상태를 관리하지 않으므로 직접 관리)
- `next_billing_date` 추가 (스케줄링용)
- `toss_customer_key`는 회원가입 시 자동 UUID 생성 (TossPayments 요구: 고유한 무작위 값)

---

### PI-2: `lib/planManager.ts`

```typescript
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
}

export const PLAN_LIMITS = {
  free: { csvRows: 10_000, aiCallsPerDay: 3, projects: 1, savedAnalyses: 5 },
  pro:  { csvRows: 500_000, aiCallsPerDay: 50, projects: -1, savedAnalyses: -1 },
} as const;

// fetchUserProfile(userId) — Supabase에서 프로필 조회
// canUseAI(profile) — ai_calls_today < limit, 날짜 리셋 체크
// incrementAIUsage(userId) — ai_calls_today += 1
// getCSVRowLimit(profile) — csv_row_limit 반환
// isPro(profile) — plan === 'pro'
```

---

### PI-3: AuthContext 확장

현재 `AuthContextValue`에 `userProfile: UserProfile | null` 추가. 로그인 시 자동으로 `fre_user_profiles`에서 조회. `onAuthStateChange`에서도 동기화.

---

### PI-4: `hooks/usePlanGate.ts`

```typescript
// usePlanGate() → { isPro, canUseAI, csvRowLimit, showUpgrade }
// 제한 도달 시 UpgradeModal 표시를 위한 state 관리
```

---

### PI-5: TossPayments 빌링키 발급 Edge Function

**`supabase/functions/issue-billing/index.ts`**:

1. JWT 인증 확인
2. 요청에서 `authKey` 수신 (SDK 빌링 인증 성공 후 전달됨)
3. `fre_user_profiles`에서 `toss_customer_key` 조회
4. TossPayments API 호출: `/v1/billing/authorizations/issue` (authKey + customerKey → billingKey)
5. 첫 결제 승인: `/v1/billing/{billingKey}` (₩29,000, orderId 생성)
6. DB 업데이트: `plan='pro'`, `toss_billing_key`, `subscription_status='active'`, `plan_started_at=now()`
7. 성공 응답 반환

```typescript
// TossPayments API 인증 헤더
const authHeader = `Basic ${btoa(TOSS_SECRET_KEY + ':')}`;

// 1) 빌링키 발급
const billingRes = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
  method: 'POST',
  headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
  body: JSON.stringify({ authKey, customerKey })
});
const { billingKey } = await billingRes.json();

// 2) 첫 결제 승인
const paymentRes = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
  method: 'POST',
  headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerKey,
    amount: 29000,
    orderId: `FRE-PRO-${userId}-${Date.now()}`,
    orderName: 'FRE Analytics Pro 월간 구독',
    customerEmail: user.email
  })
});
```

**환경변수 (Supabase Secrets)**:
- `TOSS_SECRET_KEY` — TossPayments 시크릿 키 (API 개별 연동 키)
- `TOSS_CLIENT_KEY` — TossPayments 클라이언트 키 (프론트엔드용, VITE_ prefix)

---

### PI-6: TossPayments Webhook Edge Function

**`supabase/functions/toss-webhook/index.ts`**:

1. 요청 검증 (IP 화이트리스트 또는 시크릿 검증)
2. 이벤트 타입별 처리:
   - `PAYMENT_STATUS_CHANGED` → 결제 상태 변경 시 DB 업데이트
   - `BILLING_DELETED` → 빌링키 삭제 시 plan='free' 다운그레이드

**TossPayments Webhook 특성**:
- 개발자센터 > 웹훅에서 URL 등록
- 재시도 정책: 최대 7회, 약 3.8일간 재시도
- 응답 200 OK 필수 (그 외 코드는 실패 처리)

---

### PI-7: UpgradeModal

제한 도달 시 (CSV 행 초과, AI 일일 한도 초과) 표시되는 모달.

**TossPayments SDK v2 연동**:
```html
<script src="https://js.tosspayments.com/v2/standard"></script>
```

```typescript
// 클라이언트에서 TossPayments SDK 초기화
const tossPayments = TossPayments(VITE_TOSS_CLIENT_KEY);

// 빌링 인증 요청 (카드 등록 창 열기)
await tossPayments.requestBillingAuth({
  method: 'CARD',
  successUrl: `${window.location.origin}/app/billing/success`,
  failUrl: `${window.location.origin}/app/billing/fail`,
  customerKey: userProfile.toss_customer_key,
  customerEmail: user.email,
});
```

**흐름**:
1. 유저가 "Pro 업그레이드" 버튼 클릭
2. TossPayments SDK v2 빌링 인증 창 열기 (`requestBillingAuth`)
3. 카드 등록 + 본인인증 완료
4. `successUrl`로 리다이렉트 (query: `authKey`, `customerKey`)
5. `/app/billing/success` 페이지에서 `authKey`를 `issue-billing` Edge Function에 전송
6. Edge Function이 빌링키 발급 + 첫 결제 처리
7. 성공 시 Pro 기능 즉시 활성화

---

### PI-8: PlanBadge

사이드바 하단에 현재 플랜 표시. Free 유저에게 "Pro로 업그레이드" 링크.

---

### PI-9: CSV 업로드 제한

`useCSVUpload`의 `handleFileUpload`에서:
1. `parseCSV` 결과의 행 수 체크
2. `planGate.csvRowLimit` 초과 시 `UpgradeModal` 표시
3. 초과 데이터는 잘리지 않고 업로드 자체를 차단

---

### PI-10: AI 인사이트 제한

`useAIInsights`의 `generateSummary`/`askQuestion`에서:
1. `planGate.canUseAI` 체크
2. 불가 시 `UpgradeModal` 표시
3. Edge Function(`ai-proxy`)에서도 서버사이드 검증 (이중 체크)

---

### PI-11: Pricing 업데이트

- 랜딩 페이지 가격표: Pro ₩39,000 → ₩29,000, "출시 예정" → 실제 CTA
- `/pricing` 독립 페이지 생성 (더 자세한 비교 + FAQ)
- 결제 수단: TossPayments 지원 (카드, 간편결제)

---

## 5. Free vs Pro 제한표

| 기능 | Free | Pro (₩29,000/월) |
|------|------|-------------------|
| CSV 업로드 행 수 | 10,000행 | 500,000행 |
| AI 인사이트 | 일 3회 | 일 50회 |
| 프로젝트 수 | 1개 | 무제한 |
| 분석 저장 | 최근 5개 | 무제한 |
| 리포트 내보내기 | PNG (워터마크) | PNG + PDF |
| 세그먼트 비교 | 2개 세그먼트 | 무제한 |

**Phase 2에서 적용**: CSV 행 수 제한, AI 호출 제한
**Phase 4에서 적용**: 나머지 (프로젝트, 저장, 내보내기, 세그먼트)

---

## 6. Implementation Order

```
PI-1 (DB 스키마) ──────────────────── [Critical, 선행 작업]
    ↓
PI-2 (planManager.ts) ────────────── [Critical, PI-1 의존]
    ↓
PI-3 (AuthContext 확장) ──────────── [Critical, PI-2 의존]
    ↓
PI-4 (usePlanGate 훅) ───────────── [High, PI-3 의존]
    ↓
┌── PI-5 (issue-billing) ────────── [High, 독립적]
├── PI-6 (toss-webhook) ─────────── [High, 독립적]
├── PI-7 (UpgradeModal + SDK) ───── [High, PI-4 의존]
├── PI-8 (PlanBadge) ─────────────── [Medium, PI-3 의존]
└── PI-9, PI-10 (제한 적용) ────── [Medium, PI-4 의존]
    ↓
PI-11 (Pricing 업데이트) ─────────── [Medium, PI-5 의존]
PI-12 (Sidebar 통합) ────────────── [Low, PI-8 의존]
```

---

## 7. Files Impact Summary

| 구분 | 파일 | 변경 유형 |
|------|------|-----------|
| 신규 | `lib/planManager.ts` | 플랜 유틸리티 |
| 신규 | `hooks/usePlanGate.ts` | 기능 게이팅 훅 |
| 신규 | `supabase/functions/issue-billing/index.ts` | TossPayments 빌링키 발급 + 첫 결제 |
| 신규 | `supabase/functions/toss-webhook/index.ts` | TossPayments Webhook 처리 |
| 신규 | `components/UpgradeModal.tsx` | 업그레이드 모달 (TossPayments SDK v2) |
| 신규 | `components/PlanBadge.tsx` | 플랜 배지 |
| 신규 | `pages/PricingPage.tsx` | 독립 가격 페이지 |
| 신규 | `pages/BillingSuccessPage.tsx` | 빌링 인증 성공 콜백 페이지 |
| 수정 | `types/index.ts` | UserProfile, PlanType, SubscriptionStatus 타입 추가 |
| 수정 | `context/AuthContext.tsx` | userProfile 상태 추가 |
| 수정 | `hooks/useCSVUpload.ts` | 행 수 제한 체크 |
| 수정 | `hooks/useAIInsights.ts` | AI 호출 제한 체크 |
| 수정 | `supabase/functions/ai-proxy/index.ts` | AI 호출 서버사이드 검증 |
| 수정 | `components/Sidebar.tsx` | PlanBadge 통합 |
| 수정 | `pages/LandingPage.tsx` | 가격표 업데이트 |
| 수정 | `router.tsx` | /pricing, /app/billing/success 라우트 추가 |
| 수정 | `index.html` | TossPayments SDK v2 스크립트 추가 |

**신규 8개, 수정 9개 = 총 17개 파일**

---

## 8. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| TossPayments 테스트 → 라이브 키 전환 실수 | 실결제 발생 | Supabase Secrets로 환경 분리, 코드에 키 하드코딩 금지 |
| Webhook 실패 시 결제 상태 미반영 | Pro 결제했는데 Free 유지 | TossPayments 7회 재시도 정책 + 개발자센터에서 수동 확인 |
| 기존 유저에 프로필 없음 | 에러 발생 | `AuthContext`에서 프로필 없으면 자동 생성 (upsert) |
| Edge Function 콜드 스타트 | 결제 UX 느림 | 빌링키 발급 1회성 호출이므로 수용 가능 |
| `fre_user_profiles` RLS 설정 오류 | 다른 유저 프로필 노출 | `own_profile` 정책으로 본인만 접근, service_role은 Edge Function용 |
| TossPayments 자동결제 계약 미체결 | API 호출 불가 | 테스트 모드에서 개발, 라이브 전 계약 별도 진행 |
| 스케줄링 미구현 (Phase 2) | 월간 자동 결제 안 됨 | Phase 2는 첫 결제만, Phase 3에서 pg_cron 구현 |

---

## 9. Acceptance Criteria

- [ ] 새 유저 회원가입 시 `fre_user_profiles`에 자동 레코드 생성 (toss_customer_key UUID 포함)
- [ ] AuthContext에서 `userProfile`이 로그인 시 자동 로드
- [ ] Free 유저가 10,001행 CSV 업로드 시 UpgradeModal 표시
- [ ] Free 유저가 AI 인사이트 4번째 호출 시 UpgradeModal 표시
- [ ] Pro 버튼 클릭 → TossPayments SDK 빌링 인증 → 첫 결제 성공 → DB plan='pro'
- [ ] Sidebar에 현재 플랜(Free/Pro) 배지 표시
- [ ] /pricing 페이지에서 Free/Pro 비교 및 결제 가능
- [ ] /app/billing/success 페이지에서 빌링키 발급 처리
- [ ] 기존 테스트 98/98 전체 통과
- [ ] 빌드 성공

---

## 10. Dependencies

| 의존성 | 상태 | 비고 |
|--------|------|------|
| TossPayments 계정 | 생성 필요 | 회원가입 후 테스트 키 즉시 사용 가능 |
| TossPayments 자동결제 계약 | 라이브 시 필요 | 테스트 모드에서는 계약 없이 개발 가능 |
| `TOSS_SECRET_KEY` | Supabase Secrets | `supabase secrets set TOSS_SECRET_KEY=test_sk_...` |
| `VITE_TOSS_CLIENT_KEY` | Vercel 환경변수 | 프론트엔드용 클라이언트 키 |
| TossPayments SDK v2 | CDN | `https://js.tosspayments.com/v2/standard` (index.html에 추가) |
| Supabase CLI | 설치됨 | Migration + Edge Function 배포 |
| Phase 1 완료 | 완료 | API 프록시, 법적 문서, Sentry |

---

## 11. TossPayments vs Stripe 비교 (설계 근거)

| 항목 | TossPayments | Stripe |
|------|-------------|--------|
| 구독 관리 | 직접 구현 필요 (billingKey + 스케줄러) | Subscription 객체 내장 |
| 카드 등록 | SDK v2 `requestBillingAuth()` → billingKey | Checkout Session → PaymentMethod |
| 결제 승인 | `/v1/billing/{billingKey}` API 직접 호출 | 자동 (Subscription이 관리) |
| 인증 | Basic auth (base64 secretKey:) | Bearer token |
| Webhook | PAYMENT_STATUS_CHANGED, BILLING_DELETED | checkout.session.completed, invoice.* |
| 스케줄링 | 미제공 — 직접 구현 | 내장 (billing cycle 자동) |
| 한국 결제 | 네이티브 지원 | 글로벌 (한국 카드 지원하지만 제한적) |
| 가격 | 건당 수수료 (계약에 따라 상이) | 3.4% + ₩400/건 |

**선택 이유**: 한국 시장 타겟 SaaS로, 국내 결제 수단(카드, 간편결제)에 최적화된 TossPayments가 적합. 구독 스케줄링은 Phase 3에서 pg_cron으로 해결.
