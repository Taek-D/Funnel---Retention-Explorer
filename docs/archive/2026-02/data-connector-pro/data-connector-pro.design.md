# Data Connector Pro Design Document

> **Summary**: OAuth API 연동, DB 직접 연결, 자동 동기화, 커넥터 설정 저장 — Pro/Enterprise 수익화 핵심 기능
>
> **Project**: Funnel & Retention Explorer
> **Author**: PDCA System
> **Date**: 2026-02-14
> **Status**: Draft
> **Planning Doc**: [data-connector-pro.plan.md](../../01-plan/features/data-connector-pro.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. 기존 파일 기반 커넥터(CSV/JSON/Google Sheets)에 **API 연동 커넥터** 추가
2. 모든 커넥터 출력을 기존 `RawRow[] → processData → ProcessedEvent[]` 파이프라인에 통합
3. Pro/Enterprise 플랜 게이팅으로 **수익화 전환율 극대화**
4. 커넥터 설정을 Supabase에 저장하여 **재사용성** 확보

### 1.2 Design Principles

- **Pipeline Reuse**: 모든 소스의 출력은 `RawRow[]` → 기존 파이프라인 100% 재사용
- **Server-Side Security**: OAuth 토큰, DB 비밀번호는 Edge Function에서만 처리, 클라이언트 노출 제로
- **Progressive Enhancement**: Free 사용자에게 커넥터 UI 표시 + Pro 업그레이드 유도
- **Extensibility**: 새 커넥터 추가 시 Edge Function + ConnectorType 확장만으로 구현

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Browser)                                         │
│                                                             │
│  ConnectorsPage ──→ useConnectors hook ──→ supabaseData.ts  │
│       │                    │                                │
│       │              connector-proxy                        │
│       │              (Edge Function)                        │
│       ▼                    │                                │
│  DataImport ──→ useCSVUpload (handleAPIImport)              │
│       │                    │                                │
│       ▼                    ▼                                │
│  processData() ◄── RawRow[] (normalized)                    │
└─────────────────────────────────────────────────────────────┘
                             │
                    Supabase Edge Functions
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   connector-proxy    connector-oauth    connector-sync
   (API/DB 호출)      (Google OAuth)     (자동 동기화)
         │                   │                   │
         ▼                   ▼                   ▼
   [GA4 API]           [Google Auth]      [pg_cron trigger]
   [Mixpanel API]      [Token Store]      [fre_sync_logs]
   [PostgreSQL]
   [MySQL]
```

### 2.2 Data Flow

```
1. Manual Import Flow:
   ConnectorsPage → "테스트 연결" → connector-proxy → External API/DB
                                                      → RawRow[]
                                                      → processData()

2. Auto Sync Flow:
   pg_cron → connector-sync → connector-proxy → External API/DB
                                               → fre_datasets 저장
                                               → fre_sync_logs 기록
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| ConnectorsPage | useConnectors, usePlanGate | 커넥터 관리 UI |
| useConnectors | supabaseData.ts | 커넥터 CRUD hook |
| connector-proxy | Supabase Service Role | API/DB 프록시 호출 |
| connector-oauth | Google OAuth Client | 토큰 발급 |
| connector-sync | pg_cron, connector-proxy | 자동 동기화 |

---

## 3. Data Model

### 3.1 TypeScript Interfaces

