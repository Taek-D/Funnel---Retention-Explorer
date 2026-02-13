# Data Connector Pro Planning Document

> **Summary**: OAuth API 연동, DB 직접 연결, 자동 동기화로 기존 파일 기반 커넥터를 Pro/Enterprise 수익화 기능으로 확장
>
> **Project**: Funnel & Retention Explorer
> **Author**: PDCA System
> **Date**: 2026-02-14
> **Status**: Draft
> **PDCA Cycle**: #46

---

## 1. Overview

### 1.1 Purpose

기존 Data Connector(Phase 28)는 파일 업로드(CSV/JSON) + Google Sheets URL + 분석 도구 내보내기 형식 감지를 지원합니다. 하지만 모두 **수동 1회성 import**로, 실무에서 매번 파일을 내보내고 업로드하는 과정이 번거롭습니다.

이 기능은 **OAuth API 실시간 연동**, **DB 직접 연결**, **자동 동기화 스케줄**, **커넥터 설정 저장**을 추가하여:
1. 사용자의 데이터 입력 마찰을 크게 줄이고
2. Pro/Enterprise 플랜의 핵심 차별화 기능으로 수익화를 촉진합니다

### 1.2 Background

- Phase 28(data-connector)의 Non-Scope 항목이 이번 Scope의 핵심
- 현재 최대 약점: CSV 수동 업로드만 가능 → 실무 활용도 낮음
- 경쟁 제품(Mixpanel, Amplitude, PostHog)은 모두 실시간 API 연동 기본 제공
- 연동 설정 완료 후 이탈 비용 증가 → retention + conversion 동시 향상

### 1.3 Related Documents

- Previous: [data-connector (Phase 28)](../../archive/2026-02/data-connector/data-connector.report.md)
- Existing code: `lib/connectors/` (index.ts, jsonConnector.ts, googleSheetsConnector.ts, presetTransformers.ts)

---

## 2. Scope

### 2.1 In Scope

- [x] DCP-1: OAuth API 커넥터 (GA4 Data API + Mixpanel Export API)
- [x] DCP-2: PostgreSQL/MySQL DB 커넥터 (Supabase Edge Function 프록시)
- [x] DCP-3: 커넥터 설정 저장/관리 (Supabase DB + 프로젝트 연동)
- [x] DCP-4: 자동 동기화 스케줄 (1시간/1일/1주 주기)
- [x] DCP-5: 커넥터 관리 UI (설정 CRUD + 동기화 상태 + Pro 게이팅)
- [x] DCP-6: i18n + 테스트

### 2.2 Out of Scope

- Amplitude API 직접 연동 (Amplitude export 형식 감지는 이미 존재)
- Webhook 기반 실시간 이벤트 스트리밍 (Push 방식)
- Snowflake/BigQuery/Redshift 데이터 웨어하우스 연동
- 타사 CDP(Segment, mParticle) 연동

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Plan Gate |
|----|-------------|----------|-----------|
| FR-01 | GA4 Data API OAuth 연동 (Google OAuth 2.0 → 프로퍼티 목록 → 이벤트 데이터 조회) | High | Pro |
| FR-02 | Mixpanel Export API 연동 (API Secret → 이벤트 데이터 조회) | High | Pro |
| FR-03 | PostgreSQL 연결 (host/port/db/user/password → SQL 쿼리 → 데이터 로드) | High | Enterprise |
| FR-04 | MySQL 연결 (동일 패턴) | Medium | Enterprise |
| FR-05 | 커넥터 설정 Supabase 저장 (fre_connectors 테이블, 암호화 자격증명) | High | Pro |
| FR-06 | 자동 동기화 스케줄 (Supabase pg_cron 또는 Edge Function cron) | High | Pro |
| FR-07 | 동기화 이력 로그 (fre_sync_logs 테이블) | Medium | Pro |
| FR-08 | 커넥터 관리 페이지 (/app/connectors) | High | Pro |
| FR-09 | 동기화 상태 대시보드 위젯 | Medium | Pro |
| FR-10 | Free 사용자에게 업그레이드 유도 UI | High | Free |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement |
|----------|----------|-------------|
| Security | DB 자격증명 AES-256 암호화 저장 | Supabase vault 또는 pgcrypto |
| Security | OAuth 토큰 서버사이드 전용 (Edge Function) | 클라이언트 노출 없음 |
| Performance | API 데이터 조회 < 10초 (10만 row 기준) | Edge Function 타임아웃 내 |
| Reliability | 동기화 실패 시 3회 재시도 + 알림 | fre_sync_logs 기록 |

