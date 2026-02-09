# FRE Analytics 수익화 로드맵

> 현재 점수: 35/100 → 목표: 80/100 (MVP 수익화 가능 수준)
>
> 전략: "완벽한 제품"이 아니라 "돈을 받을 수 있는 최소 제품"을 만든다.
> 6개 Phase, 각 Phase는 1~2주 분량. 순서대로 실행.

---

## Phase 0: PMF 검증 (코드 작성 전)

**기간**: 1주
**목적**: 코드를 더 짜기 전에 "이걸 쓸 사람이 있는가" 확인

### 할 일

1. **타겟 재정의**: "CSV로 퍼널/리텐션을 분석하고 싶은 사람"이 누구인지 구체화
   - 후보 A: 초기 스타트업 PM (Amplitude 도입 전, 이벤트 로그만 있는 상태)
   - 후보 B: 마케터 (GA4 raw 데이터 export → 퍼널 분석 필요)
   - 후보 C: 데이터 분석가 (빠른 ad-hoc 분석 도구 필요)

2. **5~10명 인터뷰**: 커뮤니티(디스퀘어, 프로덕트 오너 모임 등)에서 찾기
   - 질문: "마지막으로 퍼널/리텐션 분석한 게 언제? 어떤 도구로? 불편한 점은?"
   - 결과에 따라 가격, 기능 우선순위 조정

3. **랜딩 페이지 가짜 수치 제거** → "얼리 액세스" 포지셔닝으로 전환

### 판단 기준

- 10명 중 3명 이상이 "돈 내고 쓸 의향 있다" → Phase 1 진행
- 아니면 → 피벗 또는 포트폴리오로 전환

---

## Phase 1: 보안 & 신뢰 기반 (수익화 전제조건)

**기간**: 1주
**현재 코드 영향**: 4~5개 파일 수정/생성

### 1-1. Gemini API 키 서버사이드 이동

**문제**: `geminiClient.ts`에서 `VITE_GEMINI_API_KEY`를 직접 사용 → 빌드 번들에 API 키 노출

**해결**: Supabase Edge Function으로 프록시

```
[클라이언트] → [Supabase Edge Function /ai-proxy] → [Gemini API]
                    ↑ API 키는 여기서만 보유
```

- 파일: `supabase/functions/ai-proxy/index.ts` (신규)
- 파일: `lib/geminiClient.ts` (수정 — fetch URL을 Edge Function으로 변경)
- Rate limiting: Edge Function 내에서 유저당 일 20회 제한

### 1-2. 커스텀 도메인

- Vercel에서 커스텀 도메인 연결 (예: `app.fre-analytics.com`)
- `.vercel.app` 서브도메인은 신뢰도 0

### 1-3. 법적 문서

- 파일: `pages/PrivacyPage.tsx` (신규)
- 파일: `pages/TermsPage.tsx` (신규)
- 라우터에 `/privacy`, `/terms` 추가
- 랜딩 페이지 푸터 링크 연결 (`href="#"` 제거)

### 1-4. 에러 모니터링

- Sentry 무료 플랜 연동 (월 5K 이벤트)
- 파일: `lib/sentry.ts` (신규), `index.tsx` (수정)

### 완료 기준
- [ ] API 키가 클라이언트 번들에 없음 (빌드 후 grep 확인)
- [ ] 커스텀 도메인 접속 가능
- [ ] /privacy, /terms 페이지 존재
- [ ] Sentry 에러 수신 확인

---

## Phase 2: Free/Pro 기능 게이팅 + 결제

**기간**: 2주
**핵심**: 돈을 받을 수 있는 구조를 만든다

### 2-1. 유저 플랜 시스템

**DB 변경**:
```sql
-- fre_user_profiles 테이블 추가
CREATE TABLE fre_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',       -- 'free' | 'pro'
  plan_started_at TIMESTAMPTZ,
  toss_customer_key TEXT,
  toss_billing_key TEXT,
  subscription_status TEXT DEFAULT 'none',
  next_billing_date DATE,
  ai_calls_today INT DEFAULT 0,
  ai_calls_reset_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fre_user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile" ON fre_user_profiles
  FOR ALL USING (auth.uid() = id);
```

