# Plan: DAU/MAU Stickiness (스티키니스 분석)

## Overview
DAU/MAU 비율(스티키니스)은 제품 engagement의 핵심 지표입니다.
일간 활성 사용자(DAU) 대비 월간 활성 사용자(MAU) 비율로,
사용자가 얼마나 자주 제품을 사용하는지 측정합니다.

## Problem
- 리텐션 분석만으로는 사용 빈도(engagement depth)를 파악하기 어려움
- DAU/MAU는 업계 표준 지표이지만 현재 지원하지 않음
- 일별 추이 그래프가 없으면 engagement 트렌드 파악 불가

## Scope

| ID | Task | Priority | Description |
|----|------|----------|-------------|
| ST-1 | 엔진 | P0 | stickinessEngine.ts — DAU/WAU/MAU 계산 + DAU/MAU 비율 시계열 |
| ST-2 | 페이지 | P0 | StickinessPage — KPI 카드 + 추이 차트 + 기간 테이블 |
| ST-3 | 라우트/사이드바 | P0 | lazy route + Sidebar 메뉴 + Icons |
| ST-4 | 대시보드 위젯 | P1 | stickiness-chart WidgetId + Dashboard 위젯 |
| ST-5 | i18n | P0 | ko/en 키 추가 |

## Technical Approach

### ST-1: Engine
- `calculateStickiness(data, windowDays=28)`: 지정 기간 내 DAU/MAU 일별 계산
  - 각 날짜의 DAU: 해당 날짜에 이벤트 발생한 고유 사용자 수
  - 해당 날짜의 MAU: 직전 28일 이벤트 발생 고유 사용자 수
  - ratio = DAU / MAU * 100
- 반환: `{ summary: { avgDAU, avgMAU, avgRatio, peakRatio, lowRatio }, daily: [...] }`

### ST-2: Page
- KPI 카드 3개: 평균 DAU/MAU 비율, 피크, 로우
- AreaChart: 일별 스티키니스 추이
- 기간별 테이블: 날짜, DAU, MAU, Ratio

### ST-4: Dashboard Widget
- WidgetId에 'stickiness-chart' 추가
- 간소화된 AreaChart (높이 200px)

## Dependencies
- processedData (AppContext)
- Recharts (AreaChart)
- FilterPanel (날짜 필터)

## Out of Scope
- WAU/MAU 별도 계산 (DAU/MAU만 우선 구현)
- 이벤트 필터링 (전체 이벤트 기반)
