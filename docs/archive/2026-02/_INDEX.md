# Archive Index — 2026-02

## stability-security

| Item | Detail |
|------|--------|
| **Feature** | Phase 1: Stability & Security |
| **Match Rate** | 100% |
| **Iterations** | 0 |
| **Completed** | 2026-02-09 |
| **Commit** | `29ca738 fix: Harden security and stability (Phase 1 PDCA)` |

### Documents

| Phase | File |
|-------|------|
| Plan | `stability-security/project-overview.plan.md` |
| Design | `stability-security/stability-security.design.md` |
| Analysis (Critical) | `stability-security/critical-fixes.analysis.md` |
| Analysis (Phase 1) | `stability-security/stability-security.analysis.md` |
| Report | `stability-security/stability-security.report.md` |

### Summary

8 tasks completed: `any` type 전체 제거, ErrorBoundary 추가, retentionEngine O(n) 최적화, CSV 검증, localStorage 보안, Supabase null guard, 이벤트명 sanitization, funnelEngine null checks. 품질 점수 87 → 95/100.

---

## code-quality

| Item | Detail |
|------|--------|
| **Feature** | Phase 2: Code Quality |
| **Match Rate** | 100% |
| **Iterations** | 0 |
| **Completed** | 2026-02-09 |

### Documents

| Phase | File |
|-------|------|
| Plan | `code-quality/code-quality.plan.md` |
| Design | `code-quality/code-quality.design.md` |
| Analysis | `code-quality/code-quality.analysis.md` |
| Report | `code-quality/code-quality.report.md` |

### Summary

5 tasks completed: inline style → Tailwind 변환 (3개소), magic number → 상수 추출 (6개), 중복 코드 → eventUtils.ts 공통 함수 추출, 단위 테스트 5개 추가 (9→14 파일, 98 테스트), 에러 메시지 한국어 표준화. 품질 점수 95 → 98/100.

---

## bundle-optimization

| Item | Detail |
|------|--------|
| **Feature** | Phase 3: Bundle Optimization |
| **Match Rate** | 100% (38/38) |
| **Iterations** | 0 |
| **Completed** | 2026-02-09 |

### Documents

| Phase | File |
|-------|------|
| Plan | `bundle-optimization/bundle-optimization.plan.md` |
| Design | `bundle-optimization/bundle-optimization.design.md` |
| Analysis | `bundle-optimization/bundle-optimization.analysis.md` |
| Report | `bundle-optimization/bundle-optimization.report.md` |

### Summary

6 tasks completed: Vite manualChunks 설정 (4 vendor chunks), React.lazy + Suspense 적용 (8 pages), PageLoader 컴포넌트 생성, reportEngine dynamic import, geminiClient dynamic import, 빌드 검증. 단일 번들 1,013KB → 20 chunks (최대 367KB), 초기 로드 -66%, Vite 500KB 경고 해소. 테스트 98/98 유지.

---

## security-trust

| Item | Detail |
|------|--------|
| **Feature** | Monetization Phase 1: Security & Trust |
| **Match Rate** | 100% (54/54) |
| **Iterations** | 0 |
| **Completed** | 2026-02-09 |

### Documents

| Phase | File |
|-------|------|
| Plan | `security-trust/security-trust.plan.md` |
| Design | `security-trust/security-trust.design.md` |
| Analysis | `security-trust/security-trust.analysis.md` |
| Report | `security-trust/security-trust.report.md` |

### Summary

6 tasks completed: Gemini API 키 서버사이드 프록시 (Supabase Edge Function), 개인정보처리방침 페이지 (PIPA 준수), 이용약관 페이지, 푸터 더미 링크 수정, Sentry 에러 모니터링 연동, 랜딩 페이지 가짜 수치 제거. 11개 파일 변경 (4 신규, 7 수정). 수익화 준비도 35 → 50/100.

---

## payment-integration

| Item | Detail |
|------|--------|
| **Feature** | Monetization Phase 2: TossPayments Payment Integration |
| **Match Rate** | 100% (84/84) |
| **Iterations** | 0 |
| **Completed** | 2026-02-10 |

### Documents

| Phase | File |
|-------|------|
| Plan | `payment-integration/payment-integration.plan.md` |
| Design | `payment-integration/payment-integration.design.md` |
| Analysis | `payment-integration/payment-integration.analysis.md` |
| Report | `payment-integration/payment-integration.report.md` |

### Summary

12 tasks completed (PI-1 ~ PI-12): fre_user_profiles DB 테이블 + RLS + trigger, planManager.ts 플랜 유틸리티, AuthContext userProfile 확장, usePlanGate 기능 게이팅 훅, TossPayments issue-billing Edge Function (빌링키 + 첫 결제), toss-webhook Edge Function, UpgradeModal (TossPayments SDK v2), PlanBadge, CSV 행 수 제한 (10K/500K), AI 호출 일일 제한 (3/50, 이중 검증), PricingPage + LandingPage 업데이트, Sidebar PlanBadge 통합. 18개 파일 변경 (9 신규, 9 수정). 수익화 준비도 50 → 70/100.

