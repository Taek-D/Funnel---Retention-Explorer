# Design: Free Beta Launch

## Reference
- Plan: `docs/01-plan/features/free-beta.plan.md`

## Architecture

### Beta Mode Flag System

```
VITE_BETA_MODE=true (Vercel env)
        │
        ▼
  lib/betaConfig.ts
  ├── isBetaMode(): boolean
  ├── BETA_END_DATE: string
  └── BETA_MAX_ROWS: number
        │
        ├──► planManager.ts (getEffectiveLimits)
        ├──► usePlanGate.ts (isPro override)
        ├──► PricingSection.tsx (₩0 display)
        ├──► BetaBanner.tsx (AppShell 상단)
        ├──► FeedbackWidget.tsx (AppShell 하단)
        └──► SignupPage.tsx (베타 브랜딩)
```

## Detailed Design

### F-01: `lib/betaConfig.ts` (~25 lines)

```typescript
export function isBetaMode(): boolean {
  return import.meta.env.VITE_BETA_MODE === 'true';
}

export const BETA_END_DATE = '2026-04-30';

export function isBetaExpired(): boolean {
  if (!isBetaMode()) return false;
  return new Date() > new Date(BETA_END_DATE);
}

export const BETA_MAX_ROWS = 500_000; // Pro-level during beta
```

- **No runtime DB call** — purely env-var based for zero latency
- `BETA_END_DATE` hardcoded → 베타 종료 시 `VITE_BETA_MODE=false`로 전환

### F-02: Plan Limit Override

#### `lib/planManager.ts` 수정

`getEffectivePlan()` 헬퍼 추가 (기존 함수 수정 아닌 **신규 추가**):

```typescript
import { isBetaMode, isBetaExpired } from './betaConfig';

export function getEffectivePlan(profile: UserProfile | null): PlanType {
  if (isBetaMode() && !isBetaExpired()) return 'pro';
  return profile?.plan ?? 'free';
}

export function getEffectiveLimits(profile: UserProfile | null) {
  const plan = getEffectivePlan(profile);
  return PLAN_LIMITS[plan];
}
```

기존 함수 (`isPro`, `canUseAI`, `getCSVRowLimit`, `getAICallsRemaining`) 내부는 **변경하지 않음**. 호출부에서 `getEffectivePlan`을 사용.

#### `hooks/usePlanGate.ts` 수정

```typescript
import { getEffectivePlan, getEffectiveLimits } from '../lib/planManager';
import { isBetaMode, isBetaExpired } from '../lib/betaConfig';

// planInfo useMemo 내부:
const effectivePlan = getEffectivePlan(userProfile);
const limits = getEffectiveLimits(userProfile);
const betaActive = isBetaMode() && !isBetaExpired();

return {
  isPro: effectivePlan === 'pro' || effectivePlan === 'team',
  canUseAI: betaActive || checkCanUseAI(userProfile!),
  csvRowLimit: limits.csvRows,
  aiCallsRemaining: betaActive ? limits.aiCallsPerDay : getAICallsRemaining(userProfile!),
  connectorLimit: limits.connectors,
  maxSyncSchedule: limits.syncSchedule as SyncSchedule,
  isBeta: betaActive,
};
```

- `isBeta` 필드 추가 → UI에서 베타 뱃지 표시에 사용
- `canUseConnector` 수정: `betaActive`이면 Pro 커넥터도 허용

### F-03: Landing Page Beta Branding

#### MetricsBanner — i18n 키 교체만

현재 `metricRows`, `metricFeatures`, `metricTime`, `metricBrowser` 키를 사용.
**컴포넌트 코드 변경 없음** — i18n 값만 베타 모드에 맞게 교체:

| Key | 현재 값 | 베타 값 (ko) |
|-----|---------|-------------|
| `metricRows` | "10,000+" | "50만+" |
| `metricRowsLabel` | "무료 행" | "CSV 행 지원" |
| `metricFeatures` | "15+" | "40+" |
| `metricFeaturesLabel` | "분석 기능" | "분석 기능" |
| `metricTime` | "60초" | "60초" |
| `metricTimeLabel` | "인사이트까지" | "CSV → 인사이트" |
| `metricBrowser` | "100%" | "100%" |
| `metricBrowserLabel` | "브라우저 처리" | "브라우저 내 처리" |

#### TestimonialsSection — i18n 키 교체만

