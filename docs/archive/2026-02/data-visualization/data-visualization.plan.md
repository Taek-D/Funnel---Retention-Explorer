# Data Visualization Enhancement — Plan

## 1. Overview

퍼널/리텐션/세그먼트 페이지의 시각화를 고도화합니다.
퍼널 이탈률 차트, 세그먼트 Recharts 전환, 리텐션 히트맵 인터랙션, 차트 팔레트 확장을 추가합니다.

## 2. Problem

- 퍼널: 사용자 수 BarChart만 있음 → 스텝 간 이탈률을 시각적으로 파악하기 어려움
- 세그먼트: 커스텀 CSS 바 (div width %) → Recharts로 통일되지 않음, 인터랙션 없음
- 리텐션: 코호트 테이블에 절대 수치 미표시, 툴팁 없음
- CHART_COLORS: 단일 accent 색상만 → 다중 시리즈 비교 시 색상 부족

## 3. Scope

### VZ-1: Funnel Drop-off Chart
- 기존 BarChart 아래에 스텝 간 이탈률(drop-off %) BarChart 추가
- 수평 방향, 빨간/주황 계열 색상으로 이탈 강도 표현
- 토글 버튼으로 표시/숨김

### VZ-2: Segment Grouped BarChart
- SegmentComparison의 커스텀 CSS 바를 Recharts BarChart로 교체
- 플랫폼/채널별 그룹화된 막대 차트
- Tooltip에 사용자 수 + 전환율 표시

### VZ-3: Retention Heatmap Tooltip
- 코호트 테이블 셀에 hover 시 절대 사용자 수 표시 (커스텀 tooltip)
- 코호트 크기 대비 잔존 사용자 수 계산

### VZ-4: Chart Palette & Utilities
- CHART_COLORS에 palette 배열 추가 (8색)
- dropoffColor 함수 추가 (이탈률에 따른 빨강-주황 그라데이션)

### VZ-5: i18n
- 새 키 추가 (funnel.dropoff, segment 차트 관련, retention tooltip 관련)

## 4. Out of Scope
- Sankey 다이어그램 (recharts에 내장되어 있지 않음, 별도 라이브러리 필요)
- 실시간 차트 업데이트
- 차트 이미지 다운로드 (이미 ExportDropdown에서 처리)

## 5. Dependencies
- 기존 FunnelAnalysis.tsx, SegmentComparison.tsx, RetentionAnalysis.tsx
- lib/constants.ts (CHART_COLORS)
- recharts (이미 설치됨)
