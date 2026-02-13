# Design: Monetization Conversion Optimization (수익화 전환 최적화)

## MC-1: Trial System

### UserProfile 확장 (planManager.ts)
```typescript
// UserProfile 인터페이스에 추가
trial_end: string | null;
```

### 새 함수 (planManager.ts)
```typescript
export function isTrialing(profile: UserProfile): boolean {
  if (profile.plan !== 'pro' || !profile.trial_end) return false;
  return new Date(profile.trial_end) > new Date();
}

export function getTrialDaysRemaining(profile: UserProfile): number {
  if (!profile.trial_end) return 0;
  const diff = new Date(profile.trial_end).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export async function startTrial(accessToken: string): Promise<{
  success: boolean;
  message: string;
  trial_end?: string;
}> {
  // Edge Function 호출: start-trial
}
```

### isPro 확장
```typescript
// 기존: plan === 'pro'
// 변경: plan === 'pro' (trial 포함, billing key 유무 관계없이)
// isTrialing으로 trial 여부 구분
```

### Edge Function: start-trial
```typescript
// POST /functions/v1/start-trial
// Auth: Bearer token 필수
// Logic:
//   1. user profile 조회
//   2. 이미 trial 사용한 적 있으면 거부 (trial_end가 과거값이면 이미 사용)
//   3. plan = 'pro', trial_end = now + 14일 설정
//   4. Response: { success, trial_end }
```

### process-billing 수정
```typescript
// 기존 daily billing loop에 추가:
// trial_end < now && plan === 'pro' && subscription_status === 'none'
//   → plan = 'free', trial_end 유지 (재시작 방지)
```

### Supabase Migration
```sql
ALTER TABLE fre_user_profiles ADD COLUMN trial_end TIMESTAMPTZ DEFAULT NULL;
```

## MC-2: Usage Widget (UsageIndicator)

### 컴포넌트: components/UsageIndicator.tsx
```typescript
export const UsageIndicator: React.FC = () => {
  // Props: none (useAuth에서 직접 가져옴)
  // Renders: Sidebar 하단에 배치
}
```

### Layout
```
┌──────────────────────────────┐
│ AI 인사이트  2/3              │
│ [████████░░] 67%             │
│                              │
│ CSV 한도    10,000행          │
│                              │
│ (80% 이상일 때만 표시:)       │
│ ⚡ Pro로 업그레이드 →         │
└──────────────────────────────┘
```

### 동작
- `useAuth().userProfile`에서 데이터 가져옴
- AI 사용률 = `ai_calls_today / PLAN_LIMITS[plan].aiCallsPerDay * 100`
- 색상: <80% → accent, >=80% → yellow-400, 100% → red-400
- Pro 사용자: 사용량 바 대신 plan 이름만 간략 표시
- Trial 사용자: "Trial D-{N}" 표시
- 게스트 (userProfile null): 컴포넌트 렌더링 안 함

### Sidebar 배치
```typescript
// Sidebar.tsx 하단 (PlanBadge 교체 또는 아래)
{userProfile && <UsageIndicator />}
```

## MC-3: Inline Upgrade Banner (UpgradeBanner)

### 컴포넌트: components/UpgradeBanner.tsx
```typescript
interface UpgradeBannerProps {
  messageKey: string;  // i18n key for context-specific message
  page: string;        // analytics tracking
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ messageKey, page }) => {
  // 표시 조건: !isPro && user != null (게스트/Pro는 숨김)
  // Trial 활성: "무료 체험 중" 문구 대신 표시
}
```

### Layout
```
┌──────────────────────────────────────────────────┐
│ ⚡ {context message}                    [Pro 시작] │
└──────────────────────────────────────────────────┘
```

### 디자인
- `bg-accent/5 border border-accent/20 rounded-lg p-3`
- Zap 아이콘 (accent color) + 1줄 메시지 + CTA 버튼
- CTA 클릭 시: `openUpgradeModal(page)` 호출
- `trackEvent('upgrade_banner_click', { page })` analytics

### 배치 위치 (4곳)
1. **Dashboard.tsx** — `widget-kpi-cards` 아래, 데이터 있을 때만
2. **FunnelAnalysis.tsx** — 퍼널 차트 아래, 결과 있을 때만
3. **RetentionAnalysis.tsx** — 히트맵 아래, 결과 있을 때만
4. **Insights.tsx** — AI 인사이트 결과 리스트 아래

### 메시지 키 (페이지별 컨텍스트)
```
upgradeBanner.dashboard = "50만 행 분석 + 무제한 AI 인사이트로 더 깊은 분석을 시작하세요"
upgradeBanner.funnel = "Pro에서 PDF 내보내기, 공유 링크, 무제한 저장 분석을 이용하세요"
upgradeBanner.retention = "Pro에서 50만 행까지 분석하고 PDF 리포트를 생성하세요"
upgradeBanner.insights = "하루 50회 AI 인사이트로 더 풍부한 데이터 분석을 경험하세요"
```

## MC-4: Trial UI

### PricingPage 변경
- Pro 카드에 CTA 2개:
  1. "14일 무료 체험 시작" (primary, startTrial 호출)
  2. "바로 구독하기" (secondary, 기존 결제 플로우)
