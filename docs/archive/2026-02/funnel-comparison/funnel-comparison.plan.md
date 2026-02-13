# Funnel Comparison — Plan

## 1. Overview

두 기간(Period A vs Period B)의 퍼널 결과를 나란히 비교하여
전환율 변화/개선/악화를 한눈에 파악하는 기능입니다.

## 2. Problem

- 기능 개선이나 캠페인 효과를 기간별로 비교할 수 없음
- 전환율이 좋아졌는지/나빠졌는지 정량적 비교 불가
- 수동으로 날짜 필터를 변경하며 메모해야 함

## 3. Scope

### FC-1: Comparison Engine
- 두 기간의 processedData를 각각 필터링
- 각 기간에 대해 calculateFunnel 실행
- 스텝별 전환율 차이(diff), 변화 방향(up/down/same) 계산

### FC-2: FunnelComparison 페이지
- Period A / Period B 날짜 입력
- 동일 퍼널 스텝 선택 (기존 스텝 셀렉터 재사용)
- 비교 실행 버튼
- 나란히 비교 테이블 (스텝, A 전환율, B 전환율, 차이, 방향)
- Grouped BarChart (A vs B)

### FC-3: Route + Sidebar
- /app/funnel-compare 라우트 추가
- Sidebar에 GitCompareArrows 아이콘 메뉴 추가

### FC-4: i18n Keys
- ko/en 키 추가

## 4. Out of Scope
- 3개 이상 기간 비교
- 자동 기간 추천 (지난주 vs 이번주)
- 통계적 유의성 검정 (A/B 테스트와 중복)

## 5. Dependencies
- calculateFunnel (funnelEngine.ts)
- ProcessedEvent.timestamp (Date 객체)
- Recharts BarChart
