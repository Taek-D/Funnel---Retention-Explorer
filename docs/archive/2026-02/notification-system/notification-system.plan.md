# Notification System Enhancement Plan

## Overview
기존 Toast(일시적) + NotificationContext(인메모리) 시스템을 Supabase 기반 영속적 알림 시스템으로 강화하고, 앱 전반에 알림 트리거를 통합합니다.

## Current State (40% Complete)
- **Toast (useToast)**: 일시적 알림. success/error/warning/info. 10+ hooks에서 사용 중. ✅ 충분
- **NotificationContext**: 영속 알림. analysis/import/ai/export 타입. 인메모리 (max 50). 새로고침 시 소실
- **NotificationPanel**: Bell 아이콘 + 드롭다운. 타입 라벨, timeAgo, 빈 상태 UI 있음
- **Integration Gap**: `addNotification()` 호출부 거의 없음 — 알림이 실제로 발생하지 않음

## Scope

### NF-1: 알림 트리거 통합 (LOW effort, HIGH impact)
현재 `addNotification()`이 어디서도 호출되지 않음. 핵심 사용자 행동에 알림 트리거 추가.

**트리거 목록**:
| 이벤트 | 타입 | 제목 예시 |
|--------|------|-----------|
| CSV 업로드 완료 | import | "데이터 업로드 완료" |
| 퍼널 분석 완료 | analysis | "퍼널 분석이 준비되었습니다" |
| 리텐션 분석 완료 | analysis | "리텐션 분석 완료" |
| 세그먼트 비교 완료 | analysis | "세그먼트 비교 결과 확인" |
| AI 인사이트 생성 | ai | "AI 인사이트가 도착했습니다" |
| 데이터 내보내기 완료 | export | "CSV/Excel 내보내기 완료" |
| 리포트 생성 완료 | export | "리포트 생성이 완료되었습니다" |
| 분석 저장 완료 | analysis | "분석이 저장되었습니다" |

**수정 대상 파일**:
- `hooks/useCSVUpload.ts`
- `hooks/useFunnelAnalysis.ts`
- `hooks/useRetentionAnalysis.ts`
- `hooks/useSegmentComparison.ts`
- `hooks/useAIInsights.ts`
- `hooks/useDataExport.ts`
- `hooks/useExportReport.ts`
- `components/SaveAnalysisButton.tsx`

### NF-2: Supabase 영속화 (MEDIUM effort, HIGH impact)
알림을 DB에 저장하여 새로고침/재방문 시에도 유지.

**DB 테이블**: `fre_notifications`
```sql
CREATE TABLE fre_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('analysis','import','ai','export')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE fre_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications"
  ON fre_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own notifications"
  ON fre_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own notifications"
  ON fre_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications"
  ON fre_notifications FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_notifications_user_unread
  ON fre_notifications (user_id, read, created_at DESC);
```

**NotificationContext 변경**:
- 로그인 사용자: Supabase에서 최근 50건 fetch + CRUD
- 게스트 사용자: 기존 인메모리 유지 (변경 없음)
- `supabaseData.ts`에 notification CRUD 함수 추가

### NF-3: 개별 알림 읽음/삭제 (LOW effort, MEDIUM impact)
현재는 "전체 읽음" / "전체 삭제"만 가능.

**추가 기능**:
- 개별 알림 클릭 시 읽음 처리
- 개별 알림 스와이프/X 버튼으로 삭제
- NotificationPanel UI 업데이트

### NF-4: 알림 설정 패널 (MEDIUM effort, MEDIUM impact)
NotificationPanel의 Settings 버튼(현재 placeholder)에 실제 기능 연결.

**설정 항목**:
- 알림 타입별 on/off 토글 (analysis, import, ai, export)
- `fre_user_profiles.notification_preferences` JSONB 컬럼 추가
- 기본값: 모든 타입 활성화

**UI**: Modal로 구현 (기존 Modal 컴포넌트 활용)

## Out of Scope
- **이메일 알림**: 별도 이메일 서비스(SendGrid/Resend) 필요, 별도 feature로
- **실시간 Supabase Realtime**: 멀티 탭/디바이스 동기화는 Phase 2로
- **Push Notification**: 서비스 워커 + FCM 필요, 별도 feature로
- **알림 스케줄링/배치**: 현 단계에서 불필요
- **알림 검색/필터링**: 50건 이하이므로 불필요

## Implementation Order
1. NF-1 (알림 트리거) → 즉시 사용자 가치 제공
2. NF-2 (Supabase 영속화) → 데이터 영속성
3. NF-3 (개별 읽음/삭제) → UX 개선
4. NF-4 (알림 설정) → 사용자 제어

## Dependencies
- Supabase (already configured)
- 기존 NotificationContext, Toast, NotificationPanel (수정)
- 새 파일 없음 (기존 파일 수정 위주)

## Success Criteria
- [ ] 8개 핵심 이벤트에서 알림이 NotificationPanel에 표시됨
- [ ] 로그인 사용자의 알림이 새로고침 후에도 유지됨
- [ ] 개별 알림 읽음/삭제 가능
- [ ] 알림 타입별 on/off 설정 가능
- [ ] 게스트 모드에서 기존 동작 유지 (인메모리)
- [ ] 기존 310개 테스트 통과
