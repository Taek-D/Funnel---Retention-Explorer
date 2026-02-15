# Gap Detector Memory

## Project: Funnel & Retention Explorer

### Completed Analyses (see analysis-history.md for details)

| # | Feature | Date | Rate | Items |
|---|---------|------|------|-------|
| 1 | code-quality | 02-09 | 100% | 37/37 |
| 2 | bundle-optimization | 02-09 | 100% | 34/34 (+4 deferred) |
| 3 | payment-integration | 02-10 | 100% | 84/84 |
| 4 | subscription-scheduling | 02-10 | 96.4% | 80/83 P, 3 PARTIAL |
| 5 | annual-billing | 02-10 | 100% | 89/89 |
| 6 | supabase-deployment | 02-10 | 97.6% | 328/335 P, 5 PARTIAL, 2 FAIL |
| 7 | onboarding | 02-10 | 97.6% | 81/85 P, 4 PARTIAL |
| 8 | core-features | 02-10 | 100% | 80/83 P, 3 PARTIAL+ |
| 9 | ops-infrastructure | 02-10 | 100% | 74/74 |
| 10 | ui-polish | 02-10 | 93.5% | 61/69 P, 7 PARTIAL, 1 FAIL |
| 11 | seo-error-pages | 02-11 | 100% | 45/45 |
| 12 | testing-foundation | 02-11 | 100% | 44/44 |
| 13 | i18n | 02-11 | 92.9% | 38/42 P, 2 PARTIAL, 2 FAIL |
| 14 | data-export | 02-11 | 96.5% | 92/99 P, 7 PARTIAL |
| 15 | dashboard-customization | 02-11 | 100% | 92/92 |
| 16 | dashboard-presets | 02-12 | 100% | 59/59 |
| 17 | notification-system | 02-12 | 100% | 38/38 |
| 18 | admin-dashboard | 02-13 | 98.5% | 81/83 P, 2 PARTIAL (v2: full-stack incl. Edge Function + migration) |
| 19 | e2e-testing | 02-13 | 98.5% | 57/66 P, 8 PARTIAL, 1 FAIL |
| 20 | ci-e2e | 02-13 | 100% | 44/44 |
| 21 | accessibility-dnd | 02-13 | 97.3% | 71/75 P, 4 PARTIAL |
| 22 | sentry-web-vitals | 02-13 | 95.8% | 68/71 P, 3 FAIL |
| 23 | perf-optimization | 02-13 | 100% | 15/16 P, 1 PARTIAL |
| 24 | team-collaboration | 02-13 | 98.9% | 87/89 P, 2 PARTIAL |
| 25 | advanced-filter | 02-13 | 99.2% | 119/121 P, 1 PARTIAL, 1 FAIL |
| 26 | data-connector | 02-13 | 97.3% | 52/55 P, 3 PARTIAL |
| 27 | webhook | 02-13 | 100% | 115/115 P, 1 PARTIAL |
| 28 | pwa-offline | 02-13 | 98.6% | 71/72 P, 1 PARTIAL |
| 29 | scheduled-reports | 02-13 | 100% | 22/22 |
| 30 | notification-center | 02-13 | 100% | 23/23 |
| 31 | custom-event-definition | 02-13 | 99.0% | 23/24 P, 1 PARTIAL |
| 32 | funnel-ab-test | 02-13 | 97.6% | 19/21 P, 2 PARTIAL |
| 33 | funnel-editor-enhancement | 02-13 | 100% | 23/23 |
| 34 | data-visualization | 02-13 | 100% | 18/18 |
| 35 | chart-image-download | 02-13 | 100% | 23/23 |
| 36 | user-journey-flow | 02-13 | 100% | 23/23 |
| 37 | funnel-time-analysis | 02-13 | 100% | 19/19 |
| 38 | funnel-comparison | 02-13 | 100% | 24/24 |
| 39 | retention-comparison | 02-13 | 100% | 25/25 P, 2 PARTIAL |
| 40 | cohort-grouping | 02-13 | 100% | 22/22 |
| 41 | performance-optimization-v2 | 02-15 | 98.1% | 53/54 P, 1 PARTIAL |
| 42 | free-beta | 02-15 | 97.8% | 66/69 P, 3 PARTIAL |

