# Plan: Security & Trust (수익화 로드맵 Phase 1)

> **Feature**: security-trust
> **Level**: Dynamic
> **Created**: 2026-02-09
> **Status**: Plan
> **Reference**: `docs/MONETIZATION-ROADMAP.md` Phase 1

---

## 1. Overview

수익화 전제조건인 보안 및 신뢰 기반을 구축한다. 현재 서비스는 수익화 준비도 35/100으로, API 키 노출, 법적 문서 부재, 에러 모니터링 부재 등 돈을 받을 자격이 없는 상태이다. 이 Phase에서는 "돈 받을 자격"을 만드는 최소 요건을 충족시킨다.

### 목표 점수
- **Before**: 35/100
- **After**: 50/100 (+15)

---

## 2. Problem Statement

### 2-1. Gemini API 키 클라이언트 노출 (Critical)

**현재 상태**: `lib/geminiClient.ts`에서 `VITE_GEMINI_API_KEY`를 직접 사용. Vite의 `import.meta.env.VITE_*` 변수는 빌드 시 번들에 인라인되므로, 배포된 JS 파일에서 API 키를 추출할 수 있음.

```typescript
// 현재 코드 (위험)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ...;
fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, { ... });
```

**위험**: 누구나 DevTools에서 API 키를 복사해 무제한 사용 가능. Google 요금 폭탄 위험.

### 2-2. 법적 문서 부재

- 개인정보처리방침 페이지 없음
- 이용약관 페이지 없음
- 랜딩 페이지 푸터의 링크가 모두 `href="#"` (dummy)
- 결제를 받으려면 법적으로 필수

### 2-3. 에러 모니터링 부재

- 프로덕션 에러가 유저 신고 전까지 감지 불가
- ErrorBoundary는 있으나 외부 알림 연동 없음
- 유료 서비스에서 에러를 모르고 방치하면 신뢰 하락

### 2-4. 랜딩 페이지 신뢰도 이슈

- `LandingPage.tsx`에 가짜 수치: `'활성 사용자': '500+'`, `'분석된 데이터 포인트': '1,000만+'`
- `.vercel.app` 서브도메인은 전문성 인상을 주지 않음

---

## 3. Scope

### In Scope (구현 대상)

| ID | Task | Priority | 영향 파일 |
|----|------|----------|-----------|
| ST-1 | Gemini API 키를 Supabase Edge Function으로 프록시 | Critical | `supabase/functions/ai-proxy/index.ts` (신규), `lib/geminiClient.ts` (수정) |
| ST-2 | 개인정보처리방침 페이지 | High | `pages/PrivacyPage.tsx` (신규), `router.tsx` (수정) |
| ST-3 | 이용약관 페이지 | High | `pages/TermsPage.tsx` (신규), `router.tsx` (수정) |
| ST-4 | 랜딩 페이지 푸터 링크 연결 | Medium | `pages/LandingPage.tsx` (수정) |
| ST-5 | Sentry 에러 모니터링 연동 | Medium | `lib/sentry.ts` (신규), `index.tsx` (수정), `package.json` (수정) |
| ST-6 | 랜딩 페이지 가짜 수치 제거 | Medium | `pages/LandingPage.tsx` (수정) |

### Out of Scope (이 Phase에서 안 함)

- 커스텀 도메인 연결 (Vercel 대시보드에서 수동 설정, 코드 변경 아님)
- Stripe 결제 연동 (Phase 2)
- Free/Pro 기능 게이팅 (Phase 2)
- 온보딩 개선 (Phase 3)

---

## 4. Technical Approach

### ST-1: Gemini API 프록시 (Supabase Edge Function)

**아키텍처**:
```
[클라이언트 geminiClient.ts]
    → POST /functions/v1/ai-proxy (with Supabase Auth JWT)
    → [Supabase Edge Function]
        → 인증 확인 (JWT 검증)
        → Rate limit 체크 (옵션: 유저당 일 20회)
        → Gemini API 호출 (서버사이드 API 키)
    → [응답 반환]
```

**핵심 변경**:
1. `supabase/functions/ai-proxy/index.ts` 신규 생성
   - Deno runtime (Supabase Edge Functions 표준)
   - `GEMINI_API_KEY`를 Supabase Secrets에서 읽기
   - 요청 body를 그대로 Gemini API에 전달 (프록시 패턴)
   - CORS 헤더 설정

2. `lib/geminiClient.ts` 수정
   - `VITE_GEMINI_API_KEY` 환경변수 참조 제거
   - fetch URL을 Supabase Edge Function 엔드포인트로 변경
   - Supabase client의 auth session token을 Authorization 헤더에 포함
   - 게스트 유저(비로그인)는 AI 기능 비활성화 (로그인 유도)