```typescript
// types/index.ts 에 추가

// ConnectorType 확장
export type ConnectorType =
  | 'csv' | 'json' | 'google-sheets'
  | 'ga4-export' | 'mixpanel-export' | 'amplitude-export'
  | 'ga4-api' | 'mixpanel-api' | 'postgresql' | 'mysql';

// Pro 커넥터 구분
export type ProConnectorType = 'ga4-api' | 'mixpanel-api';
export type EnterpriseConnectorType = 'postgresql' | 'mysql';

// 동기화 스케줄
export type SyncSchedule = 'hourly' | 'daily' | 'weekly' | null;

// 동기화 상태
export type SyncStatus = 'idle' | 'running' | 'success' | 'error';

// 커넥터 인스턴스 (Supabase에 저장)
export interface ConnectorInstance {
  id: string;
  user_id: string;
  project_id: string | null;
  type: ConnectorType;
  name: string;
  config: ConnectorConfigData;  // 타입별 설정
  sync_schedule: SyncSchedule;
  last_synced_at: string | null;
  sync_status: SyncStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 타입별 설정 유니온 (프론트엔드용 — 비밀번호는 마스킹)
export type ConnectorConfigData =
  | GA4ApiConfig
  | MixpanelApiConfig
  | PostgreSQLConfig
  | MySQLConfig;

export interface GA4ApiConfig {
  type: 'ga4-api';
  propertyId: string;
  accessToken?: string;   // 서버에서만 관리, 프론트에는 미노출
  refreshToken?: string;  // 서버에서만 관리
  isConnected: boolean;   // OAuth 연결 상태
}

export interface MixpanelApiConfig {
  type: 'mixpanel-api';
  projectId: string;
  apiSecret: string;      // 저장 시 마스킹 (****1234)
}

export interface PostgreSQLConfig {
  type: 'postgresql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;       // 저장 시 마스킹
  ssl: boolean;
  query: string;          // 커스텀 SQL
}

export interface MySQLConfig {
  type: 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;       // 저장 시 마스킹
  query: string;
}

// 동기화 로그
export interface SyncLog {
  id: string;
  connector_id: string;
  status: 'success' | 'error' | 'timeout';
  rows_fetched: number;
  duration_ms: number;
  error_message: string | null;
  created_at: string;
}
```

### 3.2 ConnectorConfig 확장 (기존 레지스트리)

```typescript
// lib/connectors/index.ts 에 추가

export interface ConnectorConfig {
  type: ConnectorType;
  labelKey: string;
  descKey: string;
  iconName: string;
  inputType: 'file' | 'url' | 'oauth' | 'credentials';  // oauth, credentials 추가
  acceptedFormats?: string;
  planGate?: 'pro' | 'enterprise';  // 플랜 게이팅
}

// 기존 6개 + 새로운 4개 = 총 10개
export const CONNECTORS: Record<ConnectorType, ConnectorConfig> = {
  // ... 기존 6개 유지 ...
  'ga4-api': {
    type: 'ga4-api',
    labelKey: 'connector.ga4Api',
    descKey: 'connector.ga4ApiDesc',
    iconName: 'BarChart2',
    inputType: 'oauth',
    planGate: 'pro',
  },
  'mixpanel-api': {
    type: 'mixpanel-api',
    labelKey: 'connector.mixpanelApi',
    descKey: 'connector.mixpanelApiDesc',
    iconName: 'Activity',
    inputType: 'credentials',
    planGate: 'pro',
  },
  postgresql: {
    type: 'postgresql',
    labelKey: 'connector.postgresql',
    descKey: 'connector.postgresqlDesc',
    iconName: 'Database',
    inputType: 'credentials',
    planGate: 'enterprise',
  },
  mysql: {
    type: 'mysql',
    labelKey: 'connector.mysql',
    descKey: 'connector.mysqlDesc',
    iconName: 'Database',
    inputType: 'credentials',
    planGate: 'enterprise',
  },
};
```

### 3.3 Database Schema (Supabase)

```sql
-- DCP-3: 커넥터 설정 테이블
CREATE TABLE fre_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES fre_projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('ga4-api', 'mixpanel-api', 'postgresql', 'mysql')),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  sync_schedule TEXT CHECK (sync_schedule IN ('hourly', 'daily', 'weekly')),
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle', 'running', 'success', 'error')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DCP-4: 동기화 이력 로그
CREATE TABLE fre_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES fre_connectors(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  rows_fetched INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fre_connectors_user ON fre_connectors(user_id);
CREATE INDEX idx_fre_connectors_active ON fre_connectors(is_active) WHERE is_active = true;
CREATE INDEX idx_fre_sync_logs_connector ON fre_sync_logs(connector_id);
CREATE INDEX idx_fre_sync_logs_created ON fre_sync_logs(created_at DESC);

-- RLS Policies
ALTER TABLE fre_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fre_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own connectors" ON fre_connectors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own sync logs" ON fre_sync_logs
  FOR SELECT USING (
    connector_id IN (SELECT id FROM fre_connectors WHERE user_id = auth.uid())
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_fre_connectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fre_connectors_updated
  BEFORE UPDATE ON fre_connectors
  FOR EACH ROW EXECUTE FUNCTION update_fre_connectors_updated_at();
```