---

## 4. Technical Architecture

### 4.1 Data Flow

```
[External Source]     [Supabase Edge Function]     [Frontend]
     │                        │                        │
     │  OAuth/API Call        │                        │
     │ ◄─────────────────────│ connector-proxy         │
     │  Response Data         │                        │
     │ ─────────────────────►│                        │
     │                        │  Normalized RawRow[]   │
     │                        │ ─────────────────────►│
     │                        │                        │ processData()
     │                        │                        │ → ProcessedEvent[]
```

### 4.2 New Edge Functions

| Function | Purpose | Auth |
|----------|---------|------|
| `connector-proxy` | GA4/Mixpanel API 호출 프록시 + DB 쿼리 프록시 | Supabase JWT |
| `connector-sync` | 스케줄 기반 자동 동기화 (pg_cron 트리거) | Service Role |
| `connector-oauth` | Google OAuth 콜백 처리 + 토큰 저장 | Supabase JWT |

### 4.3 New DB Tables

```sql
-- 커넥터 설정 (암호화 자격증명)
CREATE TABLE fre_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES fre_projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,           -- 'ga4-api' | 'mixpanel-api' | 'postgresql' | 'mysql'
  name TEXT NOT NULL,           -- 사용자 정의 이름
  config JSONB NOT NULL,        -- 암호화된 설정 (credentials, query 등)
  sync_schedule TEXT,           -- 'hourly' | 'daily' | 'weekly' | null (수동)
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle', -- 'idle' | 'running' | 'error'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 동기화 이력 로그
CREATE TABLE fre_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID REFERENCES fre_connectors(id) ON DELETE CASCADE,
  status TEXT NOT NULL,          -- 'success' | 'error' | 'timeout'
  rows_fetched INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE fre_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fre_sync_logs ENABLE ROW LEVEL SECURITY;
```

### 4.4 Connector Type Extension

```typescript
// types/index.ts 확장
export type ConnectorType =
  | 'csv' | 'json' | 'google-sheets'
  | 'ga4-export' | 'mixpanel-export' | 'amplitude-export'
  // NEW Pro connectors
  | 'ga4-api' | 'mixpanel-api' | 'postgresql' | 'mysql';

export interface ConnectorInstance {
  id: string;
  userId: string;
  projectId: string;
  type: ConnectorType;
  name: string;
  config: Record<string, unknown>;  // 프론트에서는 암호화 해제 불가
  syncSchedule: 'hourly' | 'daily' | 'weekly' | null;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'running' | 'error';
  isActive: boolean;
}

export interface SyncLog {
  id: string;
  connectorId: string;
  status: 'success' | 'error' | 'timeout';
  rowsFetched: number;
  durationMs: number;
  errorMessage: string | null;
  createdAt: string;
}
```

---

## 5. Scope Details

### DCP-1: OAuth API Connectors (HIGH priority)

**GA4 Data API:**
- Google OAuth 2.0 흐름 (consent screen → authorization code → access token)
- Edge Function `connector-oauth`: Google OAuth 콜백, 토큰 저장
- Edge Function `connector-proxy`: GA4 Data API `runReport` 호출
- 프로퍼티 목록 조회 → 사용자 선택 → 이벤트/사용자 데이터 조회
- 응답 → RawRow[] 변환 → 기존 파이프라인 연결

**Mixpanel Export API:**
- API Secret 입력 (OAuth 없이 직접 인증)
- Edge Function `connector-proxy`: Mixpanel Export API 호출
- 날짜 범위 선택 → 이벤트 데이터 조회
- 응답 → RawRow[] 변환

### DCP-2: Database Connectors (HIGH priority)

**PostgreSQL / MySQL:**
- 연결 정보 입력 UI (host, port, database, username, password)
- Edge Function `connector-proxy`: pg/mysql 클라이언트로 쿼리 실행
- 기본 쿼리 템플릿 제공 + 커스텀 SQL 지원
- 결과 → RawRow[] 변환
- 자격증명은 Supabase Vault 또는 pgcrypto로 서버사이드 암호화

### DCP-3: Connector Configuration Storage (HIGH priority)

