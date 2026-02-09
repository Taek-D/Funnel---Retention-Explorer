# Design: Security & Trust (수익화 로드맵 Phase 1)

> **Feature**: security-trust
> **Plan Reference**: `docs/01-plan/features/security-trust.plan.md`
> **Created**: 2026-02-09
> **Status**: Design

---

## 1. Implementation Design

### ST-1: Gemini API 프록시 (Supabase Edge Function)

#### 1-1-1. Edge Function 생성 (`supabase/functions/ai-proxy/index.ts`)

Supabase Edge Function은 **프로젝트 루트가 아닌 React 프론트엔드 디렉토리 내**에 생성한다. 경로: `funnel-&-retention-explorer frontend/supabase/functions/ai-proxy/index.ts`

```typescript
// Deno runtime (Supabase Edge Functions 표준)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. JWT 인증 확인
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: '인증이 필요합니다.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. Supabase 클라이언트로 유저 검증
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: '유효하지 않은 인증입니다.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. 요청 body 파싱
  const body = await req.json();

  // 4. Gemini API 호출
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI 서비스가 설정되지 않았습니다.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const GEMINI_MODEL = 'gemini-2.0-flash';
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const geminiData = await geminiResponse.json();

  return new Response(JSON.stringify(geminiData), {
    status: geminiResponse.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
```

**핵심 설계 결정**:
- JWT 필수: 비로그인 유저는 AI 기능 사용 불가 (로그인 유도)
- Rate limiting은 이 Phase에서 생략 (Phase 2에서 fre_user_profiles.ai_calls_today로 구현)
- body를 그대로 프록시 (클라이언트 구조 변경 최소화)

#### 1-1-2. geminiClient.ts 수정

```typescript
// Before (위험):
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ...;
fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, { ... });

// After (안전):
import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const AI_PROXY_URL = `${SUPABASE_URL}/functions/v1/ai-proxy`;

// generateContent 함수 내부:
// 1. supabase가 null이면 에러 반환 (Supabase 미설정)
// 2. supabase.auth.getSession()으로 현재 세션 토큰 가져오기
// 3. 토큰이 없으면 "로그인이 필요합니다" 에러 반환
// 4. fetch(AI_PROXY_URL, { headers: { Authorization: `Bearer ${token}` }, body })
```

**제거 대상**:
- `VITE_GEMINI_API_KEY` 환경변수 참조 전체
- `GEMINI_API_URL` 상수 (직접 Google URL)
- `process.env.GEMINI_API_KEY` fallback

**유지 대상**:
- `GeminiMessage`, `GeminiResponse` 인터페이스 (변경 없음)
- `buildAnalysisPrompt` 함수 (변경 없음)
- `generateContent` 함수 시그니처 (변경 없음, 내부 구현만 변경)

#### 1-1-3. vite.config.ts 수정

```typescript
// 제거 (API 키가 번들에 포함되는 원인):
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}

// 변경: define 블록 자체를 삭제
```

---

### ST-2: 개인정보처리방침 페이지 (`pages/PrivacyPage.tsx`)

**구조**: 한국 개인정보보호법(PIPA) 준수 기본 구조

```
PrivacyPage
├── 헤더 (서비스명, 시행일자)
├── 1. 개인정보 수집 항목
│   ├── 이메일 주소 (회원가입 시)
│   └── 분석 데이터 (CSV 업로드 시, 클라우드 저장 선택 시)
├── 2. 개인정보 수집 및 이용 목적
├── 3. 개인정보 보유 및 이용 기간
├── 4. 개인정보 제3자 제공
│   ├── Supabase (인증, 데이터 저장)
│   └── Google Gemini AI (AI 분석 시 데이터 전송)
├── 5. 개인정보 파기 절차
├── 6. 이용자 권리 (열람, 수정, 삭제, 처리정지)
├── 7. 쿠키 사용
└── 8. 개인정보 보호 책임자
```

