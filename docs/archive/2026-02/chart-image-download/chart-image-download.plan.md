# Chart Image Download — Plan

## 1. Overview

개별 차트를 PNG 이미지로 다운로드하는 기능을 추가합니다.
현재는 Dashboard 전체 리포트 PNG/PDF 내보내기만 존재하며, 개별 차트 단위 다운로드는 불가능합니다.

## 2. Problem

- 사용자가 특정 차트만 슬라이드/보고서에 삽입하고 싶을 때 전체 리포트를 내보내야 함
- 전체 리포트 PNG은 Canvas 기반이라 해상도/레이아웃이 실제 차트와 다를 수 있음
- 개별 차트 스크린샷을 직접 찍어야 하는 불편함

## 3. Scope

### CD-1: ChartDownloadButton Component
- 차트 컨테이너 우상단에 배치되는 다운로드 아이콘 버튼
- 클릭 시 해당 차트 영역을 PNG로 캡처 + 자동 다운로드
- html2canvas (이미 번들에 포함, 202KB chunk) 사용

### CD-2: FunnelAnalysis Chart Downloads
- 메인 Funnel BarChart에 다운로드 버튼 추가
- Drop-off BarChart에 다운로드 버튼 추가

### CD-3: RetentionAnalysis Chart Downloads
- Retention Curve AreaChart에 다운로드 버튼 추가
- 코호트 히트맵 테이블에 다운로드 버튼 추가

### CD-4: SegmentComparison Chart Download
- Segment BarChart에 다운로드 버튼 추가

### CD-5: Dashboard Chart Downloads
- Funnel BarChart 위젯에 다운로드 버튼 추가
- Retention AreaChart 위젯에 다운로드 버튼 추가

### CD-6: i18n
- 새 키 추가 (다운로드 버튼 tooltip, 다운로드 중 텍스트)

## 4. Out of Scope
- SVG 포맷 다운로드 (Recharts SVG 직접 추출 — 복잡도 대비 이점 적음)
- 차트 이미지 클립보드 복사 (향후 가능)
- Pro 전용 게이팅 (무료 기능으로 제공)

## 5. Dependencies
- html2canvas (이미 설치됨, dynamic import 사용)
- 기존 차트 페이지들 (FunnelAnalysis, RetentionAnalysis, SegmentComparison, Dashboard)
- CHART_COLORS (배경색 설정 용도)