---

## subscription-scheduling

| Item | Detail |
|------|--------|
| **Feature** | Monetization Phase 3: Subscription Scheduling |
| **Match Rate** | 96.4% (80/83, 3 PARTIAL intentional) |
| **Iterations** | 0 |
| **Completed** | 2026-02-10 |

### Documents

| Phase | File |
|-------|------|
| Plan | `subscription-scheduling/subscription-scheduling.plan.md` |
| Design | `subscription-scheduling/subscription-scheduling.design.md` |
| Analysis | `subscription-scheduling/subscription-scheduling.analysis.md` |
| Report | `subscription-scheduling/subscription-scheduling.report.md` |

### Summary

11 tasks completed (SS-1 ~ SS-11): process-billing Edge Function (pg_cron 기반 매일 자동결제), pg_cron + pg_net 스케줄링, cancel-subscription Edge Function, SubscriptionPage (구독 관리 UI), SubscriptionStatus 컴포넌트, 결제 실패 재시도 (3회, 1/3/7일 간격 + 7일 grace period), toss-webhook HMAC-SHA256 보안 강화, fre_billing_history 테이블 (RLS + 인덱스), BillingHistory 컴포넌트, fre_user_profiles 스키마 확장 (retry_count, grace_period_end, cancelled_at), Sidebar + Router 업데이트. 13개 파일 변경 (7 신규, 6 수정, ~1,600 lines). 수익화 준비도 70 → 80/100.

---

## annual-billing

| Item | Detail |
|------|--------|
| **Feature** | Monetization Phase 4: Annual Billing |
| **Match Rate** | 100% (89/89) |
| **Iterations** | 0 |
| **Completed** | 2026-02-10 |

### Documents

| Phase | File |
|-------|------|
| Plan | `annual-billing/annual-billing.plan.md` |
| Design | `annual-billing/annual-billing.design.md` |
| Analysis | `annual-billing/annual-billing.analysis.md` |
| Report | `annual-billing/annual-billing.report.md` |

### Summary

12 tasks completed (AB-1 ~ AB-12): fre_user_profiles billing_cycle 컬럼 추가, BillingCycle 타입 + BILLING_PRICES/BILLING_INTERVALS 상수, issue-billing billingCycle 파라미터 + 금액 분기, process-billing 동적 금액/주기, change-billing-key Edge Function (결제 수단 변경), switch-plan Edge Function (월간↔연간 전환 + 일할 계산), PricingPage 월간/연간 토글, UpgradeModal 라디오 선택, SubscriptionPage 결제 수단 변경 + 플랜 전환 UI, SubscriptionStatus billing_cycle 표시, BillingSuccessPage mode=change 분기, FAQ 업데이트. 12개 파일 변경 (3 신규, 9 수정, ~2,113 lines). 수익화 준비도 80 → 88/100.

---

## supabase-deployment

| Item | Detail |
|------|--------|
| **Feature** | Supabase Infrastructure Deployment & Integration Verification |
| **Match Rate** | 97.6% (328/335, 2 FAIL — TossPayments keys pending) |
| **Iterations** | 0 |
| **Completed** | 2026-02-10 |

### Documents

| Phase | File |
|-------|------|
| Analysis | `supabase-deployment/supabase-deployment.analysis.md` |
| Report | `supabase-deployment/supabase-deployment.report.md` |

### Summary

Monetization Phase 1~4 전체 인프라 배포: Supabase Migration 3개 적용 (fre_user_profiles, fre_billing_history, billing_cycle), Edge Function 7개 배포 (ai-proxy, toss-webhook, process-billing, issue-billing, cancel-subscription, change-billing-key, switch-plan — 840 lines TypeScript), Vault secrets 2개 (process_billing_url, service_role_key), Edge Function secret 1개 (GEMINI_API_KEY), pg_cron daily-billing 스케줄, Vercel 프로덕션 배포. 335항목 통합 검증: 코드 매치율 100% (310/310), 배포 매치율 92% (23/25). 미해결: TOSS_SECRET_KEY, TOSS_WEBHOOK_SECRET (TossPayments 가입 후 설정). 수익화 준비도 88 → 95/100.

---

## onboarding

| Item | Detail |
|------|--------|
| **Feature** | Phase 3 Onboarding: First-Visit Experience |
| **Match Rate** | 97.6% (81/85, 4 PARTIAL, 0 FAIL) |
| **Iterations** | 0 |
| **Completed** | 2026-02-10 |

### Documents

| Phase | File |
|-------|------|
| Plan | `onboarding/onboarding.plan.md` |
| Design | `onboarding/onboarding.design.md` |
| Analysis | `onboarding/onboarding.analysis.md` |
| Report | `onboarding/onboarding.report.md` |

### Summary

