# Annual Billing Gap Analysis

> **Match Rate: 100% (89/89 PASS)**
>
> **Feature**: annual-billing
> **Design Document**: `docs/02-design/features/annual-billing.design.md`
> **Analysis Date**: 2026-02-10
> **Build**: Vite SUCCESS (27 chunks), Vitest 98/98 PASS, TypeScript 0 errors

---

## Summary

| Status | Count |
|--------|:-----:|
| PASS | 89 |
| PARTIAL | 0 |
| FAIL | 0 |

---

## Detailed Results

### AB-1: fre_user_profiles Schema Extension (5 items)

**File**: `supabase/migrations/20260210_annual_billing.sql`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 1 | Migration SQL file `supabase/migrations/20260210_annual_billing.sql` exists | PASS | File exists, 7 lines |
| 2 | ALTER TABLE adds `billing_cycle TEXT NOT NULL DEFAULT 'monthly'` | PASS | Line 5: `ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'` |
| 3 | CHECK constraint: `billing_cycle IN ('monthly', 'annual')` | PASS | Line 6: `CHECK (billing_cycle IN ('monthly', 'annual'))` |
| 4 | `IF NOT EXISTS` for idempotent execution | PASS | Line 5: `ADD COLUMN IF NOT EXISTS` |
| 5 | No destructive changes to existing columns | PASS | Only ADD COLUMN, no ALTER/DROP of existing columns |

### AB-2: types/index.ts + planManager.ts Type Updates (8 items)

**Files**: `types/index.ts`, `lib/planManager.ts`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 6 | `types/index.ts` exports `BillingCycle = 'monthly' \| 'annual'` | PASS | Line 5: `export type BillingCycle = 'monthly' \| 'annual';` |
| 7 | `types/index.ts` `UserProfile` has `billing_cycle: BillingCycle` field | PASS | Line 18: `billing_cycle: BillingCycle;` |
| 8 | `planManager.ts` has `BillingCycle` type | PASS | Line 7: `export type BillingCycle = 'monthly' \| 'annual';` |
| 9 | `planManager.ts` `UserProfile` has `billing_cycle` field | PASS | Line 20: `billing_cycle: BillingCycle;` |
| 10 | `planManager.ts` exports `BILLING_PRICES` constant `{ monthly: 29_000, annual: 278_400 }` | PASS | Lines 30-33: `{ monthly: 29_000, annual: 278_400 } as const` |
| 11 | `planManager.ts` exports `BILLING_INTERVALS` constant `{ monthly: 30, annual: 365 }` | PASS | Lines 35-38: `{ monthly: 30, annual: 365 } as const` |
| 12 | Both UserProfile definitions are consistent (same fields) | PASS | Both have identical 15 fields: id, plan, plan_started_at, toss_customer_key, toss_billing_key, subscription_status, next_billing_date, ai_calls_today, ai_calls_reset_at, csv_row_limit, billing_cycle, retry_count, grace_period_end, cancelled_at, created_at, updated_at |
| 13 | PLAN_LIMITS unchanged (Pro features same regardless of cycle) | PASS | Lines 42-45: free/pro limits unchanged from prior implementation |

### AB-3: issue-billing Edge Function Modification (8 items)

**File**: `supabase/functions/issue-billing/index.ts`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 14 | Reads `billingCycle` from request body | PASS | Line 38/48: `let body: { authKey: string; billingCycle?: string }`, destructured as `billingCycle: rawCycle` |
| 15 | Default billingCycle = 'monthly' when not provided | PASS | Line 56: `const billingCycle = rawCycle ?? 'monthly';` |
| 16 | Validates billingCycle is 'monthly' or 'annual' (400 if invalid) | PASS | Lines 57-61: `if (!['monthly', 'annual'].includes(billingCycle))` returns 400 with "유효하지 않은 결제 주기입니다." |
| 17 | Payment amount uses `BILLING_PRICES[billingCycle]` (29,000 or 278,400) | PASS | Line 125: `amount: BILLING_PRICES[billingCycle]` |
| 18 | next_billing_date uses `BILLING_INTERVALS[billingCycle]` (30 or 365 days) | PASS | Line 141: `nextBillingDate.setDate(nextBillingDate.getDate() + BILLING_INTERVALS[billingCycle])` |
| 19 | DB UPDATE includes `billing_cycle` field | PASS | Line 151: `billing_cycle: billingCycle` in update object |
| 20 | Response includes `billingCycle` field | PASS | Line 168: `billingCycle` in JSON response |
| 21 | orderName reflects billing cycle ("월간" or "연간") | PASS | Line 127: `` `FRE Analytics Pro ${billingCycle === 'annual' ? '연간' : '월간'} 구독` `` |

