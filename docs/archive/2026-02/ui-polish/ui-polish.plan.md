# Plan: UI Polish (Phase 6)

## Overview

FRE Analytics 프론트엔드의 UX/UI 품질 향상. 접근성(a11y), 로딩/전환 상태, 차트 테마 일관성, 모바일 대응에 초점.

## Background

Phase 1~5를 통해 기능적으로 완성된 SaaS 대시보드이나, 다음 영역에서 Polish가 필요:
- 접근성: ARIA 라벨 부재, 키보드 내비게이션 미흡
- 로딩 UX: 차트/분석 결과 로딩 중 빈 화면
- 시각 일관성: Recharts 하드코딩 색상 (#hex) vs Tailwind 테마 토큰
- 전환 애니메이션: Modal/Toast exit 애니메이션 부재
- 모바일: 테이블 가로 스크롤 힌트 없음

## Scope

### In Scope
- 접근성 개선 (ARIA, 키보드, focus management)
- 차트 색상 테마 토큰화
- 로딩/빈 상태 개선
- Modal/Toast exit 애니메이션
- 모바일 테이블 스크롤 UX

### Out of Scope
- 새 기능 추가
- 백엔드/Edge Function 변경
- reportEngine.ts 캔버스 색상 (PDF 생성은 별도 Phase)
- 디자인 시스템 전면 재설계

## Tasks

### UP-1: Accessibility (ARIA + Keyboard)

**목표**: 주요 인터랙티브 요소에 ARIA 속성 추가 + 다이얼로그 키보드 관리

**대상 파일**:
- `components/Sidebar.tsx` — nav 버튼 aria-label, aria-current, 모바일 오버레이 role="dialog"
- `components/Modal.tsx` — role="dialog", aria-modal, aria-label, Escape 키 닫기
- `components/Toast.tsx` — role="alert", aria-live="polite", 닫기 버튼 aria-label
- `components/SearchModal.tsx` — role="dialog", aria-modal, input aria-label
- `components/UserMenu.tsx` — aria-expanded, aria-haspopup
- `components/OnboardingTour.tsx` — role="dialog", aria-label

**수정 규모**: ~50 lines across 6 files

### UP-2: Chart Theme Tokens

**목표**: Recharts 하드코딩 hex 색상을 CSS 변수 기반 상수로 통일

**대상 파일**:
- `index.html` — tailwind.config에 chart-specific CSS 변수 추가
- `lib/constants.ts` — CHART_COLORS 상수 객체 추가
- `pages/Dashboard.tsx` — 차트 color props를 CHART_COLORS 참조로 변경
- `pages/FunnelAnalysis.tsx` — 동일
- `pages/RetentionAnalysis.tsx` — sticky 컬럼 bg + 차트 색상 통일
- `pages/SegmentComparison.tsx` — 차트 색상 통일

**수정 규모**: ~80 lines across 6 files

### UP-3: Loading & Empty States

**목표**: 분석 결과 로딩 중 skeleton UI + 빈 상태 개선

**대상 파일**:
- `components/ChartSkeleton.tsx` (신규) — 재사용 가능한 차트/테이블 skeleton
- `pages/FunnelAnalysis.tsx` — 분석 중 skeleton 표시
- `pages/RetentionAnalysis.tsx` — 코호트 테이블 로딩 skeleton
- `pages/SegmentComparison.tsx` — 비교 결과 로딩 skeleton
- `pages/DataImport.tsx` — 빈 최근 파일 상태 개선

**수정 규모**: ~120 lines (1 new + 4 modified)

### UP-4: Transitions & Mobile Polish

**목표**: Modal/Toast exit 애니메이션 + 모바일 테이블 스크롤 힌트

**대상 파일**:
- `index.html` — exit 애니메이션 keyframes 추가 (fade-out, slide-out)
- `components/Modal.tsx` — 닫기 시 fade-out 애니메이션 (setTimeout + state)
- `components/Toast.tsx` — 자동 닫기 시 fade-out + 메시지 길이 기반 동적 타임아웃
- `pages/RetentionAnalysis.tsx` — 테이블 래퍼에 스크롤 그라데이션 힌트
- `pages/SegmentComparison.tsx` — 동일

**수정 규모**: ~100 lines across 5 files

## Priority Order

1. **UP-1** (Accessibility) — 웹 접근성 기본 요건
2. **UP-2** (Chart Tokens) — 시각 일관성 + 유지보수성
3. **UP-3** (Loading States) — 사용자 체감 품질
4. **UP-4** (Transitions) — 전환 품질 + 모바일

## Success Criteria

- 모든 다이얼로그에 role="dialog" + aria-modal
- 하드코딩 hex 색상 0개 (차트 영역)
- 분석 페이지 3곳에 skeleton 로딩 적용
- Modal/Toast exit 애니메이션 동작
- 테스트 98/98 유지, 빌드 성공

## Dependencies

- 외부 패키지 추가 없음
- 기존 Tailwind CDN + 커스텀 CSS 변수만 사용

## Estimated Impact

- **접근성**: WCAG 2.1 Level A 기본 준수
- **UX 체감**: 로딩 → 결과 전환 시 깜빡임 제거
- **유지보수**: 차트 색상 변경 시 1곳만 수정
- **모바일**: 테이블 데이터 접근성 향상