**코드**:
- 파일: `lib/subscriptionManager.ts` (신규 — 플랜 조회/제한 체크)
- 파일: `context/AuthContext.tsx` (수정 — userProfile 포함)
- 파일: `hooks/usePlanGate.ts` (신규 — 기능별 접근 제어)

### 2-2. Free vs Pro 제한

| 기능 | Free | Pro (₩29,000/월) |
|------|------|-------------------|
| CSV 업로드 행 수 | 10,000행 | 500,000행 |
| AI 인사이트 | 일 3회 | 일 50회 |
| 프로젝트 수 | 1개 | 무제한 |
| 리포트 내보내기 | 워터마크 포함 PNG | 워터마크 없음 + PDF |
| 분석 저장 | 최근 5개 | 무제한 |
| 세그먼트 비교 | 2개 세그먼트 | 무제한 |

참고: 가격은 ₩39,000 → ₩29,000으로 낮춤 (초기 진입 장벽 낮추기)

### 2-3. TossPayments 결제 연동

**구조**:
```
[Pro 버튼 클릭] → [TossPayments SDK v2 빌링 인증 창]
    → [카드 등록 + 본인인증] → [successUrl 리다이렉트]
    → [Edge Function: 빌링키 발급 + 첫 결제 승인]
    → [fre_user_profiles.plan = 'pro' 업데이트]
```

**파일**:
- `supabase/functions/issue-billing/index.ts` (신규 — 빌링키 발급 + 첫 결제)
- `supabase/functions/toss-webhook/index.ts` (신규 — Webhook 처리)
- `pages/PricingPage.tsx` (신규 — 독립 결제 페이지)
- `pages/BillingSuccessPage.tsx` (신규 — 빌링 성공 콜백)
- `components/UpgradeModal.tsx` (신규 — 제한 도달 시 팝업)
- `components/PlanBadge.tsx` (신규 — 사이드바에 현재 플랜 표시)

### 2-4. ProtectedRoute 수정

```typescript
// 현재: 모든 유저 통과
return <Outlet />;

// 변경: 게스트는 기본 기능만, 로그인 유저는 플랜에 따라
// → 게스트 모드 유지하되, 저장/AI/내보내기 시 로그인 유도
```

### 완료 기준
- [ ] Free 유저가 10,001행 업로드 시 업그레이드 모달 표시
- [ ] TossPayments 테스트 결제 → DB에 plan='pro' 반영
- [ ] Pro 유저가 AI 인사이트 50회 사용 가능
- [ ] 구독 취소 시 plan='free'로 다운그레이드

---

## Phase 3: 온보딩 & 첫 경험 개선

**기간**: 1주
**목적**: 첫 방문자가 30초 안에 가치를 느끼게

### 3-1. 샘플 데이터 원클릭 로드

- 파일: `lib/sampleData.ts` (신규 — 이커머스 + SaaS 샘플 2종)
- 파일: `pages/DataImport.tsx` (수정 — "샘플 데이터로 체험하기" 버튼)
- 샘플 데이터: 2,000행 정도의 현실적인 이벤트 로그
  - 이커머스: page_view → add_to_cart → checkout → purchase
  - SaaS: signup → onboarding → feature_use → subscription

### 3-2. 빈 상태 개선

현재 Dashboard에서 데이터 없으면 "데이터를 업로드하여 시작하세요" 한 줄뿐.

변경:
```
┌─────────────────────────────────────┐
│  🚀 시작하기                        │
│                                      │
│  [샘플 데이터로 체험]  [CSV 업로드]  │
│                                      │
│  또는 2분 가이드 보기 →              │
└─────────────────────────────────────┘
```

### 3-3. 인터랙티브 가이드