### AB-4: process-billing Edge Function Modification (7 items)

**File**: `supabase/functions/process-billing/index.ts`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 22 | BILLING_AMOUNT constant removed or replaced with dynamic lookup | PASS | No BILLING_AMOUNT constant exists; replaced with `BILLING_PRICES` (line 12) and dynamic lookup per profile |
| 23 | Payment amount = `BILLING_PRICES[profile.billing_cycle]` or equivalent | PASS | Line 65: `const billingAmount = BILLING_PRICES[cycle] ?? BILLING_PRICES.monthly;` |
| 24 | Renewal interval = `BILLING_INTERVALS[profile.billing_cycle]` or equivalent (30 or 365 days) | PASS | Line 66: `const billingInterval = BILLING_INTERVALS[cycle] ?? BILLING_INTERVALS.monthly;` |
| 25 | orderName reflects profile.billing_cycle | PASS | Line 82: `` `FRE Analytics Pro ${cycleName} 구독 갱신` `` where cycleName = `'연간'` or `'월간'` (line 67) |
| 26 | billing_history INSERT uses dynamic amount | PASS | Lines 103, 116: `amount: billingAmount` (dynamic per profile) |
| 27 | Fallback to monthly if billing_cycle is null/undefined | PASS | Line 64: `const cycle = profile.billing_cycle ?? 'monthly';` with fallback also on lines 65-66 |
| 28 | Existing retry logic unchanged (RETRY_INTERVALS, GRACE_PERIOD_DAYS) | PASS | Lines 9-10: `RETRY_INTERVALS = [1, 3, 7]`, `GRACE_PERIOD_DAYS = 7`; full retry/grace logic at lines 111-144, 192-228 unchanged |

### AB-5: change-billing-key Edge Function (9 items)

**File**: `supabase/functions/change-billing-key/index.ts`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 29 | File `supabase/functions/change-billing-key/index.ts` exists | PASS | File exists, 139 lines |
| 30 | corsHeaders + OPTIONS handling | PASS | Lines 4-7: corsHeaders defined; Lines 10-12: OPTIONS returns 'ok' |
| 31 | JWT auth (supabase.auth.getUser) | PASS | Lines 22-33: createClient with Authorization header, `supabase.auth.getUser()` |
| 32 | authKey extracted from request body | PASS | Lines 35-51: body parsed, `const { authKey } = body;` with missing check |
| 33 | TossPayments `/v1/billing/authorizations/issue` called with authKey + customerKey | PASS | Lines 81-91: POST to `https://api.tosspayments.com/v1/billing/authorizations/issue` with `{ authKey, customerKey: profile.toss_customer_key }` |
| 34 | Previous billingKey DELETE attempted (with try-catch) | PASS | Lines 104-116: `if (profile.toss_billing_key)` then DELETE with try-catch, comment: "Ignore delete failure -- new key is already issued" |
| 35 | DB UPDATE: `toss_billing_key = newBillingKey` only (no plan/cycle/date change) | PASS | Lines 119-122: `.update({ toss_billing_key: newBillingKey })` -- single field only |
| 36 | Success response: `{ success: true, message: "결제 수단이 변경되었습니다." }` | PASS | Lines 131-134: exact match |
| 37 | Error responses: 401 (auth), 400 (authKey missing), 500 (API/DB failure) | PASS | 401 at lines 16-19/29-32; 400 at lines 46-50; 500 at lines 94-98/124-128 |

### AB-6: switch-plan Edge Function (12 items)