- `fre_connectors` 테이블 CRUD
- `lib/supabaseData.ts` 확장: saveConnector, getConnectors, updateConnector, deleteConnector
- RLS 정책: 본인 커넥터만 접근
- 자격증명 암호화: Edge Function에서만 복호화 가능

### DCP-4: Auto Sync Schedule (HIGH priority)

- 스케줄 옵션: hourly(1시간), daily(1일), weekly(1주)
- Supabase pg_cron → Edge Function `connector-sync` 호출
- 동기화 실패 시 3회 재시도 → 실패 알림 (notification-center 연동)
- `fre_sync_logs` 기록

### DCP-5: Connector Management UI (HIGH priority)

- 새 라우트: `/app/connectors` (ConnectorsPage)
- 커넥터 목록 (카드 형식): 타입 아이콘, 이름, 마지막 동기화, 상태
- 커넥터 추가 모달: 타입 선택 → 인증 정보 입력 → 테스트 연결 → 저장
- 커넥터 편집/삭제
- 동기화 수동 트리거 버튼
- Free 사용자: 커넥터 목록 표시 + "Pro 업그레이드" 오버레이
- 대시보드 위젯: 활성 커넥터 수 + 마지막 동기화 시간

### DCP-6: i18n + Tests (MEDIUM priority)

- ko/en 번역 키 추가 (커넥터 관리 UI 전체)
- Vitest 단위 테스트: 커넥터 타입 변환, 설정 CRUD mock
- 기존 310+ 테스트 유지

---

## 6. Plan Gating Strategy (Monetization)

| Feature | Free | Pro | Enterprise |
|---------|:----:|:---:|:----------:|
| CSV/JSON 파일 업로드 | O | O | O |
| Google Sheets URL | O | O | O |
| GA4/Mixpanel export 감지 | O | O | O |
| **GA4 API 연동** | X | O | O |
| **Mixpanel API 연동** | X | O | O |
| **PostgreSQL 연결** | X | X | O |
| **MySQL 연결** | X | X | O |
| **커넥터 설정 저장** | X | O (3개) | O (무제한) |
| **자동 동기화** | X | O (daily) | O (hourly) |
| **동기화 이력 조회** | X | O (7일) | O (90일) |

---

## 7. Success Criteria

### 7.1 Definition of Done

- [ ] GA4 OAuth 연동 → 이벤트 데이터 조회 + 분석 파이프라인 연결
- [ ] Mixpanel API Secret → 이벤트 데이터 조회 + 분석 파이프라인 연결
- [ ] PostgreSQL 연결 → SQL 쿼리 결과 로드
- [ ] 커넥터 설정 Supabase 저장/로드/삭제
- [ ] 자동 동기화 스케줄 동작 확인
- [ ] Pro/Enterprise 게이팅 정상 작동
- [ ] 310+ 테스트 통과

### 7.2 Quality Criteria

- [ ] tsc --noEmit 0 errors (strict mode)
- [ ] Vite build 성공
- [ ] 자격증명 클라이언트 노출 없음 (Edge Function only)
- [ ] 기존 CSV/JSON/Google Sheets 커넥터 하위 호환

---

## 8. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Google OAuth 승인 심사 지연 | High | Medium | 테스트용 OAuth 앱으로 개발, 프로덕션 심사 병렬 진행 |
| GA4 API 할당량 초과 | Medium | Low | 요청 배치 + 캐싱 + 사용자별 rate limit |
| DB 자격증명 보안 사고 | High | Low | Supabase Vault 암호화, Edge Function only 접근 |
| Edge Function 타임아웃 (10초) | Medium | Medium | 대용량 데이터 페이징 + 스트리밍 |
| Mixpanel API 변경 | Low | Low | API 버전 고정 + 에러 핸들링 |

---

## 9. Implementation Order

```
DCP-1 (Types + Edge Functions) ─┐
DCP-3 (DB Tables + CRUD)  ──────┼── 병렬 가능
DCP-2 (DB Connectors)     ──────┘
    │
    ▼
DCP-4 (Auto Sync)
    │
    ▼
DCP-5 (UI + Routing)
    │
    ▼
DCP-6 (i18n + Tests)
```

---

## 10. Next Steps

1. [ ] Design 문서 작성 (`/pdca design data-connector-pro`)
2. [ ] Edge Function 개발 환경 준비
3. [ ] Google Cloud Console OAuth 앱 생성
4. [ ] Supabase 마이그레이션 SQL 준비

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-14 | Initial draft | PDCA System |