### Key Project Patterns

- **Test location**: `__tests__/unit/` and `__tests__/integration/`
- **Constants file**: `lib/constants.ts` -- Analysis-related constants at bottom
- **CSS classes**: `index.html` `<style>` block uses `delay-*` naming (not `animation-delay-*`)
- **Inline style justification**: Dynamic percentage values and dynamic RGB opacity cannot use Tailwind
- **Error messages**: User-facing = Korean, developer-facing = English (kept as-is)
- **Utility extraction**: Common patterns in lib/ extracted to dedicated util files (e.g., eventUtils.ts)
- **Edge Functions**: Deno `serve()` pattern, CORS preflight, JWT auth via `supabase.auth.getUser()`
- **Payment**: TossPayments SDK v2 CDN in index.html, VITE_TOSS_CLIENT_KEY for client, TOSS_SECRET_KEY in Supabase Secrets
- **Plan gating**: Dual validation pattern -- usePlanGate (client) + ai-proxy server-side check
- **DB profiles**: fre_user_profiles with RLS, auto-insert trigger on auth.users, service_role for Edge Functions
- **Vault secrets**: Should be set via Supabase Dashboard, not committed in migration files (vault.create_secret commented out)
- **Subscription states**: none -> active -> cancelled/past_due -> none (lifecycle); cancelled preserves plan until next_billing_date
- **Retry pattern**: RETRY_INTERVALS [1,3,7] days, 3 failures -> past_due, 7-day grace -> free downgrade
- **Webhook security**: HMAC-SHA256 with TossPayments-Signature header; skip verification when secret not set (dev mode)
- **BillingRecord dual definition**: types/index.ts (interface) + planManager.ts (type alias) -- components import from planManager for co-location
- **BILLING_PRICES duplication**: Edge Functions define local BILLING_PRICES/BILLING_INTERVALS (Deno cannot import from client lib/)
- **Proration formula**: credit = Math.round((remainingDays / 30) * monthly), charge = Math.max(0, annual - credit)
- **Annual billing**: billing_cycle column added to fre_user_profiles, BillingCycle type in both types/index.ts and planManager.ts
- **Canvas watermark**: drawWatermark() in reportEngine.ts -- 0.08 alpha, -30deg rotation, centered on PAGE_W/2, PAGE_H/2
- **PDF export**: Canvas -> JPEG (0.92 quality) -> jsPDF; dynamic import of jspdf (~290KB); pdf.save() for download
- **Snapshot sharing**: share_token (UUID) + is_shared (boolean) on fre_analysis_snapshots; RLS public read policy for is_shared=true
- **ShareButton pattern**: 3-state icon flow (Share2 -> Loader2 -> Copy/Check) with 2s copied reset timer
- **FRESnapshot interface**: dataset_name added as optional field; listAllSnapshots uses fre_datasets!inner join
- **GA4 analytics**: lib/analytics.ts with typed GTagEvent map; initGA() in index.tsx (PROD-only); trackPageView in AppShell; trackEvent calls in 8 hooks/components
- **Vercel monitoring**: @vercel/analytics + @vercel/speed-insights as React components in index.tsx; chunked in vendor-monitoring with @sentry
- **CI pipeline**: .github/workflows/ci.yml on pull_request to main; working-directory handles `&` in folder name via YAML quoting
- **CHART_COLORS**: Centralized chart theme tokens in lib/constants.ts; all Recharts components reference tokens instead of hardcoded hex/rgba
- **ARIA pattern**: Modal/Dialog = role="dialog" + aria-modal="true" + aria-labelledby; Toast = role="status" + aria-live="polite" + role="alert" per item; interactive = aria-expanded + aria-haspopup
- **ChartSkeleton**: components/ChartSkeleton.tsx with variant prop (bar/area/table), NOT imported by analysis pages (created but unused in Funnel/Retention/Segment)
- **Exit animations**: animate-fade-out class in index.html; Toast uses exiting flag + 200ms remove; Modal uses visible state + handleClose with 200ms delay
- **SEO meta**: index.html has lang="ko", description, keywords, author, theme-color, canonical, OG tags, Twitter Card, JSON-LD structured data
- **404 page**: NotFoundPage.tsx with lazy loading, catch-all `*` route last in router.tsx
- **Crawling rules**: robots.txt disallows /app/ and /shared/; sitemap.xml lists 4 public URLs
- **Semantic HTML**: LandingPage uses <main> wrapper, aria-label on all <section>s, proper h1->h2->h3 hierarchy
- **Testing infra**: vitest + jsdom + @testing-library/react; setupTests.ts mocks matchMedia/IntersectionObserver/ResizeObserver; helpers/mocks.ts for Supabase/AuthContext/analytics/Sentry/localStorage; helpers/renderWithProviders.tsx for AppProvider+ToastProvider+MemoryRouter wrapper
- **Test pattern**: Hook tests use real provider wrappers (AppProvider+ToastProvider) or vi.mock for context; component tests use vi.mock for Icons; vi.useFakeTimers for animation/timeout tests
- **i18n**: i18next + react-i18next + browser-languagedetector; 3 namespaces (common, pages, insights); fallbackLng='ko'; detection via localStorage 'fre-language'; static import (no HTTP); components use useTranslation(), hooks/lib use i18n.t(); setupTests.ts mocks react-i18next with key-return pattern
- **Data export**: CSV (free) via lib/exportUtils.ts, Excel (Pro) via lib/excelExport.ts with dynamic `import('xlsx')`; useDataExport hook orchestrates; ExportDropdown reusable component; localized headers via dataExport.headers.* i18n keys
- **Dashboard presets**: PRESET_TEMPLATES in constants.ts; applyPreset in useDashboardLayout; resetToDefault delegates to applyPreset('default')
- **PRESET_ICON_MAP**: Dashboard.tsx maps icon string names to React components for dynamic icon rendering from constants
- **Notification persistence**: fre_notifications table; supabaseData.ts has 6 CRUD functions; NotificationContext uses useAuth() for DB sync, guest in-memory fallback
- **Notification preferences**: NotificationPreferencesModal.tsx exports loadNotificationPreferences(); localStorage key 'fre_notification_prefs'; Context checks prefs before addNotification
- **NotificationPreferences type co-location**: Defined in NotificationPreferencesModal.tsx (not types/index.ts), consistent with BillingRecord pattern
- **Admin role system**: UserRole type in types/index.ts + planManager.ts; isAdmin() in planManager; AdminRoute.tsx guards /app/admin/*; Sidebar conditional admin menu with __divider__ pattern
- **Admin API client**: lib/adminApi.ts with adminFetch<T> generic helper; 5 types (AdminStats, AdminUser, AdminUserDetail, AdminBillingRecord, RevenueData); 6 exported functions
- **Admin pages**: AdminDashboard (4 KPI + BarChart + PieChart), AdminUsers (table + search + filter + modal), AdminBilling (revenue chart + billing table + filter)
- **AdminNav**: 3-tab sub-navigation component shared across all admin pages
- **E2E testing**: Playwright in e2e/ dir; helpers/ has skipOnboardingTour + loadEcommerceSample + loadSaaSSample + navigateViaSidebar; npm scripts omit `npx` (resolved via node_modules/.bin); .gitignore missing `e2e/.auth/` from design
- **Dashboard a11y DnD**: Keyboard reordering via ArrowUp/Down + aria-live announcements; i18n keys in pages namespace (not common); `widgetHiddenLabel` key avoids collision with existing `widgetHidden`
- **Sentry Performance**: lib/sentry.ts has initSentry() + startSpan/startSpanAsync helpers; browserTracingIntegration + tracesSampleRate 0.1; 5 lib modules wrapped (csvParser, dataProcessor, funnelEngine, retentionEngine, geminiClient); sentryVitePlugin in vite.config.ts with sourcemap:'hidden'; Sentry.ErrorBoundary in ErrorBoundary.tsx replaces class component
- **Team collaboration**: fre_teams + fre_team_members tables; Team/TeamMember/TeamRole types in types/index.ts; 6 CRUD functions in supabaseData.ts; TeamPage.tsx fully Supabase-backed (no localStorage); fre_projects.team_id for team-scoped sharing; RLS uses subquery `(SELECT email FROM auth.users WHERE id = auth.uid())` instead of `auth.email()`
- **Advanced filter**: DateRange/ActiveFilters in types/index.ts; 4 actions (SET_DATE_RANGE/SET_PLATFORM_FILTER/SET_CHANNEL_FILTER/CLEAR_FILTERS); useFilteredData hook (useMemo filtering); FilterPanel self-contained (derives platforms/channels from state, not props); 5 pages integrate FilterPanel; Insights has local typeFilter/searchQuery; filter.noFilters i18n key designed but unused
- **Data connectors**: ConnectorType/ExportFormat/ConnectorConfig in types/index.ts; CONNECTORS registry in lib/connectors/index.ts (6 entries); jsonConnector.ts (parseJSON with 1-level flatten); googleSheetsConnector.ts (extractSheetId + fetchGoogleSheet via sheets-proxy Edge Function); presetTransformers.ts (FORMAT_SIGNATURES + PRESET_MAPPINGS + unified normalizeTimestamps); useCSVUpload extended with handleURLImport + JSON support; DataImport.tsx has 6-card source selector; CONNECTOR_ICONS map for dynamic icon rendering; urlRequired i18n key designed but unused (button disabled handles UX)
- **Webhook system**: WebhookConfig/WebhookLog/WebhookFormat/WebhookEventType in types/index.ts; fre_webhooks + fre_webhook_logs tables with RLS; 5 CRUD functions in supabaseData.ts; webhookDispatcher.ts with 60s TTL cache + fire-and-forget dispatch to Edge Function; webhookFormatters.ts with detectWebhookFormat (URL pattern) + formatPayload (slack blocks/discord embeds/json); NotificationContext.tsx integrates dispatchWebhooks in addNotification (logged-in only); WebhookSettings.tsx full CRUD page at /app/webhooks; invalidateWebhookCache on all mutations
- **PWA offline**: vite-plugin-pwa with registerType:'prompt', manifest:false (uses public/manifest.json); SVG icons (not PNG) in public/icons/; useOnlineStatus hook (SSR-safe navigator check); OfflineBanner in AppShell; useInstallPrompt hook + icon-only Download button in Sidebar; UpdatePrompt with useRegisterSW in index.tsx; 6 pwa.* i18n keys; tsconfig types includes vite-plugin-pwa/react
- **Scheduled reports**: ScheduledReport/ReportFrequency types in types/index.ts; fre_scheduled_reports table with RLS + service_role policies; 4 CRUD functions in supabaseData.ts; scheduledReportBuilder.ts with buildScheduledPayload + formatSummaryText (no DOM); Edge Function scheduled-report/index.ts (hourly cron, query by hour_utc, filter by frequency+day, dispatch via webhook-dispatch); ScheduledReports.tsx CRUD page with Pro gating + login guard; 24 scheduledReport.* i18n keys + nav.scheduledReports; Clock icon in Sidebar
- **Notification center**: Supabase Realtime subscription in NotificationContext (channel per user_id, dedup, cleanup); useDesktopNotification hook + showDesktopNotification standalone; NotificationsPage with type filter chips, unread toggle, bulk ops, load-more pagination, login guard; NotificationPanel "View All" link to full page; notification_preferences JSONB column on fre_user_profiles; getNotificationPreferences/updateNotificationPreferences in supabaseData.ts; DB sync on modal open (logged-in), save syncs both localStorage + DB; 12 notificationPage.* i18n keys + nav.notifications
- **Funnel A/B test**: ABSegmentFilter/ABTestSegment/ABTestStepResult/ABTestResult in types/index.ts; abTestEngine.ts with runABTest + filterBySegment + calculateConfidenceInterval (2-prop CI) + calculateRequiredSampleSize (power analysis); reuses calculatePValue from segmentEngine; ABTestPage.tsx with SegmentSelector (platform/channel/custom) + step builder (max 8) + grouped BarChart + comparison table + CI footer; FlaskConical icon in Sidebar; filterBySegment custom case is pass-through (does not resolve custom events)
- **Saved funnels**: SavedFunnel interface in types/index.ts; fre_saved_funnels table; 4 CRUD in supabaseData.ts (throw on error); HTML5 DnD with dragIndex/dragOverIndex state; GripVertical handle + ChevronUp/Down preserved; Save modal with name-match overwrite detection (no editingFunnelId); guest fallback via localStorage 'fre-funnel-templates'; Save icon from Icons.tsx; 10 funnel.* i18n keys
- **Data visualization**: CHART_COLORS.palette (8 colors) + dropoffColor(rate) threshold function in constants.ts; FunnelAnalysis drop-off chart (vertical BarChart, toggle with show/hide i18n, Cell fill via dropoffColor); SegmentComparison Recharts BarChart replaces CSS bars (chartData useMemo, palette Cell fill, tooltip with n= notation); RetentionAnalysis hoverCell tooltip (fixed position, absolute user count + rate); 6 new i18n keys (funnel.dropoffTitle/dropoffRate/showDropoff/hideDropoff, retention.retained/rate)
- **Chart image download**: ChartDownloadButton component (targetRef + filename props); html2canvas dynamic import with scale:2, backgroundColor:'#0f1117', useCORS:true; Camera + LoaderCircle icons; disabled={downloading} double-click prevention; 7 refs across 4 pages (funnelChartRef, dropoffChartRef, cohortTableRef, retentionCurveRef, segmentChartRef, dashFunnelRef, dashRetentionRef); 2 chart.* i18n keys (downloadPng, downloading)
- **User journey flow**: JourneyNode/JourneyLink/JourneyFlowData/JourneyOptions types in journeyEngine.ts (not types/index.ts); buildJourneyFlow groups by userId, sorts by timestamp, step-prefixes nodes ("Step N: event") to prevent Sankey loops; minFlowPct threshold filtering; UserJourneyFlow.tsx with Recharts Sankey + CustomNode (palette-colored rect+text) + CustomLink (palette-colored path); ChartDownloadButton included (design listed as out-of-scope but implemented); ArrowRightLeft icon in Sidebar; 11 journey.* i18n keys + nav.journey
- **Funnel time analysis**: FunnelTimeStats interface in types/index.ts; FunnelStep.timeStats optional field (medianTime preserved for backward compat); calculateTimeBetweenSteps in funnelEngine.ts returns { median, p10, p90, mean, count } with zero-object for empty times; FunnelAnalysis.tsx vertical BarChart with p90 (opacity 0.2) + median bars; bottleneck = highest median + red #ef4444; AlertTriangle hint; timeChartRef + ChartDownloadButton filename="funnel-time-analysis"; 8 funnel.time* i18n keys; noTimeData key defined but unused (hidden approach)
- **Funnel comparison**: FunnelComparisonStep/FunnelComparisonResult types in funnelEngine.ts (not types/index.ts); compareFunnels zips two FunnelStep[] arrays with 0.5pp direction threshold; FunnelComparison.tsx with period A/B date inputs, select-based step builder, grouped BarChart (palette[0]/[1]), comparison table with pp diff + TrendingUp/Down icons, ChartDownloadButton; GitCompareArrows icon in Sidebar; 17 funnelCompare.* i18n keys + nav.funnelCompare
- **Retention comparison**: RetentionComparisonDay/RetentionComparisonResult types in retentionEngine.ts; compareRetention averages retention per day across cohorts with 0.5pp direction threshold; RetentionComparison.tsx with cohort/active event selectors + period A/B date inputs + LineChart (palette[0]/[1]) + comparison table + ChartDownloadButton; Diff icon in Sidebar; 17 retentionCompare.* i18n keys + nav.retentionCompare; desc text says "curves" not "rates" (intentional refinement)
- **Cohort grouping**: CohortGrouping type ('daily'|'weekly'|'monthly') in types/index.ts; WEEKLY_RETENTION_MAX_PERIODS=12, MONTHLY_RETENTION_MAX_PERIODS=6 in constants.ts; groupDateKey + advancePeriodKey helpers in retentionEngine.ts; calculateActivityRetention 4th param with prefix D/W/M; useRetentionAnalysis cohortGrouping state; 3-button toggle in RetentionAnalysis + RetentionComparison; 8 i18n keys (4 retention.* + 4 retentionCompare.*); known issue: compareRetention sort only strips 'D' prefix (not W/M), RetentionComparison uses chartRef prop instead of targetRef
- **Engine caching**: lib/engineCache.ts with WeakMap<object, Map<string, T>>; createEngineCache/getCached/setCached; applied to funnelEngine (2 caches), retentionEngine (2 caches), insightsEngine (1 cache); cache key = param hash string; WeakMap auto-invalidation on data ref change; inner _function pattern for cached engines
- **Hook return memoization**: useFunnelAnalysis, useRetentionAnalysis, useAIInsights all wrap return in useMemo; deps include state fields + stable callbacks
- **Virtual scrolling**: @tanstack/react-virtual v3; Insights.tsx useVirtualizer with enabled flag (> 10 items), estimateSize 200, overscan 3; measureElement for dynamic sizing; Dashboard saved analyses NOT virtualized (design gap, low impact)
- **FilterPanel memo**: React.memo(FilterPanelInner) pattern with displayName; FilterPanelInner named component + memo export
- **useDebounce**: Generic hook in hooks/useDebounce.ts; useState+useEffect+setTimeout pattern; Insights searchQuery 300ms debounce
- **Free beta**: VITE_BETA_MODE env var; lib/betaConfig.ts with isBetaMode/isBetaExpired/isBetaActive; getEffectivePlan/getEffectiveLimits in planManager.ts override to 'pro' during beta; usePlanGate returns isBeta field; BetaBanner (dismissible, localStorage fre_beta_banner_dismissed); FeedbackWidget (floating bottom-right, submitFeedback to fre_beta_feedback table or localStorage queue); PricingSection all W0 + toggle hidden; HeroSection beta badge; SignupPage beta branding + trackEvent('beta_signup'); 15 beta.* + 4 landing.beta* i18n keys
- **Custom events**: CustomEventType/CustomEventCondition/CustomEventDefinition in types/index.ts; fre_custom_events table (definition JSONB) with 4 per-op RLS policies; 4 CRUD in supabaseData.ts (console.error not throw); eventResolver.ts with resolveCustomEvent + resolveCustomEventRows + resolveStepsWithCustomEvents + isCustomEventRef + getCustomEventId (no getMergedEventList -- inline optgroup instead); CustomEventsPage.tsx full CRUD + guest localStorage; FunnelAnalysis/RetentionAnalysis optgroup dropdowns; useFunnelAnalysis/useRetentionAnalysis resolve custom: refs; Tag icon in Sidebar; 30 i18n keys in customEvents + nav.events
