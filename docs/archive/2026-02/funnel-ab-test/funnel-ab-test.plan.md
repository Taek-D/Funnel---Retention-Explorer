# Funnel A/B Test — Plan

## 1. Overview

세그먼트별 퍼널 성과를 나란히 비교하고, 통계적 유의미성(p-value, confidence interval)을 계산하여
A/B 테스트 결과를 시각적으로 보여주는 전용 분석 페이지를 추가합니다.

기존 SegmentComparison 페이지는 플랫폼/채널 단위 비교만 가능하지만,
이 기능은 **임의의 2개 세그먼트**를 선택하여 퍼널 전체를 step-by-step으로 비교합니다.

## 2. Problem

- 현재 세그먼트 비교는 각 세그먼트 독립 결과만 나열 → 직접적인 A vs B 비교 시각화 없음
- p-value만 표시하고 confidence interval, sample size 권장 등 통계적 해석 가이드 없음
- 퍼널의 어느 step에서 두 세그먼트 차이가 발생하는지 한눈에 파악 불가

## 3. Scope

### AB-1: A/B Test Engine (lib/abTestEngine.ts)
- `runABTest(data, steps, segmentA, segmentB)` → ABTestResult
- 각 step별 conversion rate 차이 + p-value + confidence interval 계산
- Z-test 기반 2-proportion test (기존 segmentEngine.calculatePValue 확장)
- 95% CI (Wilson score interval)
- 전체 퍼널 최종 전환율에 대한 통계적 유의미성 판정
- 필요 샘플 사이즈 계산 (statistical power 80%)

### AB-2: Types (types/index.ts)
- `ABTestSegment`: { filter: 'platform' | 'channel' | 'custom'; value: string }
- `ABTestStepResult`: { step, usersA, usersB, rateA, rateB, diff, pValue, ci95, significant }
- `ABTestResult`: { segmentA, segmentB, steps: ABTestStepResult[], overallPValue, sampleSizeA, sampleSizeB, winner, recommendedSampleSize }

### AB-3: A/B Test Page (pages/ABTestPage.tsx)
- 세그먼트 A/B 선택 UI (platform/channel 드롭다운 또는 커스텀 이벤트)
- 퍼널 스텝 선택 (기존 uniqueEvents 활용)
- 결과 대시보드:
  - Side-by-side BarChart (Recharts GroupedBar)
  - Step-by-step 비교 테이블 (rateA, rateB, diff, p-value, significance badge)
  - Overall summary 카드 (winner, confidence level, recommended sample size)
  - Confidence interval 시각화 (error bar 또는 range indicator)

### AB-4: Route, Sidebar, i18n
- Router: `/app/ab-test` (lazy loaded)
- Sidebar: nav item with `FlaskConical` icon
- i18n: `abTest` section in ko/en pages.json + nav.abTest in common.json

## 4. Out of Scope
- Bayesian A/B testing (향후 확장)
- Multi-variant testing (3개 이상 그룹)
- Sequential testing / early stopping
- 서버사이드 실험 할당

## 5. Dependencies
- 기존 segmentEngine.ts (calculateSegmentFunnel, calculatePValue)
- 기존 funnelEngine.ts (calculateFunnel)
- Recharts (BarChart)
- 기존 custom events system (custom-event-definition)