- 파일: `components/OnboardingTour.tsx` (신규)
- 첫 로그인 시 3단계 하이라이트 투어:
  1. "여기서 CSV를 업로드하세요"
  2. "컬럼이 자동 매핑됩니다"
  3. "퍼널, 리텐션, AI 인사이트를 확인하세요"
- 라이브러리: 없이 직접 구현 (tooltip + overlay, ~100줄)

### 3-4. 랜딩 페이지 정직한 수치

```typescript
// Before (거짓말)
{ label: '활성 사용자', value: '500+' }

// After (정직한 얼리 스테이지 포지셔닝)
// 또는 아예 stats 섹션 제거, 대신 스크린샷/GIF 데모
```

### 완료 기준
- [ ] 첫 방문자가 클릭 1번으로 샘플 데이터 로드 → 대시보드에 차트 표시
- [ ] 빈 Dashboard에서 명확한 CTA 버튼 2개 존재
- [ ] 랜딩 페이지에 가짜 수치 없음

---

## Phase 4: 핵심 기능 강화

**기간**: 2주
**목적**: Pro 요금제의 가치를 올린다

### 4-1. PDF 리포트 내보내기 (Pro 전용)

- 현재 PNG만 지원. PDF는 Pro 차별화 요소.
- 파일: `lib/reportEngine.ts` (수정 — PDF 출력 추가)
- 라이브러리: jsPDF 또는 기존 html-to-canvas 확장

### 4-2. 분석 결과 클라우드 저장

- 현재 `fre_analysis_snapshots` 테이블은 있지만 UI에서 활용 안됨
- 파일: `components/SaveAnalysisButton.tsx` (이미 있음 → 실제 동작하도록 연결)
- 파일: `pages/Dashboard.tsx` (수정 — 저장된 분석 불러오기)

### 4-3. 공유 가능한 리포트 URL (Pro 전용)

```
https://app.fre-analytics.com/shared/[snapshot-id]
```

- 파일: `pages/SharedReport.tsx` (신규)
- 라우터: `/shared/:id` 추가
- Supabase RLS에 public read 정책 추가 (shared flag 있는 스냅샷만)

### 4-4. AI 대화 개선

- 현재 단발성 Q&A. 문맥 유지는 되지만 UX가 채팅 형태가 아님.
- 파일: `components/AskAIPanel.tsx` (수정 — 채팅 UI 개선)
- 추천 질문 3개 표시 ("이탈률이 높은 원인은?", "D7 리텐션 개선 방법은?" 등)

### 완료 기준
- [ ] Pro 유저가 PDF 리포트 다운로드 가능
- [ ] 분석 결과 저장 → 재접속 시 불러오기
- [ ] 공유 URL로 비로그인 유저도 리포트 열람 가능

---

## Phase 5: 운영 & 성장 인프라

**기간**: 1주

### 5-1. Google Analytics 4 연동 (자체 서비스 추적)

- 유저 행동 추적: 페이지뷰, CSV 업로드, 퍼널 계산, Pro 전환 등
- 파일: `lib/analytics.ts` (신규), `index.html` (수정 — gtag 스크립트)

### 5-2. Vercel Analytics

- Web Vitals (LCP, CLS, INP) 자동 수집
- Vercel 대시보드에서 무료 확인

### 5-3. 트랜잭션 이메일

- Supabase Auth 이메일 커스터마이징 (회원가입 확인, 비밀번호 재설정)
- 결제 성공/실패 알림 (TossPayments webhook → 이메일)

### 5-4. GitHub Actions CI

```yaml
# .github/workflows/ci.yml
- vitest run (98개 테스트)
- vite build (빌드 성공 확인)
- PR 생성 시 자동 실행
```

### 완료 기준
- [ ] GA4에서 유저 이벤트 수신 확인
- [ ] PR 생성 시 자동 테스트 실행
- [ ] 회원가입 시 커스텀 이메일 발송

---

## Phase 6: 런칭 & 초기 마케팅

**기간**: 1주

### 6-1. 런칭 채널

