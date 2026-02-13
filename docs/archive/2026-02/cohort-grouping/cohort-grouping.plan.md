# Plan: Cohort Grouping (코호트 그룹핑)

## Overview
현재 리텐션 분석은 일간(daily) 코호트만 지원합니다. 실무에서는 주간/월간 코호트가 더 실용적입니다.
코호트 그룹핑 옵션(일간/주간/월간)을 추가하여 리텐션 분석의 활용도를 높입니다.

## Problem
- 일간 코호트: 날짜별로 코호트가 너무 잘게 나뉘어 노이즈가 많음
- 사용자 수가 적은 코호트의 리텐션율이 왜곡됨
- 주간/월간 트렌드 파악이 어려움

## Scope

| ID | Task | Priority | Description |
|----|------|----------|-------------|
| CG-1 | 타입 + 상수 | P0 | CohortGrouping 타입 ('daily'\|'weekly'\|'monthly') + 기본값 상수 |
| CG-2 | Engine 확장 | P0 | calculateActivityRetention에 grouping 파라미터 추가, 날짜→주/월 그룹핑 로직 |
| CG-3 | Hook 확장 | P0 | useRetentionAnalysis에 cohortGrouping 상태 + runRetentionAnalysis 파라미터 전달 |
| CG-4 | UI 통합 | P0 | RetentionAnalysis 페이지에 일간/주간/월간 토글 UI 추가 |
| CG-5 | RetentionComparison 통합 | P1 | 비교 분석 페이지에도 그룹핑 옵션 추가 |
| CG-6 | i18n | P0 | ko/en 키 추가 |

## Technical Approach

### CG-2: Engine 그룹핑 로직
- `groupDateKey(date: Date, grouping: CohortGrouping): string`
  - daily: `YYYY-MM-DD` (기존)
  - weekly: `YYYY-W##` (ISO week)
  - monthly: `YYYY-MM`
- `calculateActivityRetention`에 4번째 파라미터 `grouping` 추가 (기본값 'daily')
- 코호트 날짜 키 생성 시 `groupDateKey` 사용
- Day 컬럼 계산: daily는 기존 D0~D14, weekly는 W0~W12, monthly는 M0~M6

### CG-4: UI 토글
- 기존 retention type 토글 아래에 3-button group (Daily / Weekly / Monthly)
- dayColumns useMemo에 grouping 의존성 추가

## Dependencies
- retentionEngine.ts (calculateActivityRetention)
- useRetentionAnalysis.ts
- RetentionAnalysis.tsx
- RetentionComparison.tsx
- types/index.ts

## Out of Scope
- Paid retention 그룹핑 (구독 데이터는 이미 장기 기간 D0~D90 사용)
- Full data retention 그룹핑 (자동 분석이라 사용자 선택 불필요)
