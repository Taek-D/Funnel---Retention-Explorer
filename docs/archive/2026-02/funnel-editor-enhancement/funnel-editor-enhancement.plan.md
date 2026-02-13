# Funnel Editor Enhancement — Plan

## 1. Overview

FunnelAnalysis 페이지의 스텝 빌더를 고도화합니다.
드래그 앤 드롭으로 스텝 순서를 변경하고, 퍼널 설정을 Supabase에 저장/불러오기할 수 있게 합니다.

## 2. Problem

- 현재 ChevronUp/Down 버튼으로만 순서 변경 → 직관적이지 않음
- 템플릿 저장이 localStorage 전용 → 기기간 동기화 불가
- 저장된 퍼널 목록 관리 UI 없음 (이름 변경, 삭제 확인 등)

## 3. Scope

### FE-1: Drag & Drop Step Reorder
- HTML5 DnD API로 스텝 카드 드래그 앤 드롭
- GripVertical 핸들 아이콘 (기존 import 있음)
- 드래그 중 시각적 피드백 (opacity, border highlight)
- 기존 ChevronUp/Down 유지 (접근성 대안)

### FE-2: Saved Funnels (Supabase)
- fre_saved_funnels 테이블 (id, user_id, name, steps JSONB, created_at, updated_at)
- RLS policies
- CRUD functions in supabaseData.ts
- Guest: localStorage fallback (기존 로직 확장)

### FE-3: Save/Load UI
- "Save Funnel" 버튼 → 이름 입력 모달 (신규) 또는 덮어쓰기 (기존)
- "Load Funnel" 드롭다운 → 저장된 퍼널 목록
- 삭제 버튼 (X) + 확인
- Pro gate 없음 (무료 기능)

### FE-4: i18n
- funnel.saveFunnel, loadFunnel, funnelName, deleteFunnelConfirm 등 키 추가

## 4. Out of Scope
- 조건 분기 (conditional branching) — 별도 PDCA
- 퍼널 에디터를 별도 페이지로 분리 (현재 FunnelAnalysis 내에서 처리)

## 5. Dependencies
- 기존 FunnelAnalysis.tsx 스텝 빌더
- 기존 useFunnelAnalysis hook
- lib/supabaseData.ts
