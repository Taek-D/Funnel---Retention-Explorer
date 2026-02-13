# Data Connector Plan

## Overview
CSV 파일 업로드 외에 JSON 파일, Google Sheets URL, 외부 분석 도구(GA4, Mixpanel, Amplitude) 내보내기 형식을 지원하는 데이터 커넥터 시스템을 추가합니다.
기존 `RawRow[] → processData → ProcessedEvent[]` 파이프라인을 재사용하며, 앞단에 소스별 변환 계층을 추가합니다.

## Current State
- 데이터 입력: CSV 파일 업로드 + 샘플 데이터(ecommerce/saas) 2종
- 파싱: papaparse CSV 전용
- 컬럼 매핑: autoDetectColumns (이름 기반) + detectColumnsByValues (값 기반 폴백)
- 지원 형식: CSV만 (JSON, Google Sheets 미지원)
- 외부 분석 도구 연동: 없음

## Scope

### DC-1: Connector Types & Infrastructure (LOW effort, HIGH impact)
- ConnectorType 타입 추가 ('csv' | 'json' | 'google-sheets' | 'ga4-export' | 'mixpanel-export' | 'amplitude-export')
- ConnectorConfig 인터페이스 (type, label, icon, description)
- `lib/connectors/index.ts` 커넥터 레지스트리
- DataImport 페이지에 "데이터 소스 선택" 섹션 추가

### DC-2: JSON File Import (LOW effort, HIGH impact)
- `lib/connectors/jsonConnector.ts` — JSON 파일 파싱 (배열 of 객체)
- useCSVUpload 확장: handleFileUpload에서 `.json` 파일도 처리
- JSON → RawRow[] 변환 (중첩 객체 flatten)
- 동일한 autoDetectColumns → processData 파이프라인 재사용

### DC-3: Google Sheets URL Import (MED effort, MED impact)
- `lib/connectors/googleSheetsConnector.ts`
- 공개/공유 Google Sheets URL 입력 → CSV 형식 다운로드 (export?format=csv)
- Supabase Edge Function 프록시 (CORS 우회): `sheets-proxy`
- URL 입력 UI + 로딩 상태

### DC-4: Analytics Export Format Presets (MED effort, HIGH impact)
- `lib/connectors/presetTransformers.ts`
- GA4 BigQuery Export 형식: event_name, user_pseudo_id, event_timestamp 등 → RawRow[]
- Mixpanel Export 형식: event, distinct_id, time 등 → RawRow[]
- Amplitude Export 형식: event_type, user_id, event_time 등 → RawRow[]
- 자동 형식 감지: 헤더 패턴 매칭으로 소스 자동 인식

### DC-5: Connector UI Enhancement (LOW effort, MED impact)
- DataImport 페이지 리디자인: 탭/카드 기반 소스 선택
- 각 커넥터별 아이콘 + 설명
- i18n 키 추가 (ko/en)
- 소스 선택 후 적절한 입력 UI 표시 (파일 업로드 / URL 입력)

## Non-Scope
- OAuth 기반 실시간 API 연동 (GA4 Admin API, Mixpanel API 직접 호출) — 별도 PDCA
- Supabase에 커넥터 설정 저장/관리 — 별도 PDCA
- 스케줄 기반 자동 데이터 갱신 — 별도 PDCA

## Success Criteria
- JSON 파일 업로드 → 기존 분석 파이프라인 정상 작동
- Google Sheets 공개 URL → 데이터 로드 성공
- GA4/Mixpanel/Amplitude export CSV/JSON → 자동 형식 인식 + 컬럼 매핑
- 310+ 테스트 통과