**File**: `supabase/functions/switch-plan/index.ts`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 38 | File `supabase/functions/switch-plan/index.ts` exists | PASS | File exists, 190 lines |
| 39 | corsHeaders + OPTIONS handling | PASS | Lines 4-7: corsHeaders; Lines 16-18: OPTIONS returns 'ok' |
| 40 | JWT auth (supabase.auth.getUser) | PASS | Lines 28-39: createClient + `supabase.auth.getUser()` |
| 41 | targetCycle extracted from request body | PASS | Lines 41-51: body parsed, `const { targetCycle } = body;` |
| 42 | Validates targetCycle !== current billing_cycle (400 if same) | PASS | Lines 83-87: `if (profile.billing_cycle === targetCycle)` returns 400 "이미 해당 주기입니다." |
| 43 | Validates subscription_status === 'active' (400 if not) | PASS | Lines 76-80: `if (profile.subscription_status !== 'active')` returns 400 "활성 구독이 필요합니다." |
| 44 | Monthly to Annual: remainingDays calculated from next_billing_date | PASS | Lines 104-105: `const nextBilling = profile.next_billing_date ? new Date(profile.next_billing_date) : today; const remainingDays = daysBetween(today, nextBilling);` |
| 45 | Monthly to Annual: credit = Math.round((remainingDays / 30) * 29_000) | PASS | Line 106: `const credit = Math.round((remainingDays / 30) * BILLING_PRICES.monthly);` where BILLING_PRICES.monthly = 29000 |
| 46 | Monthly to Annual: chargeAmount = Math.max(0, 278_400 - credit) | PASS | Line 107: `const chargeAmount = Math.max(0, BILLING_PRICES.annual - credit);` where BILLING_PRICES.annual = 278400 |
| 47 | Monthly to Annual: TossPayments billing API called with chargeAmount (if > 0) | PASS | Lines 109-128: `if (chargeAmount > 0 && profile.toss_billing_key)` POST to `https://api.tosspayments.com/v1/billing/${profile.toss_billing_key}` with `amount: chargeAmount` |
| 48 | Monthly to Annual: DB UPDATE billing_cycle='annual', next_billing_date = today + 365 | PASS | Lines 150-159: update `{ billing_cycle: 'annual', next_billing_date: newNextDate }` where `newNextDate.setDate(newNextDate.getDate() + 365)` |
| 49 | Annual to Monthly: DB UPDATE billing_cycle='monthly' only (next_billing_date preserved) | PASS | Lines 174-177: `.update({ billing_cycle: 'monthly' })` -- only billing_cycle, next_billing_date preserved in response (line 183) |

### AB-7: PricingPage Renewal (7 items)

**File**: `pages/PricingPage.tsx`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 50 | billingCycle state: `useState<'monthly' \| 'annual'>('monthly')` | PASS | Line 36: `const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');` (BillingCycle = 'monthly' \| 'annual') |
| 51 | Toggle UI between monthly/annual | PASS | Lines 49-61: Toggle button with `onClick={() => setBillingCycle(isAnnual ? 'monthly' : 'annual')}`, sliding dot, label text |
| 52 | Pro card shows W29,000/month (monthly) or W23,200/month + W278,400/year (annual) | PASS | Lines 97-103: `isAnnual ? annualPerMonth : monthlyPerMonth` (annualPerMonth = Math.round(278400/12) = 23200); annual shows additional "W278,400 연간 결제" |
| 53 | "연 W69,600 절약" badge visible when annual selected | PASS | Lines 105-108: `{isAnnual && ...}` div showing `연 W{annualSavings.toLocaleString()} 절약` where annualSavings = 29000*12 - 278400 = 69600 |
| 54 | Pro start button passes billingCycle to navigation/modal | PASS | Line 123: `to={user ? \`/app/dashboard?billingCycle=${billingCycle}\` : '/signup'}` |
| 55 | FAQ answer updated to mention annual option | PASS | Line 22: FAQ mentions "월간(W29,000/월) 또는 연간(W278,400/년, 20% 할인) 중 선택" |
| 56 | Free card unchanged regardless of toggle | PASS | Lines 68-88: Free card has no billingCycle dependency, shows W0 always |

### AB-8: UpgradeModal Modification (6 items)

**File**: `components/UpgradeModal.tsx`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 57 | `billingCycle` state or prop | PASS | Line 50: `const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');` |
| 58 | Radio/toggle UI for monthly vs annual selection | PASS | Lines 130-148: Two `<label>` with `<input type="radio">` for monthly/annual, styled with active state highlighting |
| 59 | Price display changes based on billingCycle | PASS | Lines 54, 151-153: `displayPrice = billingCycle === 'annual' ? annualPerMonth : BILLING_PRICES.monthly`, displayed as `W{displayPrice.toLocaleString()}/월` |
| 60 | handleUpgrade passes billingCycle via successUrl query param | PASS | Line 65: `successUrl: \`${window.location.origin}/app/billing/success?billingCycle=${billingCycle}\`` |
| 61 | Monthly shows W29,000/월, Annual shows W23,200/월 (W278,400/년) | PASS | Line 136: monthly "W29,000/월"; Lines 143-146: annual "W23,200/월" + "20% 할인" badge + "W278,400/년" |
| 62 | Default selection: monthly | PASS | Line 50: `useState<BillingCycle>('monthly')` |

### AB-9: SubscriptionPage Extension (8 items)