---

## 4. Edge Function Specifications

### 4.1 connector-proxy

**Purpose**: 외부 API/DB 호출 프록시. 클라이언트가 자격증명을 직접 접근하지 않도록 서버사이드 처리.

**Endpoint**: `POST /functions/v1/connector-proxy`

**Auth**: Supabase JWT (Authorization: Bearer)

**Request Body**:
```typescript
interface ConnectorProxyRequest {
  action: 'test' | 'fetch';        // 테스트 연결 | 데이터 조회
  connectorId?: string;             // 저장된 커넥터 사용 시
  type: ConnectorType;              // 인라인 설정 사용 시
  config: Record<string, unknown>;  // 인라인 설정 (테스트용)
  dateRange?: {
    from: string;  // ISO 8601
    to: string;
  };
  limit?: number;  // 최대 행 수 (기본 100,000)
}
```

**Response**:
```typescript
// action: 'test'
interface TestResponse {
  success: boolean;
  message: string;
  sampleRows?: number;
}

// action: 'fetch'
interface FetchResponse {
  data: RawRow[];
  headers: string[];
  totalRows: number;
  truncated: boolean;  // limit 초과 시
}
```

**Internal Logic by Type**:

| Type | Library | Connection Method |
|------|---------|-------------------|
| ga4-api | googleapis@v4 | OAuth2 access_token → `analyticsdata.properties.runReport` |
| mixpanel-api | fetch | API Secret → `https://data.mixpanel.com/api/2.0/export` |
| postgresql | postgres (deno) | Connection string → SQL query |
| mysql | mysql2 (deno) | Connection string → SQL query |

**Error Handling**:
- 401: Invalid credentials / expired token
- 403: Insufficient permissions (plan check)
- 408: Query timeout (>30s)
- 429: Rate limit exceeded
- 500: Internal error

### 4.2 connector-oauth

**Purpose**: Google OAuth 2.0 콜백 처리. Authorization code → Access/Refresh token → fre_connectors 저장.

**Endpoint**: `GET /functions/v1/connector-oauth/callback`

**Flow**:
```
1. Frontend → Google Consent Screen URL (redirect)
2. Google → /functions/v1/connector-oauth/callback?code=xxx&state=yyy
3. Edge Function:
   a. Exchange code for access_token + refresh_token
   b. Fetch GA4 property list
   c. Save tokens to fre_connectors.config (encrypted)
   d. Redirect to /app/connectors?oauth=success&connectorId=zzz
```

**Environment Variables** (Edge Function secrets):
```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://{supabase-url}/functions/v1/connector-oauth/callback
```

### 4.3 connector-sync

**Purpose**: 자동 동기화 실행. pg_cron 또는 외부 cron에서 주기적 호출.

**Endpoint**: `POST /functions/v1/connector-sync`

**Auth**: Service Role Key (내부 호출 전용)

**Logic**:
```
1. SELECT * FROM fre_connectors WHERE is_active = true AND sync_schedule IS NOT NULL
2. 각 커넥터에 대해:
   a. sync_schedule 기반 실행 시점 체크
   b. connector-proxy 호출 (action: 'fetch')
   c. 결과를 fre_datasets에 저장 (또는 덮어쓰기)
   d. fre_sync_logs 기록
   e. sync_status, last_synced_at 업데이트
3. 실패 시 3회 재시도 후 sync_status = 'error'
```

---

## 5. Frontend Implementation

### 5.1 New Files

