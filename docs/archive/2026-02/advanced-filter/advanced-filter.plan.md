# Advanced Filter/Search Plan

## Overview
분석 페이지 전체에 날짜 범위 필터, 이벤트 검색, 플랫폼/채널 필터를 추가합니다.
현재 전체 데이터셋 기반 분석만 가능한 상태를 개선하여 특정 기간/조건 분석을 지원합니다.

## Current State
- 날짜 범위 필터: 없음 (전체 데이터 사용)
- 이벤트 검색: 드롭다운 선택만 존재 (FunnelAnalysis, RetentionAnalysis)
- 글로벌 필터: 없음 (페이지별 로컬 상태만)
- SearchModal: Cmd+K 전역 검색 존재 (페이지/인사이트/이벤트)
- 인사이트 필터: type별 필터 없음

## Scope

### AF-1: Filter Types & State (LOW effort, HIGH impact)
- DateRange, ActiveFilters 타입 추가 (types/index.ts)
- AppState에 dateRange, activeFilters 추가
- reducer: SET_DATE_RANGE, SET_PLATFORM_FILTER, SET_CHANNEL_FILTER, CLEAR_FILTERS 액션

### AF-2: useFilteredData Hook (MEDIUM effort, HIGH impact)
- processedData를 dateRange + platform + channel로 필터링
- useMemo로 캐싱 (의존성: processedData, dateRange, activeFilters)
- 필터 적용된 데이터를 분석 엔진에 전달

### AF-3: DateRangePicker Component (MEDIUM effort, HIGH impact)
- 시작/종료 날짜 input (native date inputs)
- 프리셋 버튼: 최근 7일, 30일, 90일, 전체
- 데이터 범위 표시 (min/max date from dataQualityReport)
- 필터 적용 상태 Badge

### AF-4: FilterPanel Component (MEDIUM effort, HIGH impact)
- DateRangePicker + 플랫폼 체크박스 + 채널 체크박스
- 접기/펼치기 (collapsible)
- 활성 필터 수 Badge
- "필터 초기화" 버튼
- Dashboard, FunnelAnalysis, RetentionAnalysis, SegmentComparison 페이지에 적용

### AF-5: Insights Filter (LOW effort, MEDIUM impact)
- type별 필터 (success/warning/danger/info) 토글 버튼
- 인사이트 검색 (제목/본문 텍스트 필터)

### AF-6: i18n Keys (LOW effort, LOW impact)
- 필터 관련 한/영 번역 키 추가

## Out of Scope
- 퍼널 전환 시간 윈도우 필터 (복잡도 높음)
- 필터 조건 저장/공유
- 코호트 크기 필터
- fuzzy search

## Dependencies
- 기존 processedData, dataQualityReport 구조
- useMemo 패턴 (perf-optimization에서 확립)

## Priority
AF-1 → AF-2 → AF-3 → AF-4 → AF-5 → AF-6
