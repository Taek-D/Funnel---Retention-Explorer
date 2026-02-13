# Plan: Retention Comparison

## Overview
두 기간의 리텐션 곡선을 비교하여 리텐션 개선/악화를 시각적으로 분석하는 기능.

## Scope
| ID | Task | Priority |
|----|------|----------|
| RC-1 | compareRetention 엔진 함수 + 타입 | P0 |
| RC-2 | RetentionComparison 페이지 (UI + 차트) | P0 |
| RC-3 | Icons + Router + Sidebar 통합 | P0 |
| RC-4 | i18n (ko/en) | P0 |

## Technical Approach
- retentionEngine.ts에 compareRetention 함수 추가
- 코호트별 평균 리텐션율 계산 후 diff 비교
- LineChart로 두 기간 리텐션 곡선 시각화
- 0.5pp 임계값으로 direction 판정

## Dependencies
- retentionEngine.ts (calculateActivityRetention)
- Recharts (LineChart)
- react-i18next