5 tasks completed (OB-1 ~ OB-5): `lib/sampleData.ts` 이커머스/SaaS 샘플 데이터 생성기 (300/200명 사용자, ~1,800/~1,600행), `useCSVUpload.ts` loadSampleData 원클릭 로드 (dynamic import + 풀 파이프라인), DataImport 샘플 카드 UI + query param 자동 로드, Dashboard 빈 상태 CTA (그라데이션 히어로 + 2개 버튼 + 기능 미리보기 3카드), `useOnboardingTour.ts` + `OnboardingTour.tsx` 인터랙티브 3단계 투어 (overlay + tooltip + localStorage 영속), Sidebar HelpCircle 가이드 버튼 + data-tour 속성. 9개 파일 변경 (3 신규, 6 수정, ~668 lines). 번들 영향: +2.5KB lazy chunk (main bundle 0). 테스트 98/98 통과.

---

## core-features

| Item | Detail |
|------|--------|
| **Feature** | Phase 4 Core Features Enhancement |
| **Match Rate** | 100% (83/83, 80 PASS, 3 PARTIAL, 0 FAIL) |
| **Iterations** | 0 |
| **Completed** | 2026-02-10 |

### Documents

| Phase | File |
|-------|------|
| Plan | `core-features/core-features.plan.md` |
| Design | `core-features/core-features.design.md` |
| Analysis | `core-features/core-features.analysis.md` |
| Report | `core-features/core-features.report.md` |

### Summary

4 tasks completed (CF-1 ~ CF-4): `reportEngine.ts` drawWatermark + isPro 매개변수 (Free 플랜 워터마크), exportReportAsPDF jsPDF dynamic import (Pro 전용 PDF 내보내기), `useExportReport.ts` PNG/PDF 포맷 선택 + usePlanGate 통합, `useSavedAnalyses.ts` 저장된 분석 CRUD 훅 + Dashboard 복원/삭제 UI, `supabaseData.ts` listAllSnapshots/deleteSnapshot/shareSnapshot/getSharedSnapshot, `ShareButton.tsx` 공유 링크 생성 (Pro 전용), `SharedReport.tsx` 공유 리포트 읽기 전용 페이지 + `/shared/:token` 라우트, Supabase migration (share_token + is_shared + RLS + index). 10개 파일 변경 (3 신규, 7 수정). jsPDF 390KB 별도 chunk (main bundle 0). 테스트 98/98 통과. 수익화 준비도 88 → 95/100.

---

## ops-infrastructure

| Item | Detail |
|------|--------|
| **Feature** | Phase 5: Operations & Growth Infrastructure |
| **Match Rate** | 100% (74/74) |
| **Iterations** | 0 |
| **Completed** | 2026-02-10 |

### Documents

| Phase | File |
|-------|------|
| Plan | `ops-infrastructure/ops-infrastructure.plan.md` |
| Design | `ops-infrastructure/ops-infrastructure.design.md` |
| Analysis | `ops-infrastructure/ops-infrastructure.analysis.md` |
| Report | `ops-infrastructure/ops-infrastructure.report.md` |

### Summary

4 tasks completed (OI-1 ~ OI-4): `lib/analytics.ts` GA4 통합 (type-safe trackEvent, 10 이벤트 타입, dynamic script injection, PROD only), AppShell trackPageView + 8개 hooks/pages trackEvent 삽입 (csv_upload, sample_data_load, funnel_analysis, retention_analysis, ai_insight_request, report_export, upgrade_modal_open, pro_conversion, signup_complete), `@vercel/analytics` + `@vercel/speed-insights` 연동 (vendor-monitoring chunk), Supabase Auth 이메일 템플릿 3종 (confirm-signup, reset-password, magic-link — FRE 브랜딩 다크 테마), `.github/workflows/ci.yml` GitHub Actions CI (PR 자동 빌드/테스트). 12개 파일 변경 (5 신규, 7 수정). 테스트 98/98 통과.

---

## ui-polish

| Item | Detail |
|------|--------|
| **Feature** | Phase 6: UI Polish |
| **Match Rate** | 97% |
| **Iterations** | 1 |
| **Completed** | 2026-02-10 |

### Documents

| Phase | File |
|-------|------|
| Plan | `ui-polish/ui-polish.plan.md` |
| Design | `ui-polish/ui-polish.design.md` |
| Analysis | `ui-polish/ui-polish.analysis.md` |
| Report | `ui-polish/ui-polish.report.md` |

### Summary

4 tasks completed (UP-1 ~ UP-4): ARIA 접근성 전면 적용 (role="dialog", aria-modal, aria-label, aria-current, aria-expanded, aria-haspopup, aria-hidden — Sidebar, Modal, Toast, SearchModal, UserMenu, OnboardingTour), CHART_COLORS 테마 토큰 (constants.ts → FunnelAnalysis, RetentionAnalysis, Dashboard 차트 색상 통합), ChartSkeleton 컴포넌트 (bar/area/table 3개 variant + 3개 분석 페이지 placeholder), Modal/Toast exit animation (fade-out + translateY, Escape key, dynamic timeout), 모바일 스크롤 힌트 (gradient overlay). 14개 파일 변경 (1 신규, 13 수정, ~2,006 lines). 테스트 98/98 통과.

