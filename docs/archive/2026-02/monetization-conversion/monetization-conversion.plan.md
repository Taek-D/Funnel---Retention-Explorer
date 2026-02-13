# Plan: Monetization Conversion Optimization (수익화 전환 최적화)

## Overview
Free → Pro 전환율을 높이기 위한 3가지 P0 개선을 구현합니다.
현재 전환 트리거는 한도 초과 시 UpgradeModal만 노출하며,
사전 넛지, Trial 경험, 인라인 업그레이드 CTA가 부재합니다.

## Problem
- **Trial 부재**: 사용자가 Pro 기능을 경험하지 못하고 결제 결정을 내려야 함 (전환율 저하)
- **한도 인지 부족**: Free 사용자가 자신의 사용량/잔여 한도를 실시간으로 확인할 수 없음
- **업그레이드 CTA 부족**: 한도 초과 시에만 모달이 뜨고, 분석 결과 화면 등에서의 인라인 넛지가 없음

## Scope

| ID | Task | Priority | Description |
|----|------|----------|-------------|
| MC-1 | Trial 시스템 | P0 | 14일 Pro 무료 체험 — trial_end 필드, Trial CTA, 만료 시 자동 다운그레이드 |
| MC-2 | 사용량 위젯 | P0 | Sidebar 하단 사용량 바 (AI 호출/CSV 행) + 80% 경고 넛지 |
| MC-3 | 인라인 업그레이드 배너 | P0 | 분석 페이지 하단 Pro 기능 배너 + AI 결과 하단 CTA |
| MC-4 | Trial UI | P0 | PricingPage/UpgradeModal에 "14일 무료 체험" CTA 추가 |
| MC-5 | i18n | P0 | ko/en 키 추가 (trial, usage, upgrade CTA) |

## Technical Approach

### MC-1: Trial System
- **UserProfile 확장**: `trial_end: string | null` 필드 추가 (planManager.ts)
- **Trial 활성화**: `startTrial(userId)` — trial_end = now + 14일, plan = 'pro' 설정
- **Trial 상태 판별**: `isTrialing(profile)` — plan === 'pro' && trial_end != null && trial_end > now
- **Trial 만료 처리**: `process-billing` Edge Function에서 daily 체크 → trial_end < now이면 plan = 'free'로 다운그레이드
- **Supabase migration**: fre_user_profiles에 trial_end 컬럼 추가
- **Edge Function**: start-trial (trial_end 설정 + plan 변경, 중복 방지)

### MC-2: Usage Widget (UsageIndicator)
- **컴포넌트**: `components/UsageIndicator.tsx`
- **위치**: Sidebar 하단 (PlanBadge 아래)
- **표시 항목**:
  - AI 호출: `{used}/{limit}` + progress bar (80% 이상 시 yellow, 100% red)
  - CSV 행 한도: `{limit}행` (static, 클릭 시 업그레이드)
- **데이터 소스**: `useAuth().userProfile` → ai_calls_today, PLAN_LIMITS
- **넛지 로직**: 80% 이상 사용 시 "Pro로 업그레이드" 인라인 텍스트 링크 표시
- **Pro 사용자**: "Pro Plan" 표시, 사용량 바 숨김 (또는 더 큰 한도 표시)

### MC-3: Inline Upgrade Banner (UpgradeBanner)
- **컴포넌트**: `components/UpgradeBanner.tsx`
- **표시 조건**: `!isPro && user != null` (게스트는 표시 안 함)
- **배치 위치** (4곳):
  1. Dashboard — KPI 카드 아래 (데이터 있을 때)
  2. FunnelAnalysis — 결과 차트 아래
  3. RetentionAnalysis — 히트맵 아래
  4. Insights — AI 인사이트 결과 하단
- **디자인**: accent border 배너, Zap 아이콘, 1줄 문구 + CTA 버튼
- **문구**: 페이지별 컨텍스트에 맞는 메시지 (i18n key로 분리)
- **CTA**: openUpgradeModal 호출 또는 Trial 활성 시 startTrial 호출
- **Analytics**: `trackEvent('upgrade_banner_click', { page, reason })`

### MC-4: Trial UI
- **PricingPage**: Pro 카드에 "14일 무료 체험 시작" 버튼 추가 (결제 없이 바로 시작)
- **UpgradeModal**: reason 메시지 아래에 "먼저 14일 무료로 체험해 보세요" 링크 추가
- **Trial 배지**: Sidebar PlanBadge에 "Trial (D-N)" 남은 일수 표시
- **Trial 만료 알림**: trial_end 3일 전 NotificationContext로 알림 추가

### MC-5: i18n
- ko/en common.json: trial/usage 관련 8+ 키
- ko/en pages.json: upgrade banner 메시지 4개 (페이지별) + trial 관련 키 8개

## Dependencies
- planManager.ts (기존 코드 확장)
- usePlanGate.ts (Trial 상태 추가)
- AuthContext (userProfile 필드 확장)
- Supabase Edge Function (start-trial, process-billing 수정)
- Sidebar.tsx (UsageIndicator 배치)

## Out of Scope
- Team Plan Trial (Pro Trial만 우선)
- 레퍼럴 프로그램 (별도 PDCA)
- 랜딩 페이지 전환 최적화 (별도 PDCA)
- TossPayments API 키 설정 (외부 의존)