**컴포넌트 코드 변경 없음** — i18n 값을 사용 사례 기반으로 교체:

| Key | 베타 값 (ko) |
|-----|-------------|
| `testimonialTitle` | "이런 분석이 가능합니다" |
| `testimonial1Quote` | "CSV 업로드 한 번으로 퍼널의 이탈 구간을 정확히 찾았습니다. SQL 없이 이렇게 빠른 분석은 처음이에요." |
| `testimonial1Name` | "SaaS PM" |
| `testimonial1Role` | "퍼널 분석 사용 사례" |
| `testimonial2Quote` | "주간 리텐션 코호트를 한눈에 비교하니, 온보딩 개선 포인트가 바로 보입니다." |
| `testimonial2Name` | "그로스 마케터" |
| `testimonial2Role` | "리텐션 코호트 분석" |
| `testimonial3Quote` | "세그먼트별 전환율을 비교하고 AI가 핵심 인사이트를 요약해줍니다. 보고서 작성 시간이 절반으로 줄었어요." |
| `testimonial3Name` | "데이터 분석가" |
| `testimonial3Role` | "AI 인사이트 + 세그먼트" |

#### PricingSection 수정

`isBetaMode()` import 후 조건부 렌더링:

```typescript
import { isBetaMode } from '../../lib/betaConfig';

// 베타 모드:
// - 모든 플랜 가격을 ₩0 / "베타 기간 무료" 표시
// - "Most Popular" 뱃지 → "베타 무료" 뱃지로 교체
// - annual 토글 숨김
// - CTA 버튼: "무료로 시작하기" (모두 /signup 링크)

const betaMode = isBetaMode();

// plans 배열 생성 시:
{
  price: betaMode ? '₩0' : proPrice,
  period: betaMode ? t('landing.betaFree') : (annual ? ...),
  highlight badge: betaMode ? t('landing.betaBadge') : t('landing.mostPopular'),
}
```

#### HeroSection — i18n 키 추가

Hero 뱃지에 베타 문구 추가 (코드 분기):

```typescript
import { isBetaMode } from '../../lib/betaConfig';

// Hero badge:
{isBetaMode() && (
  <span className="px-3 py-1 text-xs font-mono font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full mb-4 inline-block">
    {t('landing.betaOpen')}
  </span>
)}
```

### F-04: `components/BetaBanner.tsx` (~45 lines)

```typescript
interface BetaBannerProps {}

export const BetaBanner: React.FC<BetaBannerProps> = () => {
  const { t } = useTranslation('pages');
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('fre_beta_banner_dismissed') === 'true'
  );

  if (!isBetaMode() || isBetaExpired() || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('fre_beta_banner_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-accent/10 border-b border-accent/20 px-4 py-2 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold text-accent">BETA</span>
        <span className="text-slate-300">{t('beta.bannerMessage')}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={openFeedback} className="text-accent hover:underline font-medium">
          {t('beta.giveFeedback')}
        </button>
        <button onClick={handleDismiss} className="text-slate-500 hover:text-white">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
```

**AppShell.tsx 삽입 위치**: `<OfflineBanner />` 위

```tsx
<BetaBanner />
<OfflineBanner />
<PastDueBanner />
```

### F-05: `components/FeedbackWidget.tsx` (~110 lines)

```typescript
interface FeedbackData {
  rating: number;        // 1-5
  category: 'bug' | 'feature' | 'ui' | 'other';
  message: string;       // max 500 chars
  page: string;          // current route
}

export const FeedbackWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<FeedbackData['category']>('feature');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const location = useLocation();

  if (!isBetaMode()) return null;

  const handleSubmit = async () => {
    if (rating === 0 || !message.trim()) return;
    await submitFeedback({
      rating, category,
      message: message.slice(0, 500),
      page: location.pathname,
    });
    setSubmitted(true);
    setTimeout(() => { setOpen(false); setSubmitted(false); reset(); }, 2000);
  };

  // UI: 우하단 고정 버튼 (MessageSquare 아이콘)
  // 클릭 → 모달 (rating stars + category select + textarea + submit)
  // submitted → "감사합니다!" 메시지 2초 후 자동 닫기
};
```

**AppShell.tsx 삽입 위치**: `</main>` 직후

```tsx
</main>
<FeedbackWidget />
```

### F-05b: `lib/feedback.ts` (~35 lines)