---

## seo-error-pages

| Item | Detail |
|------|--------|
| **Feature** | Phase 7: SEO & Error Pages |
| **Match Rate** | 100% (45/45) |
| **Iterations** | 0 |
| **Completed** | 2026-02-11 |
| **Commit** | `f42b524 feat: Add SEO meta tags, OG/Twitter cards, JSON-LD, 404 page, robots.txt, sitemap (Phase 7)` |

### Documents

| Phase | File |
|-------|------|
| Plan | `seo-error-pages/seo-error-pages.plan.md` |
| Design | `seo-error-pages/seo-error-pages.design.md` |
| Analysis | `seo-error-pages/seo-error-pages.analysis.md` |
| Report | `seo-error-pages/seo-error-pages.report.md` |

### Summary

6 tasks completed (SE-1 ~ SE-6): HTML meta tags (lang="ko", description, keywords, author, theme-color, canonical), Open Graph 9 tags + Twitter Card 4 tags + og-image.svg (1200x630 브랜드 SVG), JSON-LD 구조화 데이터 (SoftwareApplication, Organization, BreadcrumbList), NotFoundPage 404 에러 페이지 + router catch-all route, robots.txt (/app/ /shared/ 차단) + sitemap.xml (4 URLs), LandingPage semantic HTML (`<main>` + 5 section aria-labels + heading hierarchy). 8개 파일 변경 (4 신규, 3 수정, ~200 lines). 테스트 98/98 통과.

---

## testing-foundation

| Item | Detail |
|------|--------|
| **Feature** | Phase 8: Testing Foundation |
| **Match Rate** | 100% (44/44) |
| **Iterations** | 0 |
| **Completed** | 2026-02-11 |

### Documents

| Phase | File |
|-------|------|
| Plan | `testing-foundation/testing-foundation.plan.md` |
| Design | `testing-foundation/testing-foundation.design.md` |
| Analysis | `testing-foundation/testing-foundation.analysis.md` |
| Report | `testing-foundation/testing-foundation.report.md` |

### Summary

6 tasks completed (TF-1 ~ TF-6): React Testing Infrastructure (jsdom + @testing-library/react + jest-dom + user-event), Context & Reducer 테스트 (22 tests, 19 action types + immutability), Custom Hook 테스트 5개 (usePlanGate, useColumnMapping, useClickOutside, useFunnelAnalysis, useRetentionAnalysis — 28 tests), UI Component 테스트 5개 (Modal, Toast, PlanBadge, PageLoader, ErrorBoundary — 32 tests), Lib Module 테스트 3개 (planManager, recentFiles, eventUtils — 28 tests), Test Utilities (renderWithProviders, mock helpers). 16개 파일 신규 + 2개 수정 (~1,538 lines). 테스트 98 → 208+ (110 신규). 실행 시간 2.7초.

---

## i18n

| Item | Detail |
|------|--------|
| **Feature** | Phase 9: Internationalization (Korean/English) |
| **Match Rate** | 92.9% (39/42 weighted, 2 gaps fixed post-analysis) |
| **Iterations** | 0 |
| **Completed** | 2026-02-11 |
| **Commit** | `ad902ba feat: Add Korean/English internationalization with react-i18next (Phase 9)` |

### Documents

| Phase | File |
|-------|------|
| Plan | `i18n/i18n.plan.md` |
| Design | `i18n/i18n.design.md` |
| Analysis | `i18n/i18n.analysis.md` |
| Report | `i18n/i18n.report.md` |

### Summary

6 tasks completed (I18N-1 ~ I18N-6): i18next + react-i18next + browser-languagedetector 인프라, 6개 locale JSON (common/pages/insights x ko/en, 840+ keys), 19개 컴포넌트 useTranslation() 적용, 15개 페이지 useTranslation('pages') 적용, 8개 hooks + insightsEngine i18n.t() 적용, LanguageSwitcher Globe 토글 (Sidebar + LandingHeader), SEO (document.title + og:locale + hreflang), locale-aware 날짜/시간 포맷. 66개 파일 변경 (12 신규, 54 수정, +5,491/-1,186 lines).

---

## data-export

| Item | Detail |
|------|--------|
| **Feature** | Data Export Enhancement (CSV/Excel) |
| **Match Rate** | 96.5% (92 PASS, 7 PARTIAL, 0 FAIL / 99 items) |
| **Iterations** | 0 |
| **Completed** | 2026-02-11 |

### Documents

| Phase | File |
|-------|------|
| Plan | `data-export/data-export.plan.md` |
| Design | `data-export/data-export.design.md` |
| Analysis | `data-export/data-export.analysis.md` |
| Report | `data-export/data-export.report.md` |

### Summary

