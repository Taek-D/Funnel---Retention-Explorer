# Design: SEO & Error Pages (Phase 7)

> Plan Reference: `docs/01-plan/features/seo-error-pages.plan.md`

## 1. Architecture Overview

```
index.html
├── <html lang="ko">                      ← SE-1
├── <head>
│   ├── <meta name="description">         ← SE-1
│   ├── <meta name="keywords">            ← SE-1
│   ├── <meta name="theme-color">         ← SE-1
│   ├── <link rel="canonical">            ← SE-1
│   ├── <meta property="og:*">            ← SE-2
│   ├── <meta name="twitter:*">           ← SE-2
│   └── <script type="application/ld+json"> ← SE-3
├── public/
│   ├── robots.txt                         ← SE-5
│   ├── sitemap.xml                        ← SE-5
│   └── og-image.svg                       ← SE-2
├── pages/NotFoundPage.tsx                 ← SE-4
├── router.tsx                             ← SE-4
└── pages/LandingPage.tsx                  ← SE-6
```

## 2. Detailed Specifications

---

### SE-1: HTML Meta Tags

**File**: `index.html`

#### Changes

```html
<!-- BEFORE -->
<html lang="en">

<!-- AFTER -->
<html lang="ko">
```

**Add after `<link rel="icon">`:**

```html
<!-- SEO Meta -->
<meta name="description" content="CSV 데이터로 퍼널 분석, 리텐션 코호트, 세그먼트 비교, AI 인사이트를 한 곳에서. 무료로 시작하세요." />
<meta name="keywords" content="퍼널 분석, 리텐션 분석, 코호트 분석, CSV 분석, 사용자 행동 분석, funnel analysis, retention analysis, cohort analysis" />
<meta name="author" content="FRE Analytics" />
<meta name="theme-color" content="#0c0f14" />
<link rel="canonical" href="https://fre-analytics.vercel.app/" />
```

#### Verification Checklist (7 items)
- [ ] `lang="ko"` on `<html>`
- [ ] `<meta name="description">` present (120-160 chars)
- [ ] `<meta name="keywords">` present
- [ ] `<meta name="author">` present
- [ ] `<meta name="theme-color">` = `#0c0f14`
- [ ] `<link rel="canonical">` with production URL
- [ ] Existing `<title>` preserved

---

### SE-2: Open Graph & Twitter Card

**File**: `index.html`

**Add after SE-1 meta tags:**

```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="FRE Analytics" />
<meta property="og:title" content="FRE Analytics — 퍼널 & 리텐션 탐색기" />
<meta property="og:description" content="CSV 데이터로 퍼널 분석, 리텐션 코호트, 세그먼트 비교, AI 인사이트를 한 곳에서." />
<meta property="og:url" content="https://fre-analytics.vercel.app/" />
<meta property="og:image" content="https://fre-analytics.vercel.app/og-image.svg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="ko_KR" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="FRE Analytics — 퍼널 & 리텐션 탐색기" />
<meta name="twitter:description" content="CSV 데이터로 퍼널 분석, 리텐션 코호트, 세그먼트 비교, AI 인사이트를 한 곳에서." />
<meta name="twitter:image" content="https://fre-analytics.vercel.app/og-image.svg" />
```

**OG Image**: `public/og-image.svg`

SVG 이미지 (1200x630), 브랜드 디자인:
- 배경: `#0c0f14` (background color)
- 로고: Activity 아이콘 + "FRE Analytics" 텍스트
- 부제: "퍼널 & 리텐션 탐색기"
- 액센트: `#00d4aa` gradient
- 우측: 간략한 차트 일러스트 (bar chart)

#### Verification Checklist (12 items)
- [ ] `og:type` = "website"
- [ ] `og:site_name` = "FRE Analytics"
- [ ] `og:title` present
- [ ] `og:description` present (≤ 200 chars)
- [ ] `og:url` = production URL
- [ ] `og:image` = absolute URL to og-image
- [ ] `og:image:width` = 1200
- [ ] `og:image:height` = 630
- [ ] `og:locale` = "ko_KR"
- [ ] `twitter:card` = "summary_large_image"
- [ ] `twitter:title` present
- [ ] `twitter:image` present
- [ ] `og-image.svg` exists in public/

---

### SE-3: JSON-LD Structured Data

**File**: `index.html`

**Add before `</head>`:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "FRE Analytics",
      "description": "CSV 데이터로 퍼널 분석, 리텐션 코호트, 세그먼트 비교, AI 인사이트를 제공하는 분석 플랫폼",
      "url": "https://fre-analytics.vercel.app",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "KRW"
      }
    },
    {
      "@type": "Organization",
      "name": "FRE Analytics",
      "url": "https://fre-analytics.vercel.app",
      "logo": "https://fre-analytics.vercel.app/favicon.svg"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://fre-analytics.vercel.app/" },
        { "@type": "ListItem", "position": 2, "name": "요금제", "item": "https://fre-analytics.vercel.app/pricing" },
        { "@type": "ListItem", "position": 3, "name": "개인정보처리방침", "item": "https://fre-analytics.vercel.app/privacy" }
      ]
    }
  ]
}
</script>
```

#### Verification Checklist (6 items)
- [ ] `<script type="application/ld+json">` present
- [ ] SoftwareApplication schema valid
- [ ] Organization schema with logo URL
- [ ] BreadcrumbList with 3+ items
- [ ] Valid JSON (no trailing commas)
- [ ] All URLs are absolute production URLs

---

### SE-4: 404 Not Found Page

**File**: `pages/NotFoundPage.tsx` (NEW)

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from '../components/Icons';

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-6">
    <div className="max-w-md w-full text-center">
      {/* 404 Number */}
      <div className="text-[120px] md:text-[160px] font-extrabold leading-none tracking-tightest text-white/[0.04] select-none">
        404
      </div>

      {/* Content */}
      <h1 className="text-2xl font-bold text-white -mt-8 mb-3">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-slate-500 text-sm mb-8">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-colors"
        >
          <Home size={16} />
          홈으로 이동
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:text-white rounded-lg transition-all"
        >
          <ArrowLeft size={16} />
          뒤로 가기
        </button>
      </div>
    </div>
  </div>
);
```