**디자인**:
- 기존 랜딩 페이지와 동일한 스타일 (dark theme, `bg-background`, `text-white`)
- LandingHeader 재사용
- 본문: `prose` 스타일 대신 Tailwind 직접 적용 (`text-slate-300`, `text-sm`, 섹션별 `mb-8`)
- 최대 너비: `max-w-3xl mx-auto`

---

### ST-3: 이용약관 페이지 (`pages/TermsPage.tsx`)

**구조**: SaaS 이용약관 표준

```
TermsPage
├── 헤더 (서비스명, 시행일자)
├── 1. 목적
├── 2. 용어 정의
├── 3. 서비스 이용
│   ├── 계정 생성
│   └── 게스트 이용
├── 4. 요금 및 결제 (Pro 플랜 — "추후 제공")
├── 5. 데이터 소유권 (유저가 소유)
├── 6. 서비스 제한 사항
├── 7. 면책 조항
├── 8. 서비스 변경 및 중단
└── 9. 분쟁 해결
```

**디자인**: PrivacyPage와 동일한 레이아웃

---

### ST-4: 랜딩 페이지 푸터 링크 연결

**현재 코드** (`LandingPage.tsx:292-295`):
```html
<a href="#" className="...">개인정보처리방침</a>
<a href="#" className="...">이용약관</a>
<a href="https://github.com" className="...">GitHub</a>
```

**변경**:
```tsx
<Link to="/privacy" className="...">개인정보처리방침</Link>
<Link to="/terms" className="...">이용약관</Link>
<a href="https://github.com/castletaek/Funnel---Retention-Explorer" target="_blank" rel="noopener noreferrer" className="...">GitHub</a>
```

- `<a href="#">` → `<Link to="/privacy">`, `<Link to="/terms">`
- GitHub 링크: 실제 repo URL 사용, `target="_blank"` + `rel="noopener noreferrer"`

---

### ST-5: Sentry 에러 모니터링

#### 1-5-1. 패키지 설치

```bash
npm install @sentry/react
```

#### 1-5-2. `lib/sentry.ts` (신규)

```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // DSN 미설정 시 조용히 건너뜀

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // 'development' | 'production'
    // 프로덕션에서만 에러 전송
    enabled: import.meta.env.PROD,
    // 성능 추적은 비활성화 (번들 크기 절약)
    tracesSampleRate: 0,
    // 중복 에러 제한
    maxBreadcrumbs: 50,
  });
}

export { Sentry };
```

#### 1-5-3. `index.tsx` 수정

```typescript
// 최상단에 추가 (다른 import 전):
import { initSentry } from './lib/sentry';
initSentry();
```

- Sentry init은 React 렌더링 전에 호출해야 함
- ErrorBoundary는 기존 것 유지 (Sentry.ErrorBoundary로 교체하지 않음 — 기존 UI 보존)
- 대신 `Sentry.captureException`을 ErrorBoundary의 `componentDidCatch`에서 호출

#### 1-5-4. `components/ErrorBoundary.tsx` 수정

```typescript
// componentDidCatch 추가:
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  import('../lib/sentry').then(({ Sentry }) => {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  });
}
```

- dynamic import로 Sentry를 로드하여 ErrorBoundary 자체의 번들 크기 영향 없음

#### 1-5-5. `vite.config.ts` manualChunks 업데이트

```typescript
if (id.includes('@sentry')) {
  return 'vendor-monitoring';
}
```

- @sentry/react를 별도 chunk로 분리하여 기존 vendor 크기 영향 없음

---

### ST-6: 랜딩 페이지 가짜 수치 제거

**현재** (`LandingPage.tsx:67-71`):
```typescript
const stats = [
  { label: '분석된 데이터 포인트', value: '1,000만+' },
  { label: '활성 사용자', value: '500+' },
  { label: '평균 설정 시간', value: '<2분' },
];
```