6 tasks completed (DE-1 ~ DE-6): `lib/exportUtils.ts` CSV 내보내기 유틸리티 (BOM+UTF-8, 한국어 Excel 호환, comma/quote/newline escaping), `lib/excelExport.ts` SheetJS xlsx dynamic import (multi-sheet workbook, cell formatting 0.0%/+0.0%), `hooks/useDataExport.ts` 내보내기 오케스트레이션 (CSV/Excel 타입 라우팅, Pro 게이팅, toast 피드백), `components/ExportDropdown.tsx` 드롭다운 UI (ARIA haspopup/expanded, click-outside close, PRO 배지), 4개 페이지 통합 (FunnelAnalysis, RetentionAnalysis, SegmentComparison, Dashboard quick-export-all), i18n 키 20+ (ko/en, dataExport.headers.* 11개 로컬라이즈 컬럼 헤더 포함). 12개 파일 변경 (4 신규, 8 수정, ~1,050 lines). 테스트 7/7 통과 (arrayToCSV BOM/escaping/edge cases). 7 PARTIAL 항목 모두 low-impact (3 positive simplification, 3 cosmetic filename, 1 improved key name). 11개 design 초과 개선 포함.

---

## dashboard-customization

| Item | Detail |
|------|--------|
| **Feature** | Dashboard Customization (Widget Visibility, Reorder, Resize, Persistence) |
| **Match Rate** | 100% (92/92) |
| **Iterations** | 0 |
| **Completed** | 2026-02-11 |

### Documents

| Phase | File |
|-------|------|
| Plan | `dashboard-customization/dashboard-customization.plan.md` |
| Design | `dashboard-customization/dashboard-customization.design.md` |
| Analysis | `dashboard-customization/dashboard-customization.analysis.md` |
| Report | `dashboard-customization/dashboard-customization.report.md` |

### Summary

7 tasks completed (DC-1 ~ DC-7): WidgetId/WidgetWidth/WidgetLayout 타입 + AppState 확장 + SET_DASHBOARD_LAYOUT 리듀서, DASHBOARD_WIDGETS 레지스트리 + DEFAULT_LAYOUT 상수, useDashboardLayout 훅 (show/hide, reorder, resize, resetToDefault + localStorage + Supabase 1s 디바운스 동기화), DashboardWidget 래퍼 컴포넌트 (3 렌더 모드: view/edit/hidden + HTML5 DnD), Dashboard.tsx 동적 레이아웃 리팩토링 (grid-cols-2 + Settings/Check 편집 모드), Supabase migration (dashboard_layout JSONB), i18n 15 키 (ko/en). 11개 파일 변경 (3 신규, 8 수정, ~2,401 lines). 테스트 223/223 통과. 9개 design 초과 개선 (StrictMode 가드, 디바운스 cleanup, localStorage 검증, minWidth UI 제약, onDragEnd 등).

---

## dashboard-presets

| Item | Detail |
|------|--------|
| **Feature** | Dashboard Template Presets (Default, E-commerce, SaaS) |
| **Match Rate** | 100% (59/59) |
| **Iterations** | 0 |
| **Completed** | 2026-02-12 |

### Documents

| Phase | File |
|-------|------|
| Analysis | `dashboard-presets/dashboard-presets.analysis.md` |
| Report | `dashboard-presets/dashboard-presets.report.md` |

### Summary

3 preset templates (default, ecommerce, saas) providing one-click dashboard layout application. PRESET_TEMPLATES 상수 (constants.ts), applyPreset() 콜백 (useDashboardLayout.ts, resetToDefault 리팩토링), Dashboard 편집 모드 드롭다운 UI (LayoutDashboard/ShoppingBag/Activity 아이콘 + useClickOutside), ko/en i18n 8키. 7개 파일 변경 (5 impl + 2 test, ~120 lines). 테스트 305 → 310 (+5 preset tests). 0 iteration.

---

## notification-system

| Item | Detail |
|------|--------|
| **Feature** | Notification System Enhancement (Triggers, Persistence, Preferences) |
| **Match Rate** | 100% (38/38) |
| **Iterations** | 0 |
| **Completed** | 2026-02-12 |

### Documents

| Phase | File |
|-------|------|
| Plan | `notification-system/notification-system.plan.md` |
| Design | `notification-system/notification-system.design.md` |
| Analysis | `notification-system/notification-system.analysis.md` |
| Report | `notification-system/notification-system.report.md` |

### Summary

4 tasks completed (NF-1 ~ NF-4): 알림 트리거 통합 (useRetentionAnalysis, useSegmentComparison, useDataExport, SaveAnalysisButton — 4개 hook/컴포넌트에 addNotification 추가), Supabase 영속화 (supabaseData.ts 6개 CRUD 함수 + NotificationContext Supabase 통합 + 게스트 인메모리 폴백 + 옵티미스틱 temp ID), 개별 알림 읽음/삭제 (NotificationPanel click-to-read + X 삭제 + unread dot + ARIA), 알림 설정 패널 (NotificationPreferencesModal 4타입 토글 + localStorage + AppShell 연동). 12개 파일 변경 (1 신규, 11 수정, ~1,200 lines). 테스트 310/310 통과. 0 iteration.

