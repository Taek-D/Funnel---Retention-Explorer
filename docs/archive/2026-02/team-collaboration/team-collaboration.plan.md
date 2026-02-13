# Team Collaboration Plan

## Overview
팀 협업 기능을 Supabase 기반으로 구현합니다. 현재 TeamPage.tsx의 localStorage UI-only 구현을 실제 DB 백엔드로 교체하고, 초대/역할/팀 범위 데이터 공유를 지원합니다.

## Current State (~15% coverage)
- TeamPage.tsx: UI 존재 (localStorage 기반, 타입 로컬 정의)
- types/index.ts: PlanType에 'team' 있으나 팀 관련 타입 미정의
- supabaseData.ts: 팀 관련 함수 없음
- DB: fre_teams, fre_team_members 테이블 없음
- i18n: teamPage.* 키 20+ 존재

## Scope

### TC-1: Database Schema & RLS (MEDIUM effort, HIGH impact)
- `fre_teams` 테이블: id, name, owner_id, created_at, updated_at
- `fre_team_members` 테이블: id, team_id, user_id, email, role (admin/member/viewer), status (pending/active/removed), invited_at, joined_at
- RLS 정책: 팀 멤버만 자신의 팀 데이터 조회/수정 가능
- owner_id → auth.users(id) FK
- team_id → fre_teams(id) FK, user_id → auth.users(id) FK (nullable, pending 초대 시)

### TC-2: TypeScript Types (LOW effort, LOW impact)
- TeamRole, TeamMember, Team 타입을 types/index.ts로 이동
- TeamPage.tsx의 로컬 타입 제거, import로 교체
- InvitationStatus type 추가 ('pending' | 'active' | 'removed')

### TC-3: Supabase CRUD Functions (MEDIUM effort, HIGH impact)
- lib/supabaseData.ts에 팀 관련 함수 추가:
  - `createTeam(name, ownerId)` — 팀 생성 + owner를 admin으로 자동 추가
  - `getMyTeam(userId)` — 사용자가 속한 팀 조회
  - `updateTeamName(teamId, name)` — 팀 이름 수정
  - `inviteTeamMember(teamId, email, role)` — 멤버 초대 (pending 상태)
  - `removeTeamMember(teamId, memberId)` — 멤버 제거
  - `updateMemberRole(teamId, memberId, role)` — 역할 변경
  - `getTeamMembers(teamId)` — 멤버 목록 조회
  - `deleteTeam(teamId)` — 팀 삭제

### TC-4: TeamPage Supabase Integration (MEDIUM effort, HIGH impact)
- localStorage 로직 제거, Supabase CRUD로 교체
- 팀 미생성 시 생성 플로우 추가
- 초대 시 이메일 기반 (가입 여부 무관)
- 실시간 멤버 목록 업데이트 (Supabase subscribe or refetch)
- 에러 핸들링 + 로딩 상태 추가

### TC-5: Team-scoped Project Sharing (MEDIUM effort, HIGH impact)
- fre_projects 테이블에 team_id 컬럼 추가
- fre_analysis_snapshots에 team_id 컬럼 추가
- 팀 멤버는 team_id가 일치하는 프로젝트/스냅샷 조회 가능
- RLS 정책 업데이트: 개인 + 팀 범위 조회

## Out of Scope
- 실시간 알림 (별도 feature로)
- 이메일 초대 발송 (Supabase Auth invite or SendGrid — 별도)
- 팀 간 프로젝트 이전
- Activity log / 감사 로그
- Admin 대시보드에서 전체 팀 관리

## Dependencies
- Supabase (already configured)
- 기존 RLS 정책 패턴 (fre_projects 참조)

## Risks
- Supabase migration 실패 시 수동 SQL 실행 필요
- RLS 정책 복잡도 증가 (팀+개인 이중 체크)
- pending 초대 사용자가 가입 시 user_id 매핑 필요

## Priority
TC-1 → TC-2 → TC-3 → TC-4 → TC-5 (순차적, 각 단계가 다음 단계에 의존)