| File | Type | Layer | Description |
|------|------|-------|-------------|
| `pages/ConnectorsPage.tsx` | Page | Presentation | 커넥터 관리 페이지 |
| `hooks/useConnectors.ts` | Hook | Application | 커넥터 CRUD + 동기화 상태 |
| `components/ConnectorCard.tsx` | Component | Presentation | 개별 커넥터 카드 |
| `components/ConnectorModal.tsx` | Component | Presentation | 커넥터 추가/편집 모달 |
| `components/ConnectorFormGA4.tsx` | Component | Presentation | GA4 OAuth 설정 폼 |
| `components/ConnectorFormMixpanel.tsx` | Component | Presentation | Mixpanel API Secret 폼 |
| `components/ConnectorFormDB.tsx` | Component | Presentation | PostgreSQL/MySQL 설정 폼 |
| `components/SyncStatusBadge.tsx` | Component | Presentation | 동기화 상태 뱃지 |

### 5.2 Modified Files

| File | Changes |
|------|---------|
| `types/index.ts` | ConnectorType 확장, ConnectorInstance/SyncLog/Config 타입 추가 |
| `lib/connectors/index.ts` | CONNECTORS 레지스트리에 4개 Pro/Enterprise 커넥터 추가, inputType 확장 |
| `lib/supabaseData.ts` | getConnectors, saveConnector, updateConnector, deleteConnector, getSyncLogs 추가 |
| `lib/planManager.ts` | PLAN_LIMITS에 connectors, syncSchedule 추가 |
| `hooks/useCSVUpload.ts` | handleAPIImport 함수 추가 (connector-proxy 호출 → RawRow[] → processData) |
| `hooks/usePlanGate.ts` | canUseConnector(type) 함수 추가 |
| `router.tsx` | `/app/connectors` 라우트 추가 |
| `components/Sidebar.tsx` | Connectors 메뉴 아이템 추가 (Plug 아이콘) |
| `components/Icons.tsx` | Database, Plug 아이콘 추가 |
| `locales/ko/pages.json` | 커넥터 관리 i18n 키 ~40개 |
| `locales/en/pages.json` | 커넥터 관리 i18n 키 ~40개 |
| `pages/Dashboard.tsx` | connectors 위젯 추가 (활성 커넥터 수 + 마지막 동기화) |

### 5.3 PLAN_LIMITS 확장

```typescript
// lib/planManager.ts
export const PLAN_LIMITS = {
  free:  { csvRows: 10_000,    aiCallsPerDay: 3,   projects: 1,  savedAnalyses: 5,  teamMembers: 1,  connectors: 0,   syncSchedule: null as SyncSchedule },
  pro:   { csvRows: 500_000,   aiCallsPerDay: 50,  projects: -1, savedAnalyses: -1, teamMembers: 1,  connectors: 3,   syncSchedule: 'daily' as SyncSchedule },
  team:  { csvRows: 1_000_000, aiCallsPerDay: 200, projects: -1, savedAnalyses: -1, teamMembers: 10, connectors: -1,  syncSchedule: 'hourly' as SyncSchedule },
};
```

### 5.4 usePlanGate 확장

```typescript
// hooks/usePlanGate.ts 에 추가
canUseConnector(type: ConnectorType): boolean
// - 'ga4-api', 'mixpanel-api' → isPro
// - 'postgresql', 'mysql' → isTeam (Enterprise)
// - 나머지 → true (Free)

connectorLimit: number
// PLAN_LIMITS[plan].connectors

maxSyncSchedule: SyncSchedule
// PLAN_LIMITS[plan].syncSchedule
```

---

## 6. UI/UX Design

### 6.1 ConnectorsPage Layout

```
┌──────────────────────────────────────────────────────────┐
│  Header: "데이터 커넥터"               [+ 새 커넥터] Pro │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ GA4 API      │  │ PostgreSQL   │  │ + 커넥터     │   │
│  │ ● 연결됨     │  │ ● idle       │  │   추가       │   │
│  │ 마지막: 2h전 │  │ 매일 동기화  │  │              │   │
│  │ [동기화][편집]│  │ [동기화][편집]│  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ── 동기화 이력 ──                                       │
│  │ 시간           │ 커넥터  │ 상태    │ 행수  │ 소요시간│
│  │ 2026-02-14 09  │ GA4 API │ success │ 5,230 │ 2.1s   │
│  │ 2026-02-13 09  │ GA4 API │ success │ 4,980 │ 1.8s   │
│  │ 2026-02-13 01  │ PG      │ error   │ 0     │ 30s    │
│  └────────────────┴─────────┴─────────┴───────┴────────│
└──────────────────────────────────────────────────────────┘
```

