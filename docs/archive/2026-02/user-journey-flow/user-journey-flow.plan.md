# User Journey Flow — Plan

## 1. Overview

사용자 이벤트 흐름을 Sankey 다이어그램으로 시각화하는 기능을 추가합니다.
각 이벤트 간 전환(transition)을 직관적으로 보여주어 사용자가 어디서 이탈하고 어디로 흐르는지 파악할 수 있습니다.

## 2. Problem

- 퍼널 분석은 미리 정의한 선형 경로만 분석 가능
- 실제 사용자 여정은 비선형적 — 어떤 이벤트에서 어떤 이벤트로 흐르는지 전체 흐름 파악 불가
- 예상치 못한 경로(detour)나 루프를 발견하기 어려움

## 3. Scope

### UJ-1: Journey Engine
- processedData에서 사용자별 이벤트 시퀀스 구축
- 연속 이벤트 쌍(source → target) 전환 횟수 집계
- Recharts Sankey 포맷 (nodes + links) 출력
- 최대 스텝 수 제한 (기본 5), 최소 흐름 임계값 (기본 1%)

### UJ-2: UserJourneyFlow Page
- Recharts Sankey 다이어그램 렌더링
- 설정 컨트롤: 최대 스텝, 최소 흐름 %, 분석 실행 버튼
- 노드/링크 호버 시 상세 정보 Tooltip
- 빈 상태 + 데이터 없음 안내

### UJ-3: Route + Sidebar + Icons
- `/app/journey` 라우트 추가
- Sidebar에 ArrowRightLeft 아이콘 메뉴 추가

### UJ-4: i18n
- ko/en 키 추가

## 4. Out of Scope
- 세션 기반 분석 (sessionId가 선택적 필드)
- 사용자 개별 여정 추적 (개인정보)
- Sankey 노드 드래그/재배치
- 시간대별 여정 비교

## 5. Dependencies
- Recharts Sankey (이미 recharts v3에 포함)
- 기존 processedData (ProcessedEvent[])
- CHART_COLORS 테마 토큰