**File**: `router.tsx`

```tsx
// Add import
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage }))
);

// Add catch-all route AFTER all other routes (last in array)
{
  path: '*',
  element: <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>,
},
```

**Icons**: `Home`, `ArrowLeft` — verify export from `components/Icons.tsx`

#### Verification Checklist (8 items)
- [ ] `NotFoundPage.tsx` exists in pages/
- [ ] Uses `bg-background` (brand dark theme)
- [ ] 404 large text (visual emphasis)
- [ ] `h1` with descriptive text
- [ ] "홈으로 이동" Link to `/`
- [ ] "뒤로 가기" button with `history.back()`
- [ ] Router catch-all `*` route is LAST in route array
- [ ] Lazy loaded with Suspense + PageLoader

---

### SE-5: robots.txt & sitemap.xml

**File**: `public/robots.txt` (NEW)

```txt
User-agent: *
Allow: /
Disallow: /app/
Disallow: /shared/

Sitemap: https://fre-analytics.vercel.app/sitemap.xml
```

**Rationale**:
- Allow: `/` — 공개 페이지 (/, /pricing, /privacy, /terms) 크롤링 허용
- Disallow: `/app/` — 인증 필요 페이지 크롤링 차단
- Disallow: `/shared/` — 사용자 데이터 페이지 크롤링 차단

**File**: `public/sitemap.xml` (NEW)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://fre-analytics.vercel.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://fre-analytics.vercel.app/pricing</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://fre-analytics.vercel.app/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://fre-analytics.vercel.app/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

#### Verification Checklist (6 items)
- [ ] `robots.txt` exists in `public/`
- [ ] `/app/` disallowed
- [ ] `/shared/` disallowed
- [ ] Sitemap URL present in robots.txt
- [ ] `sitemap.xml` exists in `public/`
- [ ] 4 URLs listed (/, /pricing, /privacy, /terms)

---

### SE-6: Semantic HTML Enhancement

**File**: `pages/LandingPage.tsx`

#### Changes

1. Wrap all sections in `<main>`:
```tsx
// BEFORE
<div className="min-h-screen bg-background text-white font-sans">
  <LandingHeader />
  <section>...</section> <!-- Hero -->
  <section>...</section> <!-- Features -->
  ...
  <footer>...</footer>
</div>

// AFTER
<div className="min-h-screen bg-background text-white font-sans">
  <LandingHeader />
  <main>
    <section>...</section> <!-- Hero -->
    <section>...</section> <!-- Features -->
    ...
    <section>...</section> <!-- CTA -->
  </main>
  <footer>...</footer>
</div>
```

2. Add `aria-label` to each `<section>`:
```tsx
<section id="features" aria-label="주요 기능" ...>
<section id="pricing" aria-label="요금제" ...>
<section id="faq" aria-label="자주 묻는 질문" ...>
```

3. Verify heading hierarchy:
- `<h1>` = Hero title ("퍼널 & 리텐션 탐색기") — exists ✅
- `<h2>` = Section titles — exists ✅
- No heading level skips — verify

#### Verification Checklist (5 items)
- [ ] `<main>` wraps content between header and footer
- [ ] Hero section has `aria-label`
- [ ] Features/Pricing/FAQ sections have `aria-label`
- [ ] `<footer>` is outside `<main>`
- [ ] Heading hierarchy: h1 → h2 (no skips)

---

## 3. Implementation Order

| Step | Task ID | File(s) | Description |
|------|---------|---------|-------------|
| 1 | SE-1 | `index.html` | lang="ko", meta description/keywords/theme-color/canonical |
| 2 | SE-2 | `index.html`, `public/og-image.svg` | OG tags, Twitter Card tags, OG image |
| 3 | SE-3 | `index.html` | JSON-LD structured data script |
| 4 | SE-5 | `public/robots.txt`, `public/sitemap.xml` | Crawling rules + sitemap |
| 5 | SE-4 | `pages/NotFoundPage.tsx`, `router.tsx` | 404 page + catch-all route |
| 6 | SE-6 | `pages/LandingPage.tsx` | Semantic HTML tags |

## 4. Total Verification Items

| Task | Items |
|------|-------|
| SE-1 | 7 |
| SE-2 | 13 |
| SE-3 | 6 |
| SE-4 | 8 |
| SE-5 | 6 |
| SE-6 | 5 |
| **Total** | **45** |

## 5. Dependencies

- No new npm packages required
- Icons `Home`, `ArrowLeft` — already available in lucide-react
- Production URL: `https://fre-analytics.vercel.app`

## 6. Non-Goals

- No `react-helmet` or dynamic per-page meta (SPA static meta sufficient)
- No SSR/SSG migration
- No Google Analytics SEO tracking (GA4 already integrated)
- No automated Lighthouse CI (manual verification)