---

## admin-dashboard

| Item | Detail |
|------|--------|
| **Feature** | Admin Dashboard (RBAC, KPI, User Management, Billing) |
| **Match Rate** | 98.5% (81/83, 2 PARTIAL, 0 FAIL) |
| **Iterations** | 0 |
| **Completed** | 2026-02-12 |

### Documents

| Phase | File |
|-------|------|
| Plan | `admin-dashboard/admin-dashboard.plan.md` |
| Design | `admin-dashboard/admin-dashboard.design.md` |
| Analysis | `admin-dashboard/admin-dashboard.analysis.md` |
| Report | `admin-dashboard/admin-dashboard.report.md` |

### Summary

5 scope items completed (AD-1 ~ AD-5): AD-1 Admin Role 시스템 (UserRole 타입, AdminRoute 가드, router.tsx admin 라우트 3개, Sidebar 조건부 admin 메뉴 + 구분선), AD-2 Admin API 클라이언트 (adminApi.ts — adminFetch 헬퍼 + 6개 API 함수 + 5개 타입), AD-3 Admin Dashboard 페이지 (AdminNav 서브탭 + KPI 카드 4개 + 매출 BarChart + 플랜 PieChart), AD-4 사용자 관리 (AdminUsers 검색/필터/페이지네이션 테이블 + UserDetailModal 조회/수정), AD-5 매출/결제 (AdminBilling 매출 차트 + 결제 내역 테이블 + 상태 필터). i18n 60키 (ko/en). 14개 파일 변경 (7 신규, 7 수정, ~1,200 lines). 테스트 310/310 통과. 0 iteration. 외부 의존: Supabase Edge Function `admin-api` 배포 + DB role 컬럼 마이그레이션.

---

## e2e-testing

| Item | Detail |
|------|--------|
| **Feature** | Playwright E2E Testing |
| **Match Rate** | 98.5% (57 PASS, 8 PARTIAL, 1 FAIL / 66 items) |
| **Iterations** | 0 |
| **Completed** | 2026-02-13 |

### Documents

| Phase | File |
|-------|------|
| Plan | `e2e-testing/e2e-testing.plan.md` |
| Design | `e2e-testing/e2e-testing.design.md` |
| Analysis | `e2e-testing/e2e-testing.analysis.md` |
| Report | `e2e-testing/e2e-testing.report.md` |

### Summary

5 scope items completed (E2E-1 ~ E2E-5): E2E-1 Playwright 인프라 (`@playwright/test` v1.58.2, playwright.config.ts Chromium-only + webServer + locale ko-KR, package.json 3 scripts, .gitignore), E2E-2 Landing & Navigation 테스트 (4 tests: hero render, CTA navigation, sidebar 5-route iteration, 404 page), E2E-3 Data Upload 테스트 (3 tests: upload page render, ecommerce sample + KPI, SaaS sample + KPI), E2E-4 Funnel Analysis 테스트 (3 tests: empty state, editor render, ecommerce template → chart + conversion %), E2E-5 Retention Analysis 테스트 (3 tests: empty state, controls render, cohort+active event → Day 0 + retention curve). 공통 헬퍼: skipOnboardingTour (localStorage), loadEcommerceSample/loadSaaSSample (텍스트 기반 대기), navigateViaSidebar (클라이언트 라우팅 보존). 8개 파일 변경 (6 신규, 2 수정). 테스트 310 Vitest + 13 Playwright = 323 total. 0 iteration.

---

## ci-e2e

| Item | Detail |
|------|--------|
| **Feature** | CI E2E Integration (GitHub Actions + Playwright) |
| **Match Rate** | 100% (44/44) |
| **Iterations** | 0 |
| **Completed** | 2026-02-13 |

### Documents

| Phase | File |
|-------|------|
| Plan | `ci-e2e/ci-e2e.plan.md` |
| Design | `ci-e2e/ci-e2e.design.md` |
| Analysis | `ci-e2e/ci-e2e.analysis.md` |
| Report | `ci-e2e/ci-e2e.report.md` |

### Summary

4 scope items completed (CI-1 ~ CI-4): CI-1 Playwright 브라우저 캐싱 (actions/cache@v4, package-lock.json hash key), CI-2 Chromium 설치 (`npx playwright install --with-deps chromium`), CI-3 E2E 테스트 실행 (`npx playwright test`, webServer 자동 시작), CI-4 아티팩트 업로드 (actions/upload-artifact@v4, `if: !cancelled()`, 7일 보관). "Run tests" → "Run unit tests" 이름 변경. 1개 파일 변경 (.github/workflows/ci.yml). PR 시 323개 테스트 자동 실행 (310 Vitest + 13 Playwright). 0 iteration.

---

## accessibility-dnd