**File**: `pages/SubscriptionPage.tsx`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 63 | "결제 수단 변경" button visible for active subscriptions | PASS | Lines 115-121: `SubscriptionStatus` receives `onChangeBillingKey` prop; button rendered when status==='active' (SubscriptionStatus.tsx line 102-111) |
| 64 | "결제 수단 변경" calls TossPayments.requestBillingAuth with mode=change | PASS | Lines 59-73: `handleChangeBillingKey` calls `tossPayments.requestBillingAuth` with `successUrl` containing `?mode=change` |
| 65 | "연간 전환" or "월간 전환" button visible based on current billing_cycle | PASS | Line 120: `onSwitchPlan` prop passed; SubscriptionStatus.tsx line 117: button text `{userProfile.billing_cycle === 'annual' ? '월간 전환' : '연간 전환'}` |
| 66 | Plan switch confirmation modal with proration explanation | PASS | Lines 182-224: Modal with title based on current cycle, proration explanation for monthly->annual, next-renewal explanation for annual->monthly |
| 67 | switchPlan() function in planManager.ts called with accessToken + targetCycle | PASS | Line 83: `await switchPlan(session.access_token, targetCycle)` |
| 68 | changeBillingKey() function in planManager.ts (or redirect approach) | PASS | Lines 59-73: Uses redirect approach via TossPayments.requestBillingAuth -> BillingSuccessPage calls planManager.changeBillingKey |
| 69 | After successful switch: refreshProfile() + refetch billingHistory | PASS | Lines 86-91: `await refreshProfile(); const updated = await fetchBillingHistory(user.id); setBillingHistory(updated);` |
| 70 | Error display for failed switch/change | PASS | Lines 93, 106-109: `setCancelResult(result.message)` displayed in accent-colored alert div |

### AB-10: SubscriptionStatus Extension (4 items)

**File**: `components/SubscriptionStatus.tsx`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 71 | "결제 주기" row showing "월간 구독" or "연간 구독" based on billing_cycle | PASS | Lines 61-68: `{userProfile.billing_cycle === 'annual' ? '연간 구독' : '월간 구독'}` |
| 72 | "결제 금액" row shows correct amount based on billing_cycle | PASS | Lines 70-79: conditional amount display based on billing_cycle |
| 73 | billing_cycle='monthly': "W29,000/월", billing_cycle='annual': "W278,400/년" | PASS | Lines 74-76: `annual ? W${BILLING_PRICES.annual.toLocaleString()}/년 : W${BILLING_PRICES.monthly.toLocaleString()}/월` |
| 74 | "결제 수단 변경" and "플랜 전환" buttons added (or in parent SubscriptionPage) | PASS | Lines 102-128: Both buttons in SubscriptionStatus component -- "결제 수단 변경" (line 109) and "연간 전환"/"월간 전환" (line 117) |

### AB-11: BillingSuccessPage Modification (5 items)

**File**: `pages/BillingSuccessPage.tsx`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 75 | Reads `mode` from searchParams | PASS | Line 17: `const mode = searchParams.get('mode');` |
| 76 | `mode=change`: calls change-billing-key instead of issue-billing | PASS | Lines 36-56: `if (mode === 'change')` fetches `/functions/v1/change-billing-key` |
| 77 | `mode=change`: success message "결제 수단이 변경되었습니다." | PASS | Line 59: `setSuccessMessage('결제 수단이 변경되었습니다.');` |
| 78 | Default mode: reads `billingCycle` from searchParams, passes to issue-billing | PASS | Line 18: `const billingCycle = searchParams.get('billingCycle') ?? 'monthly';` Line 71: `body: JSON.stringify({ authKey, billingCycle })` |
| 79 | Success message reflects billing cycle ("Pro 월간/연간 업그레이드 완료") | PASS | Lines 84-85: `const cycleName = billingCycle === 'annual' ? '연간' : '월간'; setSuccessMessage(\`Pro ${cycleName} 업그레이드 완료!\`)` |

### AB-12: Constants + FAQ Update (3 items)

**File**: `pages/PricingPage.tsx`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 80 | PricingPage FAQ includes annual billing question/answer | PASS | Line 22: FAQ q "구독은 어떻게 결제되나요?" a mentions "연간(W278,400/년, 20% 할인)" |
| 81 | PricingPage FAQ mentions proration for plan switching | PASS | Line 24: FAQ q "월간<->연간 전환이 가능한가요?" a "남은 기간의 일할 계산(크레딧)이 적용되어 차액만 결제됩니다" |
| 82 | comparisonFeatures array unchanged (Pro features same for both cycles) | PASS | Lines 9-19: comparisonFeatures has no billing_cycle dependency, identical to pre-annual-billing design |