**변경**: stats 배열 및 렌더링 블록 전체 제거. 대신 "얼리 액세스" 배지로 대체.

```tsx
// stats 배열 삭제

// Hero 섹션의 stats bar (LandingPage.tsx:136-144) 제거
// 대신 간단한 소셜 프루프 텍스트:
<p className="text-slate-500 text-sm mt-8 animate-fade-up delay-400">
  얼리 액세스 — CSV 분석을 더 쉽게 만드는 중입니다
</p>
```

**추가**: CTA Banner 섹션 (line 274)의 가짜 문구도 수정

```
// Before:
"FRE Analytics로 사용자를 더 잘 이해하는 수백 개의 프로덕트 팀에 합류하세요."

// After:
"FRE Analytics로 CSV 데이터에서 퍼널과 리텐션을 분석하세요."
```

---

## 2. router.tsx 라우트 추가

```typescript
// 기존 lazy imports에 추가:
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));

// 라우트 배열에 추가 (LandingPage 다음, /login 전):
{
  path: '/privacy',
  element: <Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>,
},
{
  path: '/terms',
  element: <Suspense fallback={<PageLoader />}><TermsPage /></Suspense>,
},
```

---

## 3. Implementation Order

```
1. ST-1a: vite.config.ts에서 define 블록 제거
2. ST-1b: supabase/functions/ai-proxy/index.ts 생성
3. ST-1c: lib/geminiClient.ts 수정 (프록시 사용)
4. ST-5a: npm install @sentry/react
5. ST-5b: lib/sentry.ts 생성
6. ST-5c: index.tsx에 initSentry 추가
7. ST-5d: components/ErrorBoundary.tsx에 captureException 추가
8. ST-5e: vite.config.ts에 vendor-monitoring chunk 추가
9. ST-2: pages/PrivacyPage.tsx 생성
10. ST-3: pages/TermsPage.tsx 생성
11. ST-4a: router.tsx에 /privacy, /terms 라우트 추가
12. ST-4b: LandingPage.tsx 푸터 링크 수정
13. ST-6a: LandingPage.tsx stats 배열 및 렌더링 제거
14. ST-6b: LandingPage.tsx CTA 배너 문구 수정
```

---

## 4. Check Items (Gap Analysis 용)

### ST-1: Gemini API 프록시

| ID | Check Item | 검증 방법 |
|----|-----------|-----------|
| ST-1.1 | `supabase/functions/ai-proxy/index.ts` 파일이 존재한다 | 파일 존재 확인 |
| ST-1.2 | Edge Function이 CORS preflight (OPTIONS)를 처리한다 | 코드에서 `req.method === 'OPTIONS'` 확인 |
| ST-1.3 | Edge Function이 Authorization 헤더로 JWT를 검증한다 | `supabase.auth.getUser()` 호출 확인 |
| ST-1.4 | Edge Function이 `Deno.env.get('GEMINI_API_KEY')`로 서버사이드 키를 사용한다 | 코드에서 확인 |
| ST-1.5 | Edge Function이 Gemini API에 body를 프록시한다 | fetch 호출 확인 |
| ST-1.6 | `geminiClient.ts`에서 `VITE_GEMINI_API_KEY` 참조가 제거되었다 | grep으로 확인 |
| ST-1.7 | `geminiClient.ts`에서 `GEMINI_API_URL` (직접 Google URL)이 제거되었다 | grep으로 확인 |
| ST-1.8 | `geminiClient.ts`가 Supabase Edge Function URL로 fetch한다 | `functions/v1/ai-proxy` 문자열 확인 |
| ST-1.9 | `geminiClient.ts`가 supabase session 토큰을 Authorization 헤더에 포함한다 | 코드에서 확인 |
| ST-1.10 | `geminiClient.ts`에서 비로그인 시 에러 메시지를 반환한다 | 세션 없음 → 에러 분기 확인 |
| ST-1.11 | `vite.config.ts`에서 `process.env.API_KEY` define이 제거되었다 | 코드에서 확인 |
| ST-1.12 | `vite.config.ts`에서 `process.env.GEMINI_API_KEY` define이 제거되었다 | 코드에서 확인 |
| ST-1.13 | `GeminiMessage`, `GeminiResponse` 인터페이스가 유지된다 | export 확인 |
| ST-1.14 | `buildAnalysisPrompt` 함수가 변경 없이 유지된다 | 함수 존재 확인 |
| ST-1.15 | `generateContent` 함수 시그니처가 유지된다 (prompt, systemInstruction?, history?) | 시그니처 확인 |

