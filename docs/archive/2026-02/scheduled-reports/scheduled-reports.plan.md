# Scheduled Reports Plan

## Overview
주간/월간 자동 분석 리포트 생성 및 Webhook 전송 기능을 구현합니다.
사용자가 스케줄을 설정하면 Supabase Edge Function(Cron)이 주기적으로 리포트 스냅샷을 생성하고,
기존 Webhook 시스템을 통해 Slack/Discord/JSON 형식으로 전달합니다.

## Current State
- 리포트 엔진: `buildReportSnapshot(state)` → `ReportSnapshot` (funnel, retention, insights, subscription)
- 내보내기: PNG/PDF (useExportReport hook, Pro 전용 PDF)
- Webhook: `dispatchWebhooks(eventType, title, message)` — Slack/Discord/JSON 포맷 지원
- 예약 리포트: 없음 (수동 내보내기만 가능)
- 스케줄 설정 UI: 없음

## Scope

### SR-1: Types + DB Schema (LOW effort, HIGH impact)
- `ScheduledReport` 타입 정의 (id, user_id, project_id, name, frequency, day_of_week, time, webhook_ids, active, last_run_at)
- `fre_scheduled_reports` 테이블 + RLS 정책
- frequency: 'daily' | 'weekly' | 'monthly'
- day_of_week: 0-6 (weekly), day_of_month: 1-28 (monthly)
- time: HH:MM (UTC)

### SR-2: CRUD Functions (LOW effort, MED impact)
- `listScheduledReports()`, `createScheduledReport()`, `updateScheduledReport()`, `deleteScheduledReport()`
- supabaseData.ts에 추가

### SR-3: Report Snapshot Engine (MED effort, HIGH impact)
- `generateScheduledSnapshot(projectId)` — 서버사이드 리포트 생성
- 기존 `buildReportSnapshot` 로직을 서버에서도 실행 가능하도록 공유 형태로 리팩터
- 실제 서버 실행은 Edge Function에서 dataset을 불러와 snapshot 생성

### SR-4: Edge Function — scheduled-report (MED effort, HIGH impact)
- Supabase Cron (pg_cron)으로 매 시간 실행
- 현재 시간에 해당하는 active 스케줄 조회
- 각 스케줄별: dataset 조회 → snapshot 생성 → webhook 전송
- `last_run_at` 업데이트
- 에러 로깅 (fre_webhook_logs 재활용)

### SR-5: Schedule Management UI (MED effort, MED impact)
- `/app/scheduled-reports` 페이지
- 스케줄 CRUD (이름, 빈도, 요일/날짜, 시간, 대상 webhook 선택)
- 활성/비활성 토글
- 마지막 실행 시각 표시
- Pro 전용 기능 (usePlanGate)

### SR-6: i18n Keys (LOW effort, LOW impact)
- 한국어/영어 ~15개 키 추가 (scheduledReport 네임스페이스)

## Non-Scope
- 이메일 전송 (SendGrid/Resend 통합 — 별도 PDCA)
- PDF 첨부 리포트 (서버사이드 Canvas 불가 — 별도 PDCA)
- 리포트 히스토리 뷰어 — 별도 PDCA
- 실시간 대시보드 알림 — 기존 NotificationContext로 커버

## Success Criteria
- 사용자가 weekly/monthly 스케줄 생성 가능
- Edge Function이 스케줄에 따라 리포트 생성 + webhook 전송
- 310+ 테스트 통과
- 기존 기능 regression 없음