### 6.2 ConnectorModal — GA4 OAuth Flow

```
┌───────────────────────────────────────┐
│  GA4 API 연동                    [×]  │
├───────────────────────────────────────┤
│                                       │
│  이름: [My GA4 Connector        ]     │
│                                       │
│  [Google 계정으로 연결]               │
│  → Google OAuth Consent 팝업         │
│  → 권한 승인 후 자동 복귀            │
│                                       │
│  ✅ 연결됨: property/1234567          │
│  프로퍼티: [프로퍼티 선택 ▼    ]      │
│                                       │
│  동기화 주기: [매일 ▼]               │
│                                       │
│  [테스트 연결]        [저장]          │
└───────────────────────────────────────┘
```

### 6.3 ConnectorModal — DB Credentials

```
┌───────────────────────────────────────┐
│  PostgreSQL 연결                 [×]  │
├───────────────────────────────────────┤
│                                       │
│  이름:     [Production DB       ]     │
│  호스트:   [db.example.com      ]     │
│  포트:     [5432                ]     │
│  데이터베이스: [analytics        ]     │
│  사용자:   [readonly_user       ]     │
│  비밀번호: [••••••••••••        ]     │
│  ☐ SSL 사용                          │
│                                       │
│  SQL 쿼리:                            │
│  ┌──────────────────────────────────┐ │
│  │ SELECT user_id, event_name,     │ │
│  │   timestamp, platform           │ │
│  │ FROM events                     │ │
│  │ WHERE timestamp > '2026-01-01'  │ │
│  └──────────────────────────────────┘ │
│                                       │
│  동기화 주기: [매주 ▼]               │
│                                       │
│  [테스트 연결]        [저장]          │
└───────────────────────────────────────┘
```

### 6.4 Free User Upgrade Overlay

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  🔒 Pro 플랜에서 사용 가능                      │
│                                                  │
│  GA4, Mixpanel API 실시간 연동과                │
│  자동 동기화로 데이터를 자동으로                 │
│  최신 상태로 유지하세요.                         │
│                                                  │
│  [Pro 업그레이드]  [자세히 보기]                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 6.5 User Flow

```
Free User:
  /app/connectors → 업그레이드 오버레이 표시 → 커넥터 카드 미리보기(blur)

Pro User:
  /app/connectors → 커넥터 목록 → [+ 새 커넥터]
    → 타입 선택 (GA4 API / Mixpanel API)
    → 설정 입력 + 테스트 연결
    → 저장 → 동기화 주기 설정
    → [지금 동기화] → connector-proxy → 데이터 로드
    → /app/upload 또는 /app/dashboard 로 이동

Enterprise User:
  위 + PostgreSQL/MySQL 커넥터 사용 가능
  동기화 주기: hourly까지 선택 가능
```

---

## 7. Security Considerations

- [x] DB 비밀번호/API Secret: Edge Function에서 pgcrypto AES-256 암호화 후 fre_connectors.config에 저장
- [x] OAuth 토큰: Edge Function만 접근 (클라이언트 미노출)
- [x] RLS: user_id 기반 본인 커넥터만 접근
- [x] SQL Injection 방지: DB 커넥터 쿼리를 parameterized query로 실행
- [x] Rate Limiting: connector-proxy 사용자당 분당 10회 제한
- [x] HTTPS: 모든 Edge Function 통신 SSL/TLS
- [x] 프론트엔드 비밀번호 마스킹: 저장된 비밀번호는 `****1234` 형태로만 표시

---

## 8. Error Handling

### 8.1 Error Codes

| Code | Context | Message | Handling |
|------|---------|---------|----------|
| CONN_AUTH_FAILED | OAuth/API | 인증 실패 | 재연결 안내 |
| CONN_TIMEOUT | DB/API | 연결 시간 초과 | 재시도 안내 |
| CONN_PERMISSION | Plan Gate | 플랜 미달 | 업그레이드 모달 |
| CONN_LIMIT | Connector Limit | 커넥터 수 초과 | 업그레이드 모달 |
| CONN_QUERY_ERROR | DB | SQL 쿼리 에러 | 에러 메시지 표시 |
| CONN_RATE_LIMIT | API | 요청 빈도 초과 | 대기 후 재시도 안내 |
| SYNC_FAILED | Auto Sync | 동기화 실패 | 알림 + 로그 기록 |