### ST-2: 개인정보처리방침 페이지

| ID | Check Item | 검증 방법 |
|----|-----------|-----------|
| ST-2.1 | `pages/PrivacyPage.tsx` 파일이 존재한다 | 파일 존재 확인 |
| ST-2.2 | `PrivacyPage` 컴포넌트가 named export된다 | export 확인 |
| ST-2.3 | 개인정보 수집 항목 섹션이 존재한다 | 텍스트 확인 |
| ST-2.4 | 제3자 제공 섹션 (Supabase, Gemini)이 존재한다 | 텍스트 확인 |
| ST-2.5 | LandingHeader를 사용한다 | import 확인 |
| ST-2.6 | 다크 테마 스타일 (`bg-background`)을 사용한다 | className 확인 |

### ST-3: 이용약관 페이지

| ID | Check Item | 검증 방법 |
|----|-----------|-----------|
| ST-3.1 | `pages/TermsPage.tsx` 파일이 존재한다 | 파일 존재 확인 |
| ST-3.2 | `TermsPage` 컴포넌트가 named export된다 | export 확인 |
| ST-3.3 | 서비스 이용 조건 섹션이 존재한다 | 텍스트 확인 |
| ST-3.4 | 데이터 소유권 섹션이 존재한다 | 텍스트 확인 |
| ST-3.5 | LandingHeader를 사용한다 | import 확인 |
| ST-3.6 | 다크 테마 스타일 (`bg-background`)을 사용한다 | className 확인 |

### ST-4: 푸터 링크

| ID | Check Item | 검증 방법 |
|----|-----------|-----------|
| ST-4.1 | 개인정보처리방침 링크가 `/privacy`로 연결된다 | `to="/privacy"` 확인 |
| ST-4.2 | 이용약관 링크가 `/terms`로 연결된다 | `to="/terms"` 확인 |
| ST-4.3 | `href="#"` 더미 링크가 없다 | grep `href="#"` 결과 0 |
| ST-4.4 | react-router-dom `Link`를 사용한다 | import 확인 (이미 사용 중) |
| ST-4.5 | GitHub 링크에 `target="_blank"` + `rel="noopener noreferrer"`가 있다 | 속성 확인 |

### ST-5: Sentry 에러 모니터링

| ID | Check Item | 검증 방법 |
|----|-----------|-----------|
| ST-5.1 | `@sentry/react`가 package.json dependencies에 있다 | grep 확인 |
| ST-5.2 | `lib/sentry.ts` 파일이 존재한다 | 파일 존재 확인 |
| ST-5.3 | `initSentry` 함수가 `Sentry.init()`을 호출한다 | 코드 확인 |
| ST-5.4 | DSN을 `VITE_SENTRY_DSN` 환경변수에서 읽는다 | `import.meta.env.VITE_SENTRY_DSN` 확인 |
| ST-5.5 | DSN 없을 때 init을 건너뛴다 (graceful skip) | `if (!dsn) return` 확인 |
| ST-5.6 | 프로덕션에서만 활성화된다 (`enabled: import.meta.env.PROD`) | 코드 확인 |
| ST-5.7 | `index.tsx`에서 `initSentry()`가 렌더링 전에 호출된다 | import 순서 확인 |
| ST-5.8 | `ErrorBoundary.tsx`에서 `Sentry.captureException`을 호출한다 | `componentDidCatch` 확인 |
| ST-5.9 | `vite.config.ts`에 `vendor-monitoring` manualChunk이 있다 | `@sentry` 분기 확인 |