**환경변수 변경**:
- 제거: `VITE_GEMINI_API_KEY` (`.env.local`에서)
- 추가: `GEMINI_API_KEY` (Supabase Secrets에)

### ST-2, ST-3: 법적 문서 페이지

- 한국 개인정보보호법 기반 개인정보처리방침
- SaaS 이용약관 표준 구조
- 정적 컨텐츠 페이지 (데이터 fetch 없음)
- React.lazy로 로드 (기존 코드 스플리팅 패턴 유지)

### ST-4: 랜딩 페이지 푸터 링크

- `href="#"` → `/privacy`, `/terms`로 변경
- react-router-dom `Link` 컴포넌트 사용

### ST-5: Sentry 연동

- `@sentry/react` 패키지 설치
- `lib/sentry.ts`에서 init + React ErrorBoundary 래핑
- DSN은 `VITE_SENTRY_DSN` 환경변수
- 무료 플랜 (월 5,000 이벤트)

### ST-6: 가짜 수치 제거

- stats 섹션의 하드코딩된 숫자 제거
- "얼리 액세스" 포지셔닝으로 대체 또는 stats 섹션 자체를 GIF 데모/스크린샷으로 교체

---

## 5. Implementation Order

```
ST-1 (API 프록시) ─────────────────────── [Critical, 독립적]
ST-5 (Sentry) ─────────────────────────── [Medium, 독립적]
ST-2 (개인정보처리방침) ──┐
ST-3 (이용약관) ──────────┼── ST-4 (푸터 링크 연결)
ST-6 (가짜 수치 제거) ────┘
```

ST-1과 ST-5는 독립적이므로 병렬 작업 가능.
ST-4는 ST-2/ST-3 완료 후 진행 (링크 대상 페이지가 필요).

---

## 6. Files Impact Summary

| 구분 | 파일 | 변경 유형 |
|------|------|-----------|
| 신규 | `supabase/functions/ai-proxy/index.ts` | Edge Function (Deno) |
| 신규 | `pages/PrivacyPage.tsx` | 개인정보처리방침 |
| 신규 | `pages/TermsPage.tsx` | 이용약관 |
| 신규 | `lib/sentry.ts` | Sentry 초기화 |
| 수정 | `lib/geminiClient.ts` | API 프록시로 전환 |
| 수정 | `router.tsx` | /privacy, /terms 라우트 추가 |
| 수정 | `pages/LandingPage.tsx` | 가짜 수치 제거, 푸터 링크 연결 |
| 수정 | `index.tsx` | Sentry init 추가 |
| 수정 | `package.json` | @sentry/react 의존성 추가 |

**신규 4개, 수정 5개 = 총 9개 파일**

---

## 7. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase Edge Function 배포 실패 | AI 기능 중단 | 로컬에서 `supabase functions serve`로 충분히 테스트 |
| Edge Function 콜드 스타트 지연 | AI 응답 느려짐 | 기존 직접 호출 대비 +200~500ms 예상, 수용 가능 |
| Sentry 번들 사이즈 증가 | 빌드 경고 | @sentry/react ~30KB gzipped, manualChunks에 vendor-monitoring 추가 |
| 게스트 유저 AI 기능 차단 | 이탈 | 일 3회 무료 체험 허용 (IP 기반 또는 localStorage) |

---

## 8. Acceptance Criteria

- [ ] `vite build` 후 번들에서 `GEMINI_API_KEY` grep 시 결과 없음
- [ ] AI 프록시를 통한 Gemini 호출이 정상 동작
- [ ] `/privacy` 페이지 접속 시 개인정보처리방침 표시
- [ ] `/terms` 페이지 접속 시 이용약관 표시
- [ ] 랜딩 페이지 푸터의 모든 링크가 동작 (dummy `#` 없음)
- [ ] Sentry DSN 설정 후 에러 이벤트 수신 확인
- [ ] 랜딩 페이지에 가짜 수치 없음
- [ ] 기존 테스트 98/98 전체 통과
- [ ] 빌드 성공 (Vite 500KB 경고 없음)

---

## 9. Dependencies

| 의존성 | 상태 | 비고 |
|--------|------|------|
| Supabase CLI (Edge Function 배포) | 설치 필요 | `npx supabase functions deploy` |
| Supabase Secrets 설정 | 수동 | `supabase secrets set GEMINI_API_KEY=...` |
| @sentry/react npm 패키지 | 설치 필요 | `npm install @sentry/react` |
| Sentry 프로젝트 생성 | 수동 | sentry.io에서 무료 계정 생성 |
| 커스텀 도메인 (DNS) | Out of Scope | Vercel 대시보드에서 별도 설정 |
