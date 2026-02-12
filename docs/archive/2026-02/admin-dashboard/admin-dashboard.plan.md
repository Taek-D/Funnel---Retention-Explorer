# Admin Dashboard Plan

## Overview
SaaS 운영을 위한 어드민 대시보드. 사용자 관리, 구독/매출 현황, 사용량 통계를 한 곳에서 확인하고 관리할 수 있는 관리자 전용 페이지를 구축합니다.

## Current State (0% Complete)
- **RBAC**: 없음. UserProfile에 role 필드 없음. ProtectedRoute는 인증만 확인
- **Admin Route**: 없음. `/app/admin` 경로 없음
- **Admin Query**: 없음. supabaseData.ts는 현재 사용자 데이터만 조회 (RLS)
- **데이터 소스**: fre_user_profiles, fre_billing_history, fre_projects, fre_analysis_snapshots, fre_notifications 테이블 존재
- **기존 인프라**: planManager.ts (플랜/가격 상수), analytics.ts (10개 이벤트 추적)

## Scope

### AD-1: Admin Role 시스템 (LOW effort, CRITICAL)
fre_user_profiles에 `role` 컬럼 추가하고, 프론트엔드에서 admin 접근 제어.

**구현**:
- DB: `ALTER TABLE fre_user_profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user','admin'))`
- types/index.ts: UserProfile에 `role: 'user' | 'admin'` 추가
- AuthContext: userProfile에 role 포함
- AdminRoute 컴포넌트: role === 'admin' 체크 (아니면 /app/dashboard로 리다이렉트)
- Sidebar: admin일 때만 Admin 메뉴 표시

### AD-2: Admin Supabase Edge Function (MEDIUM effort, CRITICAL)
클라이언트에서 service_role 키를 쓸 수 없으므로, 어드민 전용 Edge Function으로 데이터를 조회.

**Edge Function**: `admin-api`
- JWT에서 user_id 추출 → fre_user_profiles.role === 'admin' 확인
- 엔드포인트:
  - `GET /stats` — KPI 집계 (총 사용자, Pro 사용자, MRR, 오늘 가입)
  - `GET /users` — 전체 사용자 목록 (프로필 + auth.users email/last_sign_in)
  - `GET /users/:id` — 사용자 상세 (프로필 + 결제 내역 + 프로젝트)
  - `PATCH /users/:id` — 사용자 플랜/역할 수정
  - `GET /billing` — 전체 결제 내역 (최근 100건)
  - `GET /revenue` — 월별 매출 집계

### AD-3: Admin Dashboard 페이지 (MEDIUM effort, HIGH impact)
KPI 카드 + 차트로 서비스 현황을 한눈에 파악.

**KPI 카드 (4개)**:
| 카드 | 값 | 소스 |
|------|------|------|
| 총 사용자 | count | fre_user_profiles |
| Pro 구독자 | count where plan != 'free' | fre_user_profiles |
| MRR (월 반복 매출) | SUM 계산 | billing_cycle + plan |
| 오늘 가입 | count where created_at = today | fre_user_profiles |

**차트 (2개)**:
- 월별 가입자 추이 (Bar chart, 최근 6개월)
- 플랜별 분포 (Pie/Donut chart: Free vs Pro vs Team)

### AD-4: 사용자 관리 페이지 (MEDIUM effort, HIGH impact)
전체 사용자 목록 + 검색 + 상세 보기.

**목록 테이블 컬럼**:
- 이메일, 플랜, 구독 상태, 가입일, 마지막 로그인, 프로젝트 수

**기능**:
- 이메일/플랜 검색/필터
- 사용자 클릭 → 상세 모달 (프로필 + 결제 내역 + 프로젝트 목록)
- 플랜 수동 변경 (admin override)
- 페이지네이션 (20명씩)

### AD-5: 매출/결제 페이지 (LOW effort, MEDIUM impact)
전체 결제 내역 조회 + 월별 매출 차트.

**UI**:
- 결제 내역 테이블 (날짜, 사용자, 금액, 상태, 주문ID)
- 월별 매출 Bar chart (최근 12개월)
- 필터: 기간, 상태 (success/failed/refunded)

## Out of Scope
- **실시간 모니터링**: 서버 상태, API 레이턴시 (Sentry/Vercel Analytics로 대체)
- **이메일 발송**: 사용자에게 직접 이메일 전송 기능
- **A/B 테스트 관리**: 실험 설정/결과 관리
- **콘텐츠 관리(CMS)**: 랜딩 페이지 수정 등
- **감사 로그(Audit Log)**: 어드민 행동 추적 (Phase 2로)
- **사용자 정지/삭제**: 위험한 행동은 Supabase Dashboard에서 직접 처리

## Implementation Order
1. AD-1 (Role 시스템) → 접근 제어 기반
2. AD-2 (Edge Function) → 데이터 조회 기반
3. AD-3 (대시보드 페이지) → KPI 확인
4. AD-4 (사용자 관리) → 운영 핵심
5. AD-5 (매출 페이지) → 재무 현황

## Dependencies
- Supabase (fre_user_profiles role 컬럼 추가 마이그레이션)
- Supabase Edge Function 배포 (admin-api)
- 기존 Recharts, 라우터, i18n 인프라 활용

## Success Criteria
- [ ] admin role 사용자만 `/app/admin/*` 접근 가능
- [ ] KPI 카드 4개가 실시간 데이터 표시
- [ ] 전체 사용자 목록 + 검색/필터 동작
- [ ] 사용자 플랜 수동 변경 가능
- [ ] 결제 내역 조회 + 월별 매출 차트 표시
- [ ] 일반 사용자에게 Admin 메뉴 노출되지 않음
- [ ] 기존 310개 테스트 통과
- [ ] ko/en i18n 완전 지원
