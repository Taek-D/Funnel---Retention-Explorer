# Funnel & Retention Explorer

CSV 기반 퍼널/리텐션/세그먼트/구독 분석 SaaS 대시보드입니다.
두 개의 코드베이스(Vanilla JS 레거시 + React 프론트엔드)로 구성되어 있습니다.

---

## React 프론트엔드 (주력)

**경로**: `funnel-&-retention-explorer frontend/`

### 기술 스택

- **언어**: TypeScript 5.8 + React 19
- **빌드**: Vite 6
- **스타일**: Tailwind CSS (CDN, index.html의 tailwind.config 참조)
- **차트**: Recharts 3
- **라우팅**: react-router-dom 7
- **CSV 파싱**: papaparse
- **인증/DB**: Supabase (Auth + PostgreSQL)
- **AI**: Gemini 2.0 Flash API
- **아이콘**: Lucide React (components/Icons.tsx에서 re-export)
- **테스트**: Vitest
- **배포**: Vercel (main 브랜치 push 시 자동 배포)
- **패키지 매니저**: npm

### 프로젝트 구조

```
funnel-&-retention-explorer frontend/
├── index.html          # Tailwind 설정 + 커스텀 CSS
├── index.tsx           # React 엔트리포인트 (Provider 계층)
├── router.tsx          # createBrowserRouter 라우트 정의
├── types/index.ts      # 전체 TypeScript 인터페이스 (20+)
├── types.ts            # re-export (하위 호환)
├── lib/                # 순수 TypeScript 모듈 (비즈니스 로직)
│   ├── csvParser.ts        # CSV 파싱 (papaparse)
│   ├── dataProcessor.ts    # 데이터 처리 + 자동 컬럼 매핑
│   ├── columnValueDetector.ts # 값 기반 컬럼 타입 추론
│   ├── funnelEngine.ts     # 퍼널 분석 엔진
│   ├── retentionEngine.ts  # 리텐션 분석 엔진
│   ├── segmentEngine.ts    # 세그먼트 비교 엔진
│   ├── insightsEngine.ts   # 인사이트 생성
│   ├── subscriptionEngine.ts # 구독 분석
│   ├── reportEngine.ts     # PDF/리포트 생성
│   ├── geminiClient.ts     # Gemini AI 클라이언트
│   ├── supabase.ts         # Supabase 클라이언트
│   ├── supabaseData.ts     # DB CRUD 함수
│   ├── constants.ts        # 상수 (이벤트 패턴, 매핑 등)
│   ├── formatters.ts       # 숫자/날짜 포맷터
│   └── recentFiles.ts      # localStorage 최근 파일
├── hooks/              # 커스텀 React Hooks
├── pages/              # 페이지 컴포넌트
├── components/         # 공유 UI 컴포넌트
├── context/            # React Context (AppContext, AuthContext)
├── public/             # 정적 파일 (favicon.svg)
└── __tests__/          # Vitest 테스트
```

### Provider 계층

```
AuthProvider > AppProvider > ToastProvider > NotificationProvider > RouterProvider
```

### 라우팅

- `/` → LandingPage, `/login` → LoginPage, `/signup` → SignupPage
- `/app/*` → ProtectedRoute → AppShell(Sidebar+Header) → 하위 페이지
- `/app/dashboard`, `/app/upload`, `/app/funnels`, `/app/retention`, `/app/segments`, `/app/insights`

### 개발 워크플로우

1. `cd "funnel-&-retention-explorer frontend"` (bash에서 `&` 이슈 주의)
2. 개발 서버: `node node_modules/vite/bin/vite.js` (port 3000)
3. 빌드: `node node_modules/vite/bin/vite.js build`
4. 테스트: `npx vitest run`
5. Vercel 자동 배포 (main 브랜치 push)

### 코딩 컨벤션

- 한국어 UI 텍스트 (사용자 대면 문자열)
- 함수명/변수명은 영어 camelCase
- `type` 선호 (`interface`는 types/index.ts에서만 사용)
- Tailwind CSS 클래스 사용 (인라인 스타일 금지)
- 테마 색상: `bg-background`, `bg-surface`, `text-accent` 등 (index.html의 tailwind.config 참조)
- 새 아이콘 추가 시 components/Icons.tsx에서 re-export
- 새 상태 추가 시 types/index.ts → context/reducer.ts → context/actions.ts 순서로 수정
- 커밋 메시지는 영어 (conventional commits: feat, fix, refactor, docs)

### 환경 변수

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase 연결
- `VITE_GEMINI_API_KEY` — Gemini AI API

### 금지 사항

- `any` 타입 사용 금지
- `var`, `eval()`, `document.write()` 사용 금지
- 인라인 스타일 금지 (Tailwind 클래스 사용)
- `console.log` 커밋 금지 (디버깅 후 제거)
- `.env.local` 파일 커밋 금지

### 주의사항

- 디렉토리명에 `&`가 포함되어 bash에서 `cd`/`npx` 사용 시 작은따옴표 필요
- 빌드 시 ~1MB 번들 크기 경고는 정상 (recharts + papaparse + supabase)
- `pdf_font_noto_sans_kr.js`는 7.9MB 바이너리 → 읽기/수정 금지

---

## Vanilla JS 레거시 (루트)

루트의 `app.js`, `charts.js`, `index.html`, `styles.css`는 레거시 코드입니다.
신규 개발은 React 프론트엔드에서 진행합니다.

### 레거시 수정 시 주의

- 외부 라이브러리는 CDN으로만 로드
- CSS 변수 체계 유지 (`--accent-primary` 등)
- Chart.js 인스턴스는 destroy 후 재생성
