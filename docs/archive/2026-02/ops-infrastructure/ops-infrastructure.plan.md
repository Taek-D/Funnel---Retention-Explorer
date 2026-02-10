# Phase 5: Operations & Growth Infrastructure

> **Feature**: ops-infrastructure
> **Phase**: Plan
> **Created**: 2026-02-10
> **Roadmap**: MONETIZATION-ROADMAP.md Phase 5

---

## Overview

서비스 운영과 성장에 필요한 인프라를 구축한다. 유저 행동 추적(GA4), 성능 모니터링(Vercel Analytics), 트랜잭션 이메일(Supabase Auth 커스터마이징), CI/CD(GitHub Actions) 4가지를 다룬다.

**목표**: 수익화 준비도 88 → 95/100 (운영 안정화)

---

## Tasks

### OI-1: Google Analytics 4 Integration

**목적**: 유저 행동 추적 — 페이지뷰, CSV 업로드, 퍼널 계산, Pro 전환 등 핵심 이벤트 수집

**구현 내용**:
- `lib/analytics.ts` (신규) — GA4 gtag wrapper 모듈
  - `initGA(measurementId)`: gtag.js 스크립트 동적 삽입 + 초기화
  - `trackPageView(path)`: 페이지뷰 이벤트
  - `trackEvent(eventName, params)`: 커스텀 이벤트
- `index.html` (수정) — gtag 스크립트 태그 추가 (async)
- `router.tsx` 또는 `AppShell.tsx` — 라우트 변경 시 `trackPageView` 호출
- 환경변수: `VITE_GA_MEASUREMENT_ID`

**추적 이벤트 목록**:
| 이벤트 | 트리거 |
|--------|--------|
| `page_view` | 라우트 변경 |
| `csv_upload` | CSV 파일 업로드 완료 |
| `sample_data_load` | 샘플 데이터 로드 |
| `funnel_analysis` | 퍼널 분석 실행 |
| `retention_analysis` | 리텐션 분석 실행 |
| `ai_insight_request` | AI 인사이트 요청 |
| `report_export` | 리포트 내보내기 (PNG/PDF) |
| `upgrade_modal_open` | 업그레이드 모달 오픈 |
| `pro_conversion` | Pro 결제 완료 |
| `signup` | 회원가입 완료 |

**제약**:
- PROD 환경에서만 GA4 활성화 (개발 환경 비활성화)
- 개인정보(이메일, 이름 등) 전송 금지
- 번들 영향 최소화 — gtag.js는 외부 스크립트로 로드 (npm 패키지 X)

**의존성**: 없음 (독립)

---

### OI-2: Vercel Analytics (Web Vitals)

**목적**: Core Web Vitals (LCP, CLS, INP) 자동 수집 + Vercel 대시보드에서 모니터링

**구현 내용**:
- `@vercel/analytics` npm 패키지 설치
- `index.tsx` (수정) — `<Analytics />` 컴포넌트 추가
- `@vercel/speed-insights` npm 패키지 설치 (옵션)
- `index.tsx` (수정) — `<SpeedInsights />` 컴포넌트 추가

**제약**:
- Vercel Hobby 플랜 무료 범위 내 (2,500 events/month)
- 번들 영향: ~2KB (가벼움)

**의존성**: 없음 (독립)

---

### OI-3: Supabase Auth Email Templates

**목적**: 회원가입 확인, 비밀번호 재설정 이메일을 FRE Analytics 브랜딩으로 커스터마이징

**구현 내용**:
- Supabase Dashboard > Authentication > Email Templates 수정
  - **Confirm signup**: FRE Analytics 브랜딩 HTML 이메일
  - **Reset password**: FRE Analytics 브랜딩 HTML 이메일
  - **Magic link**: FRE Analytics 브랜딩 HTML 이메일
- 이메일 템플릿 소스를 `docs/email-templates/` 에 백업 보관
- Supabase 대시보드에서 직접 설정 (코드 변경 최소)

**이메일 디자인 가이드라인**:
- 배경: #0c0f14 (bg-background)
- 액센트: #00d4aa (accent)
- 폰트: DM Sans 폴백 (이메일은 system-ui 사용)
- FRE Analytics 로고 텍스트 + 간결한 본문 + CTA 버튼

**제약**:
- Supabase Free 플랜 이메일 발송: 무제한 (커스텀 SMTP는 Pro 필요)
- 코드 변경 거의 없음 (Supabase 대시보드 설정)