### ST-6: 가짜 수치 제거

| ID | Check Item | 검증 방법 |
|----|-----------|-----------|
| ST-6.1 | `stats` 배열 (가짜 수치)이 제거되었다 | `1,000만+` grep 결과 0 |
| ST-6.2 | `500+` 활성 사용자 수치가 제거되었다 | `500+` grep 결과 0 |
| ST-6.3 | Hero 섹션의 stats bar 렌더링이 제거되었다 | `stats.map` grep 결과 0 |
| ST-6.4 | "얼리 액세스" 또는 대체 문구가 존재한다 | 텍스트 확인 |
| ST-6.5 | CTA 배너의 "수백 개의 프로덕트 팀" 문구가 제거되었다 | grep 결과 0 |

### 라우팅 & 빌드

| ID | Check Item | 검증 방법 |
|----|-----------|-----------|
| RT-1 | `router.tsx`에 `/privacy` 라우트가 있다 | path 확인 |
| RT-2 | `router.tsx`에 `/terms` 라우트가 있다 | path 확인 |
| RT-3 | PrivacyPage가 React.lazy로 로드된다 | `lazy(() => import` 확인 |
| RT-4 | TermsPage가 React.lazy로 로드된다 | `lazy(() => import` 확인 |
| RT-5 | `vite build`가 에러 없이 성공한다 | exit code 0 |
| RT-6 | Vite 500KB 경고가 없다 (모든 chunk < 500KB) | 빌드 출력 확인 |
| RT-7 | `vitest run`이 기존 98개 테스트를 모두 통과한다 | 테스트 결과 확인 |
| RT-8 | 빌드 결과물에서 `GEMINI_API_KEY` 문자열이 없다 | grep 확인 |

---

## 5. File Change Summary

| # | 파일 | 변경 유형 | 변경 내용 |
|---|------|-----------|----------|
| 1 | `supabase/functions/ai-proxy/index.ts` | 신규 | Deno Edge Function: JWT 인증 + Gemini API 프록시 |
| 2 | `lib/geminiClient.ts` | 수정 | VITE_GEMINI_API_KEY 제거, Supabase Edge Function 프록시 사용 |
| 3 | `vite.config.ts` | 수정 | define 블록 제거 + vendor-monitoring chunk 추가 |
| 4 | `pages/PrivacyPage.tsx` | 신규 | 개인정보처리방침 정적 페이지 |
| 5 | `pages/TermsPage.tsx` | 신규 | 이용약관 정적 페이지 |
| 6 | `router.tsx` | 수정 | /privacy, /terms 라우트 추가 (lazy loading) |
| 7 | `pages/LandingPage.tsx` | 수정 | 가짜 수치 제거, 푸터 링크 연결, CTA 문구 수정 |
| 8 | `lib/sentry.ts` | 신규 | Sentry 초기화 함수 |
| 9 | `index.tsx` | 수정 | initSentry() 호출 추가 |
| 10 | `components/ErrorBoundary.tsx` | 수정 | componentDidCatch에서 Sentry.captureException 호출 |
| 11 | `package.json` | 수정 | @sentry/react 의존성 추가 |

**신규 4개, 수정 7개 = 총 11개 파일**

---

## 6. Check Items 총계

| 카테고리 | 항목 수 |
|----------|:-------:|
| ST-1 (API 프록시) | 15 |
| ST-2 (개인정보처리방침) | 6 |
| ST-3 (이용약관) | 6 |
| ST-4 (푸터 링크) | 5 |
| ST-5 (Sentry) | 9 |
| ST-6 (가짜 수치) | 5 |
| RT (라우팅 & 빌드) | 8 |
| **총계** | **54** |