| Item | Detail |
|------|--------|
| **Feature** | Dashboard Widget Keyboard Accessibility (WCAG 2.1 AA) |
| **Match Rate** | 97.3% (71 PASS, 4 PARTIAL, 0 FAIL / 75 items) |
| **Iterations** | 0 |
| **Completed** | 2026-02-13 |

### Documents

| Phase | File |
|-------|------|
| Plan | `accessibility-dnd/accessibility-dnd.plan.md` |
| Design | `accessibility-dnd/accessibility-dnd.design.md` |
| Analysis | `accessibility-dnd/accessibility-dnd.analysis.md` |
| Report | `accessibility-dnd/accessibility-dnd.report.md` |

### Summary

3 scope items completed (A11Y-1 ~ A11Y-3): A11Y-1 DashboardWidget ARIA 속성 (role="listitem", aria-roledescription, aria-label with position info, tabIndex, aria-hidden on decorative icons, aria-label on buttons replacing title), A11Y-2 Dashboard 키보드 리오더링 (handleMoveUp/handleMoveDown useCallback, reorder() + focus management 50ms timeout, role="list" on grid container, aria-live="polite" announcement region, sr-only CSS class), A11Y-3 i18n 키 9개 (ko/en pages namespace: sortableItem, widgetPosition, widgetHiddenLabel, widgetList, movedTo, halfWidth, fullWidth, hideWidget, showWidget). 4개 파일 변경 (0 신규, 4 수정). 테스트 310/310 통과. 4 PARTIAL 항목 모두 positive deviation (widgetHiddenLabel 이름 충돌 회피, pages namespace 일관성). 0 iteration.

---

## sentry-web-vitals

| Item | Detail |
|------|--------|
| **Feature** | Sentry Performance Monitoring + Core Web Vitals + Source Maps |
| **Match Rate** | 95.8% (68 PASS, 3 FAIL CI env vars — fixed post-analysis) |
| **Iterations** | 0 |
| **Completed** | 2026-02-13 |

### Documents

| Phase | File |
|-------|------|
| Plan | `sentry-web-vitals/sentry-web-vitals.plan.md` |
| Design | `sentry-web-vitals/sentry-web-vitals.design.md` |
| Analysis | `sentry-web-vitals/sentry-web-vitals.analysis.md` |
| Report | `sentry-web-vitals/sentry-web-vitals.report.md` |

### Summary

4 scope items completed (SWV-1 ~ SWV-4): SWV-1 Performance Tracing 활성화 (`browserTracingIntegration()`, `tracesSampleRate: 0.1`, `tracePropagationTargets` Supabase only), SWV-2 Source Maps 업로드 (`@sentry/vite-plugin`, `sourcemap: 'hidden'`, `filesToDeleteAfterUpload`, CI env vars 3개), SWV-3 Custom Performance Spans (`startSpan<T>` + `startSpanAsync<T>` 헬퍼, 5개 lib 모듈 래핑: csvParser, dataProcessor, funnelEngine, retentionEngine, geminiClient), SWV-4 Sentry ErrorBoundary 전환 (class component → `Sentry.ErrorBoundary` + `FallbackUI` 함수 컴포넌트, 기존 UI 100% 유지). 9개 파일 변경 (0 신규, 8 수정 + 1 CI). 신규 devDep: `@sentry/vite-plugin`. 테스트 310/310 통과. 외부 의존: SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT GitHub Secrets 설정. 0 iteration.

---

## perf-optimization

| Item | Detail |
|------|--------|
| **Feature** | React Rendering Performance Optimization |
| **Match Rate** | 100% (15 PASS, 1 PARTIAL / 16 items) |
| **Iterations** | 0 |
| **Completed** | 2026-02-13 |

### Documents

| Phase | File |
|-------|------|
| Plan | `perf-optimization/perf-optimization.plan.md` |
| Design | `perf-optimization/perf-optimization.design.md` |
| Analysis | `perf-optimization/perf-optimization.analysis.md` |
| Report | `perf-optimization/perf-optimization.report.md` |

### Summary

3 scope items completed (PERF-1 ~ PERF-3): PERF-1 AppContext Provider value useMemo (dispatch 안정적 참조 활용, state 변경 없을 시 consumer 리렌더 방지), PERF-2 React.memo 5개 컴포넌트 (DashboardWidget, Sidebar, ExportDropdown, PlanBadge, ChartSkeleton — props 동일 시 리렌더 스킵), PERF-3 Dashboard widgetContent 개별 useMemo (kpiCards 메모이제이션 + 7개 위젯 개별 useMemo + 1개 aggregate Record useMemo — 위젯 간 독립적 캐싱으로 DashboardWidget React.memo 효과 극대화). 7개 파일 변경 (0 신규, 7 수정). 테스트 310/310 통과. 1 PARTIAL: funnelWidget deps에 `funnelResults` 전체 참조 (설계는 `.length` — 안전성 우위 의도적 편차). 0 iteration.

---

## team-collaboration