### 8.2 Frontend Error Display

```typescript
// Toast messages
toast('error', t('connector.error.authFailed'));
toast('error', t('connector.error.timeout'));
toast('warning', t('connector.error.rateLimit'));
```

---

## 9. Test Plan

### 9.1 Vitest Unit Tests

| Target | Test Cases | File |
|--------|-----------|------|
| ConnectorType 확장 | 10개 타입 존재 확인, planGate 필드 검증 | `__tests__/unit/connectors.test.ts` |
| useConnectors hook | CRUD mock, 동기화 상태 변경 | `__tests__/hooks/useConnectors.test.tsx` |
| PLAN_LIMITS 확장 | connectors, syncSchedule 필드 존재 | `__tests__/unit/planManager.test.ts` (확장) |
| usePlanGate 확장 | canUseConnector 반환값 검증 | `__tests__/hooks/usePlanGate.test.tsx` (확장) |

### 9.2 Key Test Cases

- [x] Free 사용자가 ga4-api 커넥터 추가 시도 → 업그레이드 모달
- [x] Pro 사용자가 커넥터 3개 초과 추가 시도 → 업그레이드 모달
- [x] connector-proxy 호출 mock → RawRow[] 반환 + processData 파이프라인 연결
- [x] 동기화 상태 변경: idle → running → success/error
- [x] SyncLog 목록 렌더링 + 필터링
- [x] ConnectorModal 폼 유효성 검증 (빈 필드, 잘못된 포트 등)
- [x] 기존 310+ 테스트 유지

---

## 10. Implementation Guide

### 10.1 File Structure

```
funnel-&-retention-explorer frontend/
├── types/index.ts                    # ConnectorInstance, SyncLog, Config 타입 추가
├── lib/
│   ├── connectors/
│   │   └── index.ts                  # CONNECTORS 레지스트리 확장 (10개)
│   ├── supabaseData.ts               # getConnectors, saveConnector 등 추가
│   └── planManager.ts                # PLAN_LIMITS 확장
├── hooks/
│   ├── useConnectors.ts              # NEW: 커넥터 CRUD + 동기화 hook
│   ├── useCSVUpload.ts               # handleAPIImport 추가
│   └── usePlanGate.ts                # canUseConnector 추가
├── pages/
│   └── ConnectorsPage.tsx            # NEW: 커넥터 관리 페이지
├── components/
│   ├── ConnectorCard.tsx             # NEW: 커넥터 카드
│   ├── ConnectorModal.tsx            # NEW: 추가/편집 모달
│   ├── ConnectorFormGA4.tsx          # NEW: GA4 OAuth 폼
│   ├── ConnectorFormMixpanel.tsx     # NEW: Mixpanel 폼
│   ├── ConnectorFormDB.tsx           # NEW: DB 폼
│   ├── SyncStatusBadge.tsx           # NEW: 동기화 상태 뱃지
│   ├── Icons.tsx                     # Database, Plug 아이콘 추가
│   └── Sidebar.tsx                   # 커넥터 메뉴 추가
├── router.tsx                        # /app/connectors 라우트 추가
└── locales/
    ├── ko/pages.json                 # ~40 keys 추가
    └── en/pages.json                 # ~40 keys 추가
```

### 10.2 Supabase Edge Functions

```
supabase/functions/
├── connector-proxy/index.ts          # NEW: API/DB 프록시
├── connector-oauth/index.ts          # NEW: Google OAuth 콜백
└── connector-sync/index.ts           # NEW: 자동 동기화 실행
```

### 10.3 Implementation Order