**의존성**: 없음 (독립)

---

### OI-4: GitHub Actions CI

**목적**: PR 생성 시 자동으로 테스트 실행 + 빌드 검증

**구현 내용**:
- `.github/workflows/ci.yml` (신규)
  - Trigger: `pull_request` (main 브랜치 대상)
  - Steps:
    1. `actions/checkout@v4`
    2. `actions/setup-node@v4` (Node 20)
    3. `npm ci` (working-directory: `funnel-&-retention-explorer frontend`)
    4. `npx vitest run` (테스트)
    5. `npx vite build` (빌드 검증)
  - 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (빌드 시 필요, GitHub Secrets)

**제약**:
- GitHub Actions 무료: 2,000분/월 (충분)
- working-directory에 `&` 포함 — 쉘 이스케이프 필요
- `.env` 시크릿은 GitHub Repository Secrets로 관리

**의존성**: 없음 (독립)

---

## Implementation Order

```
OI-1 (GA4) ──┐
OI-2 (Vercel)─┼── 모두 독립, 병렬 가능
OI-3 (Email) ─┤
OI-4 (CI) ────┘
```

4개 태스크 모두 독립적이므로 순서 무관. 권장 순서:
1. **OI-4** (CI) — 이후 모든 변경의 안전망
2. **OI-1** (GA4) — 유저 추적 시작
3. **OI-2** (Vercel Analytics) — 가장 간단
4. **OI-3** (Email Templates) — 코드 변경 최소

---

## Files Affected

| Task | File | Action |
|------|------|--------|
| OI-1 | `lib/analytics.ts` | 신규 |
| OI-1 | `index.html` | 수정 (gtag script) |
| OI-1 | `components/AppShell.tsx` | 수정 (page tracking) |
| OI-1 | `hooks/useCSVUpload.ts` | 수정 (csv_upload event) |
| OI-1 | `hooks/useFunnelAnalysis.ts` | 수정 (funnel_analysis event) |
| OI-1 | `hooks/useRetentionAnalysis.ts` | 수정 (retention_analysis event) |
| OI-1 | `hooks/useAIInsights.ts` | 수정 (ai_insight event) |
| OI-1 | `hooks/useExportReport.ts` | 수정 (report_export event) |
| OI-1 | `components/UpgradeModal.tsx` | 수정 (upgrade_modal_open event) |
| OI-1 | `pages/BillingSuccessPage.tsx` | 수정 (pro_conversion event) |
| OI-1 | `context/AuthContext.tsx` | 수정 (signup event) |
| OI-2 | `package.json` | 수정 (@vercel/analytics, @vercel/speed-insights) |
| OI-2 | `index.tsx` | 수정 (Analytics + SpeedInsights 컴포넌트) |
| OI-3 | `docs/email-templates/` | 신규 (3 HTML files) |
| OI-4 | `.github/workflows/ci.yml` | 신규 |

**총 변경**: 14~15개 파일 (2 신규 코드 + 10 수정 + 1 CI 파일 + 3 이메일 템플릿)

---

## Acceptance Criteria

- [ ] GA4에서 페이지뷰 + 커스텀 이벤트 수신 확인 가능
- [ ] Vercel 대시보드에서 Web Vitals 메트릭 표시
- [ ] 회원가입 이메일이 FRE Analytics 브랜딩으로 발송
- [ ] PR 생성 시 GitHub Actions에서 테스트 + 빌드 자동 실행
- [ ] 개발 환경에서 GA4 비활성화 (console 오류 없음)
- [ ] 기존 98개 테스트 전부 통과
- [ ] 빌드 성공 (번들 크기 증가 ≤ 5KB)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| GA4 스크립트 → 페이지 로드 지연 | 낮음 | async 로드, defer |
| GitHub Actions `&` 디렉토리명 | 중간 | 쉘 이스케이프 테스트 |
| Supabase 이메일 발송 제한 | 낮음 | Free 플랜 무제한 |
| Vercel Analytics 무료 한도 초과 | 낮음 | 2,500 events/월 (초기 충분) |

---

## Environment Variables (New)

| Variable | Used By | Where |
|----------|---------|-------|
| `VITE_GA_MEASUREMENT_ID` | lib/analytics.ts | `.env.local` + Vercel |
| `VITE_SUPABASE_URL` | CI build | GitHub Secrets (기존) |
| `VITE_SUPABASE_ANON_KEY` | CI build | GitHub Secrets (기존) |