| 채널 | 행동 |
|------|------|
| Product Hunt | 한국어 + 영어 런칭 |
| 디스퀘어 | PM/데이터 분석 커뮤니티 |
| Twitter/X | 빌딩 과정 공유 |
| Indie Hackers | 영어권 타겟 |

### 6-2. SEO 기본

- `index.html` meta tags (og:title, og:description, og:image)
- 랜딩 페이지에 구조화된 데이터 (JSON-LD)
- 블로그 페이지 (옵션 — "CSV로 퍼널 분석하는 법" 등)

### 6-3. 초기 프로모션

- 런칭 후 2주간 Pro 50% 할인 (₩14,500/월)
- 또는 "피드백 주면 3개월 Pro 무료" (초기 유저 확보)

---

## 로드맵 요약

```
Phase 0: PMF 검증           1주    코드 X     → "쓸 사람이 있는가?"
Phase 1: 보안 & 신뢰        1주    4~5 파일   → "돈 받을 자격"
Phase 2: 결제 + 기능 게이팅  2주    10+ 파일   → "돈 받는 구조"
Phase 3: 온보딩              1주    5~6 파일   → "첫 경험 → 전환"
Phase 4: 핵심 기능 강화      2주    6~8 파일   → "Pro 가치 증명"
Phase 5: 운영 인프라          1주    3~4 파일   → "지속 가능한 운영"
Phase 6: 런칭               1주    코드 소량   → "세상에 알리기"
─────────────────────────────────────────────────
총 예상: 8~9주
```

## 우선순위 매트릭스

```
               긴급함
          높음 ──────── 낮음
    높  │ Phase 1     Phase 5  │
    음  │ (보안)      (운영)    │
        │                      │
 영  │ Phase 2     Phase 4  │
 향  │ (결제)      (기능)    │
 력  │                      │
    낮  │ Phase 0     Phase 6  │
    음  │ (검증)      (런칭)    │
        └──────────────────────┘

실행 순서: 0 → 1 → 2 → 3 → 4 → 5 → 6
Phase 0의 결과에 따라 1~6 조정 가능
```

## 기술 스택 추가 사항

| 항목 | 현재 | 추가 필요 |
|------|------|----------|
| 결제 | 없음 | TossPayments (SDK v2 + 빌링키 자동결제) |
| API 프록시 | 없음 | Supabase Edge Functions |
| PDF | 없음 | jsPDF 또는 @react-pdf/renderer |
| 모니터링 | 없음 | Sentry (무료), Vercel Analytics |
| 추적 | 없음 | GA4 |
| CI | 없음 | GitHub Actions |
| 이메일 | 없음 | Supabase Auth 커스텀 or Resend |

## 비용 추정 (월)

| 항목 | 비용 |
|------|------|
| Vercel (Hobby) | $0 |
| Supabase (Free) | $0 (500MB DB, 50K auth users) |
| TossPayments | 건당 수수료 (계약에 따라 상이) |
| Sentry (Free) | $0 |
| 커스텀 도메인 | ~₩15,000/년 |
| Gemini API | 무료 티어 (분당 15 요청) |
| **총** | **~₩0/월** (유저 적을 때) |

수익 손익분기: Pro 유저 **1명**이면 인프라 비용 커버.

---

## 각 Phase 완료 후 목표 점수

| Phase | 완료 후 점수 | 핵심 변화 |
|-------|:-----------:|----------|
| 현재 | 35/100 | - |
| Phase 0 | 35/100 | PMF 확인 (점수 변화 없음, 방향성 확보) |
| Phase 1 | 50/100 | 보안 해결, 법적 문서, 도메인 |
| Phase 2 | 70/100 | 결제 가능, Free/Pro 분리 |
| Phase 3 | 78/100 | 첫 경험 개선, 전환율 상승 |
| Phase 4 | 85/100 | Pro 가치 증명 |
| Phase 5 | 88/100 | 운영 안정화 |
| Phase 6 | 90/100 | 런칭 완료, 첫 매출 |