| Item | Detail |
|------|--------|
| **Feature** | Team Collaboration (Supabase Backend) |
| **Match Rate** | 98.9% (87 PASS, 2 PARTIAL / 89 items) |
| **Iterations** | 0 |
| **Completed** | 2026-02-13 |

### Documents

| Phase | File |
|-------|------|
| Plan | `team-collaboration/team-collaboration.plan.md` |
| Design | `team-collaboration/team-collaboration.design.md` |
| Analysis | `team-collaboration/team-collaboration.analysis.md` |
| Report | `team-collaboration/team-collaboration.report.md` |

### Summary

5 scope items completed (TC-1 ~ TC-5): TC-1 DB Schema (fre_teams + fre_team_members 테이블, RLS 4개 정책, updated_at 트리거, 4개 인덱스), TC-2 TypeScript Types (TeamRole, TeamMemberStatus, TeamMember, Team — types/index.ts로 이동, TeamPage 로컬 타입 제거), TC-3 CRUD Functions (createTeam, getMyTeam, updateTeamName, inviteTeamMember, removeTeamMember, updateMemberRole — supabaseData.ts), TC-4 TeamPage Supabase Integration (localStorage 완전 제거, loading/error/creation 3개 상태 추가, useCallback 전체 적용), TC-5 Team-scoped Project Sharing (fre_projects.team_id 컬럼 + RLS + createProject teamId 파라미터). 6개 파일 변경 (1 신규 migration, 5 수정). i18n 12개 키 추가 (ko/en). 테스트 310/310 통과. 2 PARTIAL: RLS email 비교 시 auth.email() 대신 subquery 사용 (의도적 호환성 개선). 0 iteration.

---

## advanced-filter

| Item | Detail |
|------|--------|
| **Feature** | Advanced Filter/Search (Date Range, Platform, Channel, Insight Type/Search) |
| **Match Rate** | 99.2% (119/121) |
| **Iterations** | 0 |
| **Completed** | 2026-02-13 |

### Documents

| Phase | File |
|-------|------|
| Plan | `advanced-filter/advanced-filter.plan.md` |
| Design | `advanced-filter/advanced-filter.design.md` |
| Analysis | `advanced-filter/advanced-filter.analysis.md` |
| Report | `advanced-filter/advanced-filter.report.md` |

### Summary

6 scope items completed (AF-1 ~ AF-6): AF-1 Filter Types & State (DateRange, ActiveFilters 인터페이스 + 4 actions + 4 reducer cases + initialState), AF-2 useFilteredData Hook (useMemo 날짜/플랫폼/채널 필터링 + filterCount + setter/clear dispatch), AF-3 FilterPanel Component (collapsible UI + date inputs + 7d/30d/90d/All presets + platform/channel checkboxes + clear button), AF-4 Page Integration (Dashboard/FunnelAnalysis/RetentionAnalysis/SegmentComparison/Insights 5개 페이지 FilterPanel + filteredData 사용), AF-5 Insights Filter (type toggle 4종 + search input — local state), AF-6 i18n Keys (17 filter keys ko/en). 14개 파일 변경 (2 신규, 12 수정). 테스트 310/310 통과. 2 minor gaps (unused noFilters key, shortened clearAll label). 0 iteration.

---

## data-connector

| Item | Detail |
|------|--------|
| **Feature** | Data Connector (JSON, Google Sheets, GA4/Mixpanel/Amplitude Export Presets) |
| **Match Rate** | 97.3% (52 PASS, 3 PARTIAL, 0 FAIL) |
| **Iterations** | 0 |
| **Completed** | 2026-02-13 |

### Documents

| Phase | File |
|-------|------|
| Plan | `data-connector/data-connector.plan.md` |
| Design | `data-connector/data-connector.design.md` |
| Analysis | `data-connector/data-connector.analysis.md` |
| Report | `data-connector/data-connector.report.md` |

### Summary

6 scope items completed (DC-1 ~ DC-6): DC-1 Types + Registry (ConnectorType 6종, ExportFormat, ConnectorConfig 인터페이스 + CONNECTORS 레지스트리), DC-2 JSON Connector (parseJSON + 1-level flatten + data/rows/events 래퍼 지원), DC-3 Google Sheets Connector (extractSheetId URL 파싱 + fetchGoogleSheet Supabase Edge Function 프록시), DC-4 Analytics Export Presets (FORMAT_SIGNATURES 3종 + PRESET_MAPPINGS + detectExportFormat 헤더 패턴 매칭 + normalizeTimestamps GA4 μs/Mixpanel unix), DC-5 useCSVUpload 확장 (CSV+JSON 파일 지원 + 포맷 자동 감지 + handleURLImport) + DataImport 소스 선택 UI (6-card selector + Google Sheets URL 입력), DC-6 i18n 17 키 (ko/en). 10개 파일 변경 (4 신규, 6 수정). 테스트 310/310 통과. 3 PARTIAL: Sheets URL edge case, 통합 normalize 함수 (개선), urlRequired key 미사용. 0 iteration.
