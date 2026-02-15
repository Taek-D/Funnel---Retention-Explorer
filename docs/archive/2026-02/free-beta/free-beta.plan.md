# Plan: Free Beta Launch

## Overview
FRE Analytics를 무료 베타로 공개하여 실사용자 피드백을 수집하고 PMF(Product-Market Fit)를 검증한다. 모든 Pro/Team 기능을 베타 기간 동안 무료로 제공하고, 인앱 피드백 수집 + 사용 추적을 통해 유료 전환 근거를 확보한다.

## Goals
1. **페이월 해제**: 베타 모드 플래그로 모든 기능 무료 개방
2. **신뢰도 개선**: 랜딩페이지의 가짜 통계/후기를 베타 메시지로 교체
3. **피드백 수집**: 인앱 피드백 위젯으로 사용자 의견 수집
4. **베타 추적**: 베타 사용자 가입/활동 이벤트 트래킹
5. **Sentry 연동**: 프로덕션 에러 모니터링 활성화

## Non-Goals
- TossPayments 결제 연동 (베타 이후)
- Google OAuth 소셜 로그인 (베타 이후)
- Data Connector Edge Function 배포 (베타 이후)
- 새로운 분석 기능 추가

## Scope

### P0: Beta Mode Core (필수)

#### F-01: Beta Feature Flag
- `VITE_BETA_MODE=true` 환경변수 기반 플래그
- `lib/betaConfig.ts`: `isBetaMode()`, `BETA_END_DATE`, `BETA_MAX_USERS` 유틸
- Vercel 환경변수로 배포 시 제어

#### F-02: Plan Limit 해제
- `lib/planManager.ts`: `isBetaMode()` 시 Pro 플랜 리밋 적용
- `hooks/usePlanGate.ts`: 베타 모드에서 `isPro = true` 반환
- 업그레이드 모달 숨김 (베타 기간 동안)

#### F-03: 랜딩페이지 베타 브랜딩
- Hero 섹션: "무료 베타 오픈" 뱃지 추가
- MetricsBanner: 가짜 숫자 → 실제 기능 수/지원 형식 등 사실 기반으로 교체
- TestimonialsSection: 가짜 후기 → 베타 사용 사례 카드로 교체
- PricingSection: 모든 플랜 ₩0 표시 + "베타 기간 무료" 뱃지
- CTA: "무료 베타 시작하기" 문구

#### F-04: Beta Banner
- `components/BetaBanner.tsx`: 앱 상단 고정 배너
- "베타 버전입니다. 피드백을 보내주세요!" + 피드백 링크
- AppShell.tsx에 삽입 (로그인 후 모든 페이지)
- dismissible (localStorage로 닫기 상태 저장)

### P1: Feedback & Tracking (중요)

#### F-05: 인앱 피드백 위젯
- `components/FeedbackWidget.tsx`: 플로팅 버튼 (우하단)
- 클릭 시 모달: 평점(1-5) + 카테고리(버그/기능요청/UI/기타) + 텍스트
- `lib/feedback.ts`: Supabase `fre_beta_feedback` 테이블에 저장
- 미인증 사용자도 제출 가능 (guest_id 사용)

#### F-06: Beta Analytics Events
- `lib/analytics.ts`에 베타 이벤트 추가:
  - `beta_signup`: 베타 기간 가입
  - `beta_feature_use`: Pro/Team 기능 사용 시
  - `beta_feedback_submit`: 피드백 제출
  - `beta_session_start`: 세션 시작
- Supabase `fre_beta_events` 테이블에 기록

#### F-07: Signup Flow 베타 표시
- SignupPage: "베타 테스터로 가입" 브랜딩
- 가입 완료 후 토스트: "베타 테스터로 등록되었습니다!"
- 선택적 설문: "어떻게 알게 되셨나요?" (검색/SNS/추천/기타)

### P2: Production Readiness (권장)

#### F-08: Sentry 기본 연동
- `@sentry/react` 이미 설치됨 (sentry-web-vitals 피처에서)
- `lib/monitoring.ts` 베타 환경 DSN 설정 확인
- 에러 바운더리 Sentry 리포팅 활성화
- 환경변수: `VITE_SENTRY_DSN` (Vercel에 설정 필요)

#### F-09: 베타 종료 안내
- `BETA_END_DATE` 도달 시 자동 안내 모달
- "베타가 종료되었습니다. Pro 플랜으로 업그레이드하세요" 메시지
- Free 플랜 리밋으로 자동 복귀 로직

## File Changes

### New Files (5)
| File | Purpose | Lines |
|------|---------|-------|
| `lib/betaConfig.ts` | 베타 모드 설정/유틸 | ~30 |
| `components/BetaBanner.tsx` | 앱 상단 베타 안내 배너 | ~50 |
| `components/FeedbackWidget.tsx` | 플로팅 피드백 버튼+모달 | ~120 |
| `lib/feedback.ts` | 피드백 저장 로직 | ~40 |
| `lib/betaAnalytics.ts` | 베타 이벤트 트래킹 | ~50 |

### Modified Files (9)
| File | Change |
|------|--------|
| `lib/planManager.ts` | 베타 모드 시 Pro 리밋 반환 |
| `hooks/usePlanGate.ts` | 베타 모드 시 isPro=true |
| `components/AppShell.tsx` | BetaBanner 삽입 |
| `pages/SignupPage.tsx` | 베타 브랜딩 + 유입 경로 설문 |
| `locales/ko/pages.json` | ~25개 beta.* 키 추가 |
| `locales/en/pages.json` | ~25개 beta.* 키 추가 |
| `components/landing/MetricsBanner.tsx` | 사실 기반 통계로 교체 |
| `components/landing/TestimonialsSection.tsx` | 베타 사용 사례로 교체 |
| `components/landing/PricingSection.tsx` | 베타 무료 표시 |

## Implementation Order
1. `lib/betaConfig.ts` (플래그 기반)
2. `lib/planManager.ts` + `hooks/usePlanGate.ts` (페이월 해제)
3. 랜딩페이지 3개 섹션 수정 (MetricsBanner, Testimonials, Pricing)
4. `components/BetaBanner.tsx` + AppShell 통합
5. `components/FeedbackWidget.tsx` + `lib/feedback.ts`
6. `lib/betaAnalytics.ts` + SignupPage 수정
7. i18n 키 추가
8. 빌드/테스트 검증

## Success Metrics
- 베타 가입자 50명 이상
- 피드백 제출 10건 이상
- 일주일 내 재방문율 30% 이상
- 프로덕션 크리티컬 에러 0건

## Risks
| Risk | Mitigation |
|------|-----------|
| 남용 (대용량 CSV 무한 업로드) | 베타에서도 100MB/파일 제한 유지 |
| Supabase 무료 티어 초과 | 500MB DB + 1GB Storage 모니터링 |
| 피드백 스팸 | rate limit (IP당 5건/일) |
| 베타 종료 후 이탈 | 종료 2주 전 사전 안내 + 할인 쿠폰 |

## Dependencies
- Supabase에 `fre_beta_feedback`, `fre_beta_events` 테이블 생성 필요 (SQL)
- Vercel에 `VITE_BETA_MODE=true` 환경변수 설정
- (선택) `VITE_SENTRY_DSN` 설정
