# Funnel Time Analysis — Plan

## 1. Overview

퍼널 각 스텝 간 전환에 걸리는 시간을 상세 분석하는 기능입니다.
현재 medianTime만 텍스트로 표시되는 것을 확장하여, 중앙값/P10/P90/평균 등
시간 분포를 시각화하고 병목 구간을 자동 하이라이트합니다.

## 2. Problem

- 현재 퍼널 분석은 전환율/이탈에만 집중, 시간 관점 분석 부족
- medianTime만 표시 → 분포(P10~P90)를 모르면 이상치 파악 불가
- 어떤 스텝이 병목인지 한눈에 파악 어려움
- 시간 기반 최적화 우선순위 설정 불가능

## 3. Scope

### FT-1: Time Distribution Engine
- funnelEngine.ts의 `calculateMedianTimeBetweenSteps` 확장
- 각 스텝 쌍에 대해 median, p10, p90, mean, count 계산
- FunnelStep 타입에 timeStats 필드 추가

### FT-2: Time Distribution Bar Chart
- Recharts 가로 BarChart로 스텝별 시간 분포 시각화
- P10~P90 범위 바 + 중앙값 마커
- 병목 구간(가장 느린 스텝) 자동 하이라이트 (빨간 배경)

### FT-3: FunnelAnalysis 페이지 통합
- 기존 medianTime 텍스트 → 시간 분포 차트로 교체
- ChartDownloadButton 연동
- 병목 구간 인사이트 텍스트

### FT-4: i18n Keys
- ko/en 키 추가

## 4. Out of Scope
- 개별 사용자 시간 추적
- 시간대별 비교 (아침 vs 저녁)
- 시간 기반 알림/트리거

## 5. Dependencies
- 기존 funnelEngine.ts (calculateMedianTimeBetweenSteps)
- FunnelStep 타입 (types/index.ts)
- Recharts BarChart (이미 사용 중)
- formatTime (formatters.ts)