```typescript
import { supabase } from './supabase';

interface FeedbackPayload {
  rating: number;
  category: string;
  message: string;
  page: string;
}

export async function submitFeedback(data: FeedbackPayload): Promise<boolean> {
  // Supabase 미연결 시 localStorage fallback
  if (!supabase) {
    const key = 'fre_beta_feedback_queue';
    const queue = JSON.parse(localStorage.getItem(key) || '[]');
    queue.push({ ...data, created_at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(queue.slice(-20)));
    return true;
  }

  const { error } = await supabase
    .from('fre_beta_feedback')
    .insert({
      rating: data.rating,
      category: data.category,
      message: data.message,
      page: data.page,
      user_agent: navigator.userAgent,
    });

  return !error;
}
```

**Supabase 테이블** `fre_beta_feedback`:
```sql
CREATE TABLE fre_beta_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category text NOT NULL DEFAULT 'other',
  message text NOT NULL,
  page text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE fre_beta_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert feedback" ON fre_beta_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can read feedback" ON fre_beta_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM fre_user_profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### F-06: Beta Analytics Events

#### `lib/analytics.ts` 수정

`GTagEvent` 타입에 베타 이벤트 추가:

```typescript
// 기존 타입에 추가:
beta_signup: { source?: string };
beta_feature_use: { feature: string };
beta_feedback_submit: { rating: number; category: string };
```

별도 `lib/betaAnalytics.ts` 불필요 — 기존 `trackEvent` 함수 활용.

### F-07: SignupPage Beta Branding

```typescript
import { isBetaMode } from '../lib/betaConfig';

// brandTitle 교체:
const betaMode = isBetaMode();

// 폼 제목 위에:
{betaMode && (
  <div className="mb-4 px-3 py-2 bg-accent/5 border border-accent/20 rounded-md">
    <span className="text-accent text-xs font-mono font-semibold">BETA</span>
    <span className="text-slate-400 text-xs ml-2">{t('beta.signupNote')}</span>
  </div>
)}