- Trial 이미 사용한 사용자: 체험 버튼 비활성화 + "이미 체험을 사용했습니다"
- 로그인 안 한 상태: "체험하려면 로그인하세요"

### UpgradeModal 변경
- reason 메시지 아래에 Trial CTA 추가:
  ```
  "먼저 14일 무료로 체험해 보세요"
  [무료 체험 시작] 버튼 (accent outline)
  ```
- Trial 이미 사용: 숨김
- Trial 진행 중: 숨김 (이미 Pro 상태)

### PlanBadge 확장
- Trial 상태일 때: `"Trial D-{N}"` 표시 (N = 남은 일수)
- 색상: accent (기존 Pro 색상과 동일)

### Trial 만료 알림
- `trial_end - 3일` 시점에 알림 발송:
  - NotificationContext: `{ type: 'warning', message: 'Trial이 3일 후 만료됩니다' }`
  - 데스크톱 알림 (useDesktopNotification)
- 만료 시: `{ type: 'info', message: 'Trial이 만료되었습니다. Pro로 업그레이드하세요' }`

## MC-5: i18n

### ko/common.json
```json
"trial": {
  "start": "14일 무료 체험 시작",
  "badge": "Trial D-{{days}}",
  "expired": "체험 만료",
  "alreadyUsed": "이미 체험을 사용했습니다",
  "expiresIn": "체험이 {{days}}일 후 만료됩니다",
  "expiredMessage": "체험이 만료되었습니다. Pro로 업그레이드하세요",
  "tryFree": "먼저 14일 무료로 체험해 보세요",
  "loginRequired": "체험하려면 로그인하세요"
},
"usage": {
  "aiCalls": "AI 인사이트",
  "csvLimit": "CSV 한도",
  "rows": "{{count}}행",
  "upgradeNudge": "Pro로 업그레이드"
}
```

### en/common.json
```json
"trial": {
  "start": "Start 14-day free trial",
  "badge": "Trial D-{{days}}",
  "expired": "Trial expired",
  "alreadyUsed": "Trial already used",
  "expiresIn": "Trial expires in {{days}} days",
  "expiredMessage": "Trial expired. Upgrade to Pro",
  "tryFree": "Try 14 days free first",
  "loginRequired": "Login to start trial"
},
"usage": {
  "aiCalls": "AI Insights",
  "csvLimit": "CSV Limit",
  "rows": "{{count}} rows",
  "upgradeNudge": "Upgrade to Pro"
}
```

### ko/pages.json (upgradeBanner section)
```json
"upgradeBanner": {
  "dashboard": "50만 행 분석 + 무제한 AI 인사이트로 더 깊은 분석을 시작하세요",
  "funnel": "Pro에서 PDF 내보내기, 공유 링크, 무제한 저장 분석을 이용하세요",
  "retention": "Pro에서 50만 행까지 분석하고 PDF 리포트를 생성하세요",
  "insights": "하루 50회 AI 인사이트로 더 풍부한 데이터 분석을 경험하세요",
  "cta": "Pro 시작",
  "ctaTrial": "무료 체험"
}
```

### en/pages.json (upgradeBanner section)
```json
"upgradeBanner": {
  "dashboard": "Analyze 500K rows + unlimited AI insights for deeper analysis",
  "funnel": "Export to PDF, share links, and save unlimited analyses with Pro",
  "retention": "Analyze up to 500K rows and generate PDF reports with Pro",
  "insights": "Get 50 AI insights per day for richer data analysis",
  "cta": "Get Pro",
  "ctaTrial": "Free Trial"
}
```

## Verification Checklist (28 items)

### MC-1: Trial System (8)
1. UserProfile에 trial_end 필드 존재
2. isTrialing() 함수 export
3. getTrialDaysRemaining() 함수 export
4. startTrial() Edge Function 호출 함수 export
5. isPro가 trial 사용자도 true 반환
6. start-trial Edge Function SQL 작성
7. process-billing에 trial 만료 로직 추가
8. Supabase migration SQL 작성

### MC-2: Usage Widget (5)
9. UsageIndicator 컴포넌트 export
10. AI 사용량 progress bar 렌더링
11. 80% 이상 시 업그레이드 넛지 텍스트 표시
12. Pro 사용자는 사용량 바 숨김
13. Sidebar 하단에 배치

### MC-3: Inline Upgrade Banner (5)
14. UpgradeBanner 컴포넌트 export
15. Free 사용자에게만 표시 (게스트/Pro 숨김)
16. Dashboard에 배치
17. FunnelAnalysis에 배치
18. Insights에 배치

### MC-4: Trial UI (6)
19. PricingPage에 "14일 무료 체험" 버튼
20. UpgradeModal에 Trial CTA 링크
21. PlanBadge Trial 상태 표시 (D-N)
22. Trial 이미 사용한 사용자는 버튼 비활성화
23. Trial 만료 3일 전 알림
24. trackEvent('trial_start') analytics

### MC-5: i18n (4)
25. trial.* 키 8개 ko/en common.json
26. usage.* 키 4개 ko/en common.json
27. upgradeBanner.* 키 6개 ko/en pages.json
28. Trial/usage 번역 누락 없음
