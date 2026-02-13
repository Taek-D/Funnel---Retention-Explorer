# Webhook Plan

## Overview
분석 완료, 데이터 임포트, AI 인사이트, 내보내기 등의 이벤트 발생 시 사용자가 설정한 외부 URL(Slack, Discord, 이메일 등)로 알림을 보내는 Webhook 시스템을 추가합니다.
기존 `NotificationContext`의 `addNotification` 흐름에 Webhook 디스패치를 연결하여, 인앱 알림과 동시에 외부 전송이 가능하도록 합니다.

## Current State
- 인앱 알림: NotificationContext에서 4가지 타입(analysis, import, ai, export) 지원
- 알림 트리거: 7개 훅 + 1개 컴포넌트에서 addNotification 호출
- 알림 설정: NotificationPreferencesModal (localStorage 기반 토글)
- Supabase 저장: fre_notifications 테이블 (user_id, type, title, message)
- 외부 연동: 없음 (Webhook/Slack/Discord/Email 미지원)

## Scope

### WH-1: Webhook Types & DB Schema (LOW effort, HIGH impact)
- WebhookConfig 타입 추가 (url, events, active, format)
- Supabase 테이블: fre_webhooks (id, user_id, name, url, events[], secret, active, created_at)
- CRUD 함수: listWebhooks, createWebhook, updateWebhook, deleteWebhook
- Webhook secret 생성 (HMAC 서명 검증용)

### WH-2: Webhook Delivery Edge Function (MED effort, HIGH impact)
- Supabase Edge Function: `webhook-dispatch`
- POST 요청: JSON payload + HMAC-SHA256 서명 (X-Webhook-Signature 헤더)
- 재시도 로직: 실패 시 1회 재시도 (최대 2회 시도)
- 전송 로그: fre_webhook_logs 테이블 (webhook_id, event_type, status, response_code, created_at)

### WH-3: NotificationContext 연동 (LOW effort, HIGH impact)
- addNotification 호출 시 사용자의 활성 Webhook 조회
- 매칭되는 이벤트 타입의 Webhook에 비동기 디스패치
- 디스패치 실패가 인앱 알림에 영향 주지 않도록 격리

### WH-4: Webhook 설정 UI (MED effort, MED impact)
- 설정 페이지 내 Webhook 관리 섹션
- Webhook 추가/수정/삭제 폼 (이름, URL, 이벤트 선택, 활성/비활성)
- 테스트 전송 버튼 (핑 이벤트 전송)
- 전송 로그 보기 (최근 20건, 상태코드 표시)

### WH-5: Slack/Discord 프리셋 (LOW effort, MED impact)
- Slack Incoming Webhook 포맷 변환 (blocks/text 형식)
- Discord Webhook 포맷 변환 (embeds 형식)
- 프리셋 선택 시 URL 패턴 자동 감지 + 포맷 자동 적용
- 일반 JSON 포맷 (커스텀 URL 기본)

### WH-6: i18n Keys (LOW effort, LOW impact)
- Webhook 관련 한국어/영어 키 추가 (~25개)
- 설정 UI 텍스트, 상태 메시지, 에러 메시지

## Non-Scope
- Email 전송 (SMTP/SendGrid 연동) — 별도 PDCA
- Webhook 인증 (OAuth 기반 Slack App 설치) — 별도 PDCA
- 실시간 WebSocket 알림 — 별도 PDCA
- 관리자 대시보드에서의 Webhook 모니터링 — 별도 PDCA

## Success Criteria
- Webhook URL 등록 → 분석 완료 시 POST 요청 전송 성공
- Slack/Discord Webhook URL → 포맷 자동 감지 + 정상 메시지 표시
- HMAC 서명 검증 가능 (X-Webhook-Signature 헤더)
- 전송 실패 시 인앱 알림 정상 작동 (격리)
- 310+ 테스트 통과
