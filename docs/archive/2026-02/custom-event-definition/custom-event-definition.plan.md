# Custom Event Definition Plan

## Overview
사용자가 CSV 데이터에서 추출된 이벤트를 기반으로 커스텀 이벤트를 정의하고 저장하는 기능을 구현합니다.
현재는 CSV 원본 이벤트명만 사용 가능하지만, 이벤트 별칭(alias), 이벤트 그룹(복수 이벤트 합산),
조건부 이벤트(특정 속성 조건 포함)를 정의하여 분석에 활용할 수 있게 합니다.

## Current State
- `uniqueEvents`: CSV 파싱 후 추출된 이벤트명 배열 (string[])
- `EVENT_PATTERNS`: 하드코딩된 이커머스/구독 이벤트 패턴 (constants.ts)
- `FUNNEL_TEMPLATES`: 미리 정의된 퍼널 스텝 조합 (constants.ts)
- 퍼널 분석/리텐션 분석 시 드롭다운에서 uniqueEvents 중 선택
- 이벤트 이름 변경, 그룹핑, 조건 필터링 기능 없음
- 사용자 정의 이벤트를 저장/재사용하는 방법 없음

## Scope

### CE-1: Custom Event Type & Storage (MED effort, HIGH impact)
- `CustomEvent` 타입 정의 (types/index.ts)
  - id, name, description, type (alias | group | conditional)
  - alias: 원본 이벤트명 → 표시 이름 매핑
  - group: 여러 이벤트를 하나로 합산 (e.g., "All Purchases" = purchase + buy + order)
  - conditional: 원본 이벤트 + 속성 조건 (e.g., platform = 'ios'인 purchase만)
- Supabase `fre_custom_events` 테이블 (user_id, project_id, definition JSONB)
- supabaseData.ts에 CRUD 함수 (list/create/update/delete)
- 게스트 모드: localStorage 저장

### CE-2: Custom Event Manager Page (MED effort, HIGH impact)
- `/app/events` 전용 페이지 (CustomEventsPage.tsx)
- 이벤트 목록 표시 (타입 아이콘, 이름, 설명, 매핑 정보)
- 생성/편집 폼:
  - Alias: 원본 이벤트 선택 + 표시 이름 입력
  - Group: 복수 이벤트 선택 (체크박스) + 그룹명 입력
  - Conditional: 원본 이벤트 선택 + 속성 조건 빌더 (platform/channel = 값)
- 삭제 (확인 다이얼로그)
- Pro 게이팅: Free 플랜은 최대 5개, Pro는 무제한

### CE-3: Analysis Integration (MED effort, HIGH impact)
- useFunnelAnalysis: 커스텀 이벤트를 uniqueEvents와 함께 드롭다운에 표시
- useRetentionAnalysis: 코호트/액티브 이벤트에 커스텀 이벤트 사용 가능
- 커스텀 이벤트 해석 로직 (eventResolver):
  - alias → 원본 이벤트명으로 치환
  - group → 포함된 모든 이벤트의 사용자 합집합
  - conditional → 이벤트 + 속성 조건 필터링
- FunnelAnalysis/RetentionAnalysis 드롭다운에 커스텀 이벤트 섹션 추가

### CE-4: Sidebar & Route & i18n (LOW effort, LOW impact)
- router.tsx에 `/app/events` lazy 라우트 추가
- Sidebar에 Tag 아이콘 + 네비게이션 항목 추가
- i18n 키 추가 (ko/en pages.json, common.json)

## Dependencies
- Supabase: fre_custom_events 테이블 + RLS
- 기존 uniqueEvents 시스템과의 병합 로직

## Out of Scope
- 이벤트 기반 알림 트리거 (별도 PDCA)
- 이벤트 시퀀스/패턴 정의 (e.g., A → B within 5min)
- AI 기반 이벤트 추천
- 이벤트 속성(properties) 커스텀 파싱 (현재 CSV 컬럼만 지원)

## Success Metrics
- 커스텀 이벤트 3가지 타입 (alias, group, conditional) 정의 가능
- 퍼널/리텐션 분석에서 커스텀 이벤트 사용 가능
- DB 저장/로드 정상 작동
- i18n 완전 지원 (ko/en)
