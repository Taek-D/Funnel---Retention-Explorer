# Notification Center Plan

## Overview
기존 알림 시스템을 실시간 알림 센터로 업그레이드합니다.
Supabase Realtime으로 실시간 알림 수신, 브라우저 데스크톱 알림, 전용 알림 페이지,
그리고 알림 설정의 DB 동기화를 구현합니다.

## Current State
- NotificationContext: DB 연동 CRUD (insertNotification, listNotifications, markRead, etc.)
- NotificationPanel: 헤더 드롭다운 패널 (bell icon + unread badge, time ago)
- NotificationPreferencesModal: 타입별 on/off (localStorage만, DB 미동기화)
- Webhook dispatch: 알림 생성 시 외부 webhook 전송
- 한계: 페이지 로드 시에만 알림 목록 로드 (실시간 아님), 브라우저 알림 없음, 전체 히스토리 뷰 없음

## Scope

### NC-1: Supabase Realtime Subscription (MED effort, HIGH impact)
- NotificationContext에 Supabase Realtime channel 구독 추가
- fre_notifications 테이블 INSERT 이벤트 감지
- 새 알림 즉시 state에 추가 (다른 탭/기기에서 생성된 알림도 수신)
- 컴포넌트 unmount 시 구독 해제

### NC-2: Browser Desktop Notifications (LOW effort, MED impact)
- Notification API 권한 요청 (useDesktopNotification 훅)
- 새 알림 수신 시 브라우저 알림 표시 (아이콘, 제목, 본문)
- 알림 클릭 시 앱으로 포커스 이동
- 알림 설정에 데스크톱 알림 토글 추가

### NC-3: Full Notifications Page (MED effort, MED impact)
- `/app/notifications` 전용 페이지
- 타입 필터 (analysis, import, ai, export)
- 읽음/안읽음 필터
- 일괄 작업 (선택 삭제, 모두 읽음 처리)
- 페이지네이션 (무한 스크롤 or 더보기 버튼)

### NC-4: Preferences DB Sync (LOW effort, MED impact)
- fre_user_profiles에 notification_preferences JSONB 컬럼 추가
- 로그인 시 DB에서 로드 → localStorage 캐시
- 변경 시 DB + localStorage 동시 저장
- 데스크톱 알림 토글 키 추가

### NC-5: i18n Keys (LOW effort, LOW impact)
- 한국어/영어 ~10개 키 추가

## Non-Scope
- Web Push API (서비스 워커 기반 백그라운드 푸시) — 별도 PDCA
- 이메일 알림 전송 — 별도 PDCA
- 알림 소리 재생 — 별도 PDCA

## Success Criteria
- 다른 탭에서 생성한 알림이 실시간으로 표시
- 브라우저 데스크톱 알림 동작
- 전체 알림 히스토리 페이지에서 필터/삭제 가능
- 310+ 테스트 통과
