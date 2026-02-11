# Performance Optimization Plan

## Overview
분석 페이지의 렌더링 성능 및 대용량 데이터 처리 최적화

## Scope

### PF-1: useMemo/useCallback 최적화 (LOW effort, MEDIUM impact)
- FunnelAnalysis: chartData, overallConversion, totalUsers
- RetentionAnalysis: avgRetention, curveData
- SegmentComparison: bestSegment, avgConversion
- Dashboard: kpiCards, funnelChartData, retentionCurveData

### PF-2: Web Worker for CSV Parsing (MEDIUM effort, HIGH impact)
- CSV 파싱을 Web Worker로 이동 (메인 스레드 블로킹 제거)
- Worker 파일: lib/csvWorker.ts
- Comlink 대신 native postMessage (의존성 최소화)
- 진행률 콜백 지원

### PF-3: Virtual Scrolling (LOW effort, MEDIUM impact)
- Dashboard 저장된 분석 목록
- Insights 페이지 카드 목록
- @tanstack/react-virtual 사용

## Out of Scope
- Context splitting (큰 리팩토링, 별도 feature로)
- Bundle size optimization (이미 chunk splitting 적용됨)

## Dependencies
- xlsx (already installed)
- @tanstack/react-virtual (new)