### Common: planManager.ts Function Addition (4 items)

**File**: `lib/planManager.ts`

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 83 | `changeBillingKey(accessToken, authKey)` function exported | PASS | Lines 150-171: `export async function changeBillingKey(accessToken: string, authKey: string)` |
| 84 | `switchPlan(accessToken, targetCycle)` function exported | PASS | Lines 173-197: `export async function switchPlan(accessToken: string, targetCycle: BillingCycle)` |
| 85 | Both functions call Supabase Edge Functions via fetch | PASS | changeBillingKey: line 159 fetches `/functions/v1/change-billing-key`; switchPlan: line 185 fetches `/functions/v1/switch-plan` |
| 86 | Both functions return `{ success, message, ... }` format | PASS | changeBillingKey returns `{ success: boolean; message: string }` (line 150); switchPlan returns `{ success: boolean; message: string; billingCycle?; nextBillingDate?; charged? }` (line 173) |

### Common: Build & Test (3 items)

| # | Check Item | Status | Notes |
|---|-----------|:------:|-------|
| 87 | Existing tests all pass | PASS | Vitest: 98/98 tests PASS (14 test files) -- user-provided build result |
| 88 | Vite build succeeds | PASS | Vite build: SUCCESS (27 chunks, no errors) -- user-provided build result |
| 89 | No TypeScript type errors | PASS | TypeScript: 0 type errors -- user-provided build result |

---

## Beneficial Additions (Design X, Implementation O)

| Item | Implementation Location | Description |
|------|------------------------|-------------|
| daysBetween helper | `switch-plan/index.ts` line 11-13 | `daysBetween(a, b)` utility function for proration calculation. Clean separation not explicitly designed but follows good practice |
| mode=change redirect | `BillingSuccessPage.tsx` line 90 | After `mode=change` success, redirects to `/app/subscription` (not `/app/dashboard`). Logical UX improvement not explicitly specified in design |
| cycleName in process-billing | `process-billing/index.ts` line 67 | `const cycleName = cycle === 'annual' ? '연간' : '월간';` extracted as variable for readability |
| annualPerMonth + annualSavings | `PricingPage.tsx` lines 29-31 | Pre-calculated constants outside component for performance, derived from BILLING_PRICES |
| switch-plan targetCycle validation | `switch-plan/index.ts` lines 52-57 | Additional `['monthly', 'annual'].includes(targetCycle)` check before profile lookup. Defense-in-depth not explicitly in design |

---

## Design-Implementation Consistency Notes

1. **Error messages**: All Korean error messages in Edge Functions match the design's Error Handling table (Section 6.1) exactly.
2. **Proration formula**: `credit = Math.round((remainingDays / 30) * 29_000)` and `chargeAmount = Math.max(0, 278_400 - credit)` match design Section 4.4 precisely.
3. **Annual-to-Monthly behavior**: Design says "next_billing_date 유지" and implementation preserves it by only updating `billing_cycle`.
4. **billing_history recording**: switch-plan records both success and failure cases in billing_history (lines 133-140), matching design item #8 "billing_history INSERT (성공 or 실패)".
5. **BILLING_PRICES duplication**: Both issue-billing and process-billing define local `BILLING_PRICES` constants rather than importing from a shared module. This is expected for Deno Edge Functions which cannot import from the client-side lib/ directory.

---

## Files Analyzed

| File | Lines | Role |
|------|:-----:|------|
| `supabase/migrations/20260210_annual_billing.sql` | 7 | DB migration |
| `types/index.ts` | 238 | TypeScript interfaces |
| `lib/planManager.ts` | 220 | Plan management + billing functions |
| `supabase/functions/issue-billing/index.ts` | 174 | New subscription billing |
| `supabase/functions/process-billing/index.ts` | 243 | Auto-renewal billing |
| `supabase/functions/change-billing-key/index.ts` | 139 | Billing key change |
| `supabase/functions/switch-plan/index.ts` | 190 | Monthly/annual switch |
| `pages/PricingPage.tsx` | 217 | Pricing page UI |
| `components/UpgradeModal.tsx` | 174 | Upgrade modal UI |
| `pages/SubscriptionPage.tsx` | 228 | Subscription management UI |
| `components/SubscriptionStatus.tsx` | 132 | Subscription status display |
| `pages/BillingSuccessPage.tsx` | 151 | Billing success callback |
| **Total** | **2,113** | **12 files** |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-10 | Initial gap analysis -- 89/89 PASS (100%) | Claude Code (gap-detector) |