```
Phase 1: Foundation (DCP-1 + DCP-3)
──────────────────────────────────
  1. types/index.ts — ConnectorInstance, SyncLog, Config 타입
  2. lib/connectors/index.ts — CONNECTORS 확장 (10개)
  3. SQL migration — fre_connectors, fre_sync_logs 테이블
  4. lib/supabaseData.ts — CRUD 함수 (getConnectors, saveConnector, etc.)
  5. lib/planManager.ts — PLAN_LIMITS 확장

Phase 2: Edge Functions (DCP-1 + DCP-2)
──────────────────────────────────────
  6. connector-proxy Edge Function — GA4/Mixpanel/PostgreSQL/MySQL 프록시
  7. connector-oauth Edge Function — Google OAuth 콜백
  8. hooks/useCSVUpload.ts — handleAPIImport 추가

Phase 3: Auto Sync (DCP-4)
──────────────────────────
  9. connector-sync Edge Function — 자동 동기화
  10. pg_cron 스케줄 설정

Phase 4: UI (DCP-5)
────────────────────
  11. hooks/useConnectors.ts — CRUD hook
  12. hooks/usePlanGate.ts — canUseConnector 확장
  13. components/ConnectorCard, ConnectorModal, Forms, SyncStatusBadge
  14. pages/ConnectorsPage.tsx
  15. router.tsx + Sidebar.tsx — 라우트 + 메뉴
  16. Dashboard.tsx — 커넥터 위젯

Phase 5: Polish (DCP-6)
───────────────────────
  17. locales/ko/pages.json + en/pages.json — ~40 keys
  18. components/Icons.tsx — Database, Plug 추가
  19. __tests__/ — 단위 테스트 추가
  20. 기존 310+ 테스트 통과 확인
```

### 10.4 Checklist Summary

| # | Item | Status |
|---|------|--------|
| 1 | types/index.ts — 8개 새 타입/인터페이스 추가 | ☐ |
| 2 | lib/connectors/index.ts — ConnectorConfig.inputType 확장 + 4개 커넥터 추가 | ☐ |
| 3 | SQL migration — fre_connectors + fre_sync_logs + RLS + indexes | ☐ |
| 4 | lib/supabaseData.ts — 5개 CRUD 함수 추가 | ☐ |
| 5 | lib/planManager.ts — PLAN_LIMITS connectors/syncSchedule 추가 | ☐ |
| 6 | Edge Function: connector-proxy — GA4/Mixpanel/PG/MySQL 프록시 | ☐ |
| 7 | Edge Function: connector-oauth — Google OAuth 콜백 | ☐ |
| 8 | hooks/useCSVUpload.ts — handleAPIImport 추가 | ☐ |
| 9 | Edge Function: connector-sync — 자동 동기화 | ☐ |
| 10 | hooks/useConnectors.ts — 커넥터 관리 hook (NEW) | ☐ |
| 11 | hooks/usePlanGate.ts — canUseConnector/connectorLimit 확장 | ☐ |
| 12 | components/ — ConnectorCard, ConnectorModal, 3 Forms, SyncStatusBadge (6 files) | ☐ |
| 13 | pages/ConnectorsPage.tsx (NEW) | ☐ |
| 14 | router.tsx — /app/connectors 라우트 추가 | ☐ |
| 15 | components/Sidebar.tsx — 커넥터 메뉴 아이템 추가 | ☐ |
| 16 | components/Icons.tsx — Database, Plug 아이콘 추가 | ☐ |
| 17 | pages/Dashboard.tsx — 커넥터 상태 위젯 추가 | ☐ |
| 18 | locales/ko/pages.json — ~40 i18n keys | ☐ |
| 19 | locales/en/pages.json — ~40 i18n keys | ☐ |
| 20 | __tests__/unit/connectors.test.ts (NEW) | ☐ |
| 21 | __tests__/hooks/useConnectors.test.tsx (NEW) | ☐ |
| 22 | __tests__/unit/planManager.test.ts — connectors 관련 테스트 추가 | ☐ |
| 23 | __tests__/hooks/usePlanGate.test.tsx — canUseConnector 테스트 추가 | ☐ |
| 24 | tsc --noEmit 0 errors | ☐ |
| 25 | vitest run 310+ passing | ☐ |
| 26 | vite build success | ☐ |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-14 | Initial draft | PDCA System |
