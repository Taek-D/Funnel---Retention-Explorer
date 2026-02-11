# Plan: SEO & Error Pages (Phase 7)

## 1. Overview

FRE Analytics의 검색 엔진 최적화(SEO)와 에러 페이지를 구현합니다.
현재 index.html에 meta description, OG 태그, JSON-LD 구조화 데이터가 없어 검색 노출과 소셜 공유가 불가합니다.
또한 404/에러 페이지가 없어 잘못된 URL 접근 시 빈 화면이 표시됩니다.

## 2. Problem Statement

| 문제 | 현재 상태 | 목표 |
|------|----------|------|
| Meta 태그 | title만 존재 | description, keywords, canonical, theme-color |
| Open Graph | 없음 | og:title, og:description, og:image, og:url |
| Twitter Card | 없음 | twitter:card, twitter:title, twitter:description |
| JSON-LD | 없음 | SoftwareApplication 구조화 데이터 |
| 404 페이지 | 없음 (빈 화면) | 브랜드 디자인 404 페이지 |
| lang 속성 | `en` | `ko` (주 타겟 한국어) |
| robots.txt | 없음 | 크롤링 규칙 정의 |
| sitemap.xml | 없음 | 정적 사이트맵 |
| OG 이미지 | 없음 | 1200x630 소셜 공유 이미지 |

## 3. Requirements

### SE-1: HTML Meta Tags
- `<html lang="ko">` 변경
- `<meta name="description">` 추가
- `<meta name="keywords">` 추가
- `<meta name="theme-color" content="#0c0f14">` 추가
- `<link rel="canonical">` 추가

### SE-2: Open Graph & Twitter Card
- `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- OG 이미지 생성 (`/og-image.png`, 1200x630)

### SE-3: JSON-LD Structured Data
- SoftwareApplication 스키마
- Organization 스키마
- BreadcrumbList (주요 페이지)

### SE-4: 404 Not Found Page
- 브랜드 디자인의 404 페이지 컴포넌트
- router.tsx에 catch-all `*` 라우트 추가
- 홈/대시보드 이동 버튼

### SE-5: robots.txt & sitemap.xml
- `public/robots.txt` — 크롤링 허용 규칙
- `public/sitemap.xml` — 정적 페이지 사이트맵 (/, /pricing, /privacy, /terms)

### SE-6: Semantic HTML Enhancement
- LandingPage에 `<main>`, `<article>`, `<nav>` 시맨틱 태그 적용
- 이미지 alt 속성 확인
- heading 계층 구조 검증 (h1 > h2 > h3)

## 4. Scope

### In Scope
- index.html meta/OG/Twitter 태그
- JSON-LD 구조화 데이터
- 404 에러 페이지
- robots.txt, sitemap.xml
- OG 이미지 (정적 SVG/PNG)
- LandingPage 시맨틱 HTML

### Out of Scope
- 동적 페이지별 meta 태그 (react-helmet 등) — SPA이므로 불필요
- Server-side rendering (SSR) — Vite SPA 유지
- Google Search Console 연동 — 배포 후 별도 진행
- 다국어 i18n — 별도 Phase로 진행

## 5. Success Criteria

| Metric | Target |
|--------|--------|
| Lighthouse SEO Score | 90+ |
| OG 태그 유효성 | Facebook Debugger 통과 |
| Twitter Card 유효성 | Twitter Card Validator 통과 |
| 404 페이지 | 잘못된 URL에서 정상 렌더링 |
| robots.txt | /robots.txt 200 응답 |
| sitemap.xml | /sitemap.xml 200 응답 |
| 빌드 | 기존 테스트 98/98 유지 |

## 6. Implementation Order

1. SE-1: HTML Meta Tags (index.html)
2. SE-2: OG & Twitter Card (index.html + og-image)
3. SE-3: JSON-LD (index.html)
4. SE-5: robots.txt & sitemap.xml (public/)
5. SE-4: 404 Page (NotFoundPage.tsx + router.tsx)
6. SE-6: Semantic HTML (LandingPage.tsx)

## 7. Files to Modify

| File | Changes |
|------|---------|
| `index.html` | lang, meta, OG, Twitter, JSON-LD |
| `router.tsx` | catch-all `*` 라우트 추가 |
| `pages/NotFoundPage.tsx` | **NEW** — 404 페이지 |
| `pages/LandingPage.tsx` | 시맨틱 HTML 태그 |
| `public/robots.txt` | **NEW** — 크롤링 규칙 |
| `public/sitemap.xml` | **NEW** — 사이트맵 |
| `public/og-image.png` | **NEW** — 소셜 공유 이미지 |

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SPA SEO 한계 | Medium | 크롤러가 JS 실행 가능, meta는 정적 |
| OG 이미지 크기 | Low | SVG → PNG 변환 또는 정적 PNG |
| 빌드 영향 | Low | 정적 파일 + 컴포넌트만 추가 |