// 가입 성공 후 trackEvent 추가:
trackEvent('beta_signup');
```

### F-08: Sentry (P2, 선택)

기존 `lib/monitoring.ts`가 이미 Sentry 초기화 코드를 포함하고 있을 가능성 높음 (sentry-web-vitals phase에서 구현됨).
- 확인 후 `VITE_SENTRY_DSN` Vercel 환경변수만 설정하면 활성화됨
- **이번 피처에서는 코드 변경 불필요** (환경변수 설정만)

### F-09: Beta Expiry (P2, 선택)

`isBetaExpired()` 체크 → `usePlanGate`에서 자동으로 Free 리밋 복귀.
별도 모달은 P2로 후순위. BetaBanner에서 종료 안내 텍스트 표시로 대체.

## i18n Keys (신규)

### `locales/ko/pages.json` — `beta` 섹션 (~20키)

```json
"beta": {
  "bannerMessage": "현재 무료 베타 기간입니다. 모든 Pro 기능을 무료로 이용하세요!",
  "giveFeedback": "피드백 보내기",
  "signupNote": "베타 테스터로 가입하시면 모든 기능을 무료로 이용할 수 있습니다",
  "feedbackTitle": "피드백 보내기",
  "feedbackRating": "만족도",
  "feedbackCategory": "카테고리",
  "feedbackCategoryBug": "버그 신고",
  "feedbackCategoryFeature": "기능 요청",
  "feedbackCategoryUi": "UI/UX 개선",
  "feedbackCategoryOther": "기타",
  "feedbackMessage": "의견을 자유롭게 적어주세요",
  "feedbackSubmit": "보내기",
  "feedbackThanks": "소중한 의견 감사합니다!",
  "feedbackError": "전송에 실패했습니다",
  "expired": "베타가 종료되었습니다"
}
```

### `locales/en/pages.json` — `beta` 섹션

```json
"beta": {
  "bannerMessage": "Free beta period — enjoy all Pro features at no cost!",
  "giveFeedback": "Send Feedback",
  "signupNote": "Sign up as a beta tester to unlock all features for free",
  "feedbackTitle": "Send Feedback",
  "feedbackRating": "Satisfaction",
  "feedbackCategory": "Category",
  "feedbackCategoryBug": "Bug Report",
  "feedbackCategoryFeature": "Feature Request",
  "feedbackCategoryUi": "UI/UX Improvement",
  "feedbackCategoryOther": "Other",
  "feedbackMessage": "Share your thoughts",
  "feedbackSubmit": "Submit",
  "feedbackThanks": "Thank you for your feedback!",
  "feedbackError": "Failed to submit",
  "expired": "Beta period has ended"
}
```

### Landing i18n 키 수정 (기존 키 값 교체)

| Key | 현재 ko | 베타 ko |
|-----|---------|---------|
| `landing.metricRows` | "10,000+" | "50만+" |
| `landing.metricRowsLabel` | "무료 행" | "CSV 행 지원" |
| `landing.testimonialTitle` | "사용자 후기" | "이런 분석이 가능합니다" |
| `landing.testimonial1Quote` | (기존) | 퍼널 분석 사용 사례 |
| `landing.testimonial2Quote` | (기존) | 리텐션 코호트 사용 사례 |
| `landing.testimonial3Quote` | (기존) | AI 인사이트 사용 사례 |
| `landing.testimonial*Name/Role` | (기존) | 사용 사례 기반 |

### Landing i18n 신규 키

```json
"landing": {
  "betaOpen": "무료 베타 오픈",
  "betaFree": "베타 기간 무료",
  "betaBadge": "베타 무료"
}
```

## File Changes Summary

### New Files (3)
| File | Lines | Purpose |
|------|-------|---------|
| `lib/betaConfig.ts` | ~25 | 베타 플래그 + 유틸 |
| `components/BetaBanner.tsx` | ~45 | 앱 상단 베타 안내 |
| `components/FeedbackWidget.tsx` | ~110 | 피드백 수집 위젯 |

### Modified Files (9)
| File | Change Summary |
|------|---------------|
| `lib/planManager.ts` | +`getEffectivePlan()`, +`getEffectiveLimits()` (2 함수 추가) |
| `hooks/usePlanGate.ts` | `planInfo`에서 `getEffectivePlan` 사용, +`isBeta` 반환 |
| `lib/analytics.ts` | `GTagEvent`에 beta_signup, beta_feature_use, beta_feedback_submit 추가 |
| `components/AppShell.tsx` | +BetaBanner, +FeedbackWidget import/렌더 |
| `components/landing/PricingSection.tsx` | 베타 모드 시 ₩0 표시, 토글 숨김 |
| `components/landing/HeroSection.tsx` | 베타 뱃지 조건부 렌더 |
| `pages/SignupPage.tsx` | 베타 안내 뱃지 + trackEvent('beta_signup') |
| `locales/ko/pages.json` | +`beta.*` 키 20개, landing 키 값 수정 |
| `locales/en/pages.json` | +`beta.*` 키 20개, landing 키 값 수정 |

### NOT Modified (의도적 제외)
| File | Reason |
|------|--------|
| `lib/feedback.ts` | 별도 파일 대신 FeedbackWidget 내부에 인라인 |
| `lib/betaAnalytics.ts` | 기존 analytics.ts의 trackEvent 재사용 |
| `MetricsBanner.tsx` | 컴포넌트 변경 없음 (i18n 값만 교체) |
| `TestimonialsSection.tsx` | 컴포넌트 변경 없음 (i18n 값만 교체) |

## Implementation Order

1. `lib/betaConfig.ts` (의존 없음)
2. `lib/planManager.ts` (betaConfig import)
3. `hooks/usePlanGate.ts` (planManager 변경 반영)
4. `lib/analytics.ts` (타입 추가)
5. `components/BetaBanner.tsx` (betaConfig import)
6. `components/FeedbackWidget.tsx` (betaConfig + supabase)
7. `components/AppShell.tsx` (BetaBanner + FeedbackWidget 통합)
8. `components/landing/PricingSection.tsx` (betaConfig import)
9. `components/landing/HeroSection.tsx` (betaConfig import)
10. `pages/SignupPage.tsx` (betaConfig + analytics)
11. `locales/ko/pages.json` + `locales/en/pages.json` (beta.* + landing 값 수정)
12. Build + Test

## Verification Checklist

- [ ] `VITE_BETA_MODE=true` 시 usePlanGate.isPro === true
- [ ] `VITE_BETA_MODE=true` 시 PricingSection 모든 가격 ₩0
- [ ] `VITE_BETA_MODE=false` 시 기존 동작 100% 동일
- [ ] BetaBanner dismiss → localStorage 저장 → 리로드 후 안 보임
- [ ] FeedbackWidget 제출 → Supabase 또는 localStorage 저장
- [ ] 빌드 성공 + 362 테스트 통과
