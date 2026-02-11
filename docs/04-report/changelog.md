# Changelog — Funnel & Retention Explorer

All notable changes to the FRE Analytics project are documented in this file.

---

## [2026-02-11] — Phase 9: Internationalization (i18n)

### Summary
Completed full internationalization (i18n) support for Korean/English dual-language experience. Achieved 92.9% design match with zero iterations, delivering 840+ translation keys across 3 namespaces and 6 locale JSON files.

### Added
- **i18next Infrastructure**: Language detection (localStorage + navigator), 3 namespaces (common, pages, insights), fallback to Korean
- **Translation Files**: 6 JSON files (ko/en) with 840+ keys:
  - `locales/ko/common.json` (~175 keys) — UI components, navigation, plans, subscriptions, billing
  - `locales/en/common.json` (~175 keys) — English translations
  - `locales/ko/pages.json` (~285 keys) — Landing, auth, dashboard, analysis pages
  - `locales/en/pages.json` (~285 keys) — English translations
  - `locales/ko/insights.json` (~85 keys) — Dynamic insights and processing messages
  - `locales/en/insights.json` (~85 keys) — English translations
- **Language Switcher**: New LanguageSwitcher.tsx component in Sidebar with Globe icon + toggle
- **Component Translations**: All 19 components updated to use i18n (Sidebar, AppShell, SearchModal, UpgradeModal, Modal, Toast, ErrorBoundary, PageLoader, PlanBadge, UserMenu, SubscriptionStatus, BillingHistory, PastDueBanner, ShareButton, SaveAnalysisButton, AskAIPanel, NotificationPanel, OnboardingTour, LandingHeader)
- **Page Translations**: All 15 app pages translated (LandingPage, LoginPage, SignupPage, Dashboard, DataImport, FunnelAnalysis, RetentionAnalysis, SegmentComparison, Insights, PricingPage, BillingSuccessPage, SubscriptionPage, SharedReport, NotFoundPage, ProjectsPage; PrivacyPage/TermsPage excluded as legal documents)
- **Dynamic Content Translations**: insightsEngine.ts (13 insight types), 8 hooks (useCSVUpload, useFunnelAnalysis, useRetentionAnalysis, useSegmentComparison, useAIInsights, useExportReport, useSavedAnalyses, useOnboardingTour)
- **SEO Meta Tags**: Dynamic document.documentElement.lang and og:locale updates on language change

### Changed
- `package.json`: Added i18next ^25.8.4, react-i18next ^16.5.4, i18next-browser-languagedetector ^8.2.0
- `index.tsx`: First import is `import './lib/i18n'` (before React) to initialize translations
- `setupTests.ts`: Added react-i18next mock for 208 existing tests to pass without modification
- 35 files updated with useTranslation() or i18n.t() calls

### Enhanced
- Accessibility: Language switcher with dynamic aria-labels
- Interpolation: 25+ variable patterns ({{count}}, {{date}}, {{rate}}, {{step}}, etc.) for contextual messages
- Locale-aware formatting: formatDate/formatDateTime use i18n.language for proper localization
- Bundle impact: ~32KB gzipped (within target)

### Metrics
- **Design Match Rate**: 92.9% (39/42 items PASS/PARTIAL)
- **Files Created**: 9 (lib/i18n.ts, 6 locale JSONs, LanguageSwitcher.tsx)
- **Files Modified**: 35 (19 components, 15 pages, 8 hooks, 3 lib modules)
- **Translation Coverage**: 840+ keys across 6 files
- **Build Status**: Clean (208/208 tests passing)
- **PDCA Iterations**: 0 (first-pass completion)

### Documentation
- Plan: `docs/01-plan/features/i18n.plan.md`
- Design: `docs/02-design/features/i18n.design.md`
- Analysis: `docs/03-analysis/i18n.analysis.md`
- Report: `docs/04-report/features/i18n.report.md`

---

## [2026-02-11] — Phase 7: SEO & Error Pages

### Summary
Completed SEO optimization and error page implementation. Achieved 100% design match with zero iterations.

### Added
- **HTML Meta Tags**: lang="ko", description, keywords, author, theme-color, canonical
- **Open Graph Tags**: og:type, og:site_name, og:title, og:description, og:url, og:image, og:locale
- **Twitter Card Tags**: twitter:card, twitter:title, twitter:description, twitter:image
- **JSON-LD Structured Data**: SoftwareApplication, Organization, BreadcrumbList schemas
- **404 Error Page**: NotFoundPage.tsx component with responsive design
- **Web Crawler Config**: robots.txt with /app/ and /shared/ disallowed
- **Site Index**: static/sitemap.xml with 4 public pages
- **Social Image**: public/og-image.svg (1200x630 brand-themed)

### Changed
- `index.html`: Added 28 meta/OG/Twitter tags + JSON-LD script (+88 lines)
- `router.tsx`: Added catch-all route with lazy loading + Suspense (+4 lines)
- `pages/LandingPage.tsx`: Wrapped content in `<main>`, added aria-labels to 5 sections (+6 lines)

### Enhanced
- Accessibility: Added aria-labels to all content sections in LandingPage
- Semantic HTML: Proper heading hierarchy (h1 → h2/h3), main/section/footer tags

### Metrics
- **Design Match Rate**: 100% (45/45 items PASS)
- **Files Created**: 4 (NotFoundPage.tsx, og-image.svg, robots.txt, sitemap.xml)
- **Files Modified**: 3 (index.html, router.tsx, LandingPage.tsx)
- **Build Status**: Clean (98/98 tests passing)
- **Bundle Size**: No change (~1MB)

### Documentation
- Plan: `docs/01-plan/features/seo-error-pages.plan.md`
- Design: `docs/02-design/features/seo-error-pages.design.md`
- Analysis: `docs/03-analysis/seo-error-pages.analysis.md`
- Report: `docs/04-report/features/seo-error-pages.report.md`

---

## Previous Phases

[Phases 1-6 and Monetization Phases 1-4 archives exist in `docs/archive/2026-02/` directories]

See individual phase reports in `docs/04-report/features/` for detailed PDCA metrics and implementation summaries.
