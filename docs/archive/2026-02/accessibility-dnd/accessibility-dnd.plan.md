# Accessibility DnD - Plan Document

## Feature Overview

대시보드 위젯 드래그 앤 드롭에 키보드 접근성과 ARIA 속성을 추가합니다.
WCAG 2.1 AA 수준의 접근성을 목표로 합니다.

## Scope

### A11Y-1: DashboardWidget ARIA 속성
- `role="listitem"`, `aria-roledescription`, `aria-label` (위젯명 + 위치)
- `tabIndex={0}` (편집 모드), GripVertical `aria-hidden`
- 버튼에 `aria-label` 추가 (title → aria-label)

### A11Y-2: Dashboard 키보드 리오더링
- 편집 모드 위젯 그리드에 `role="list"`
- Arrow Up/Down으로 위젯 이동
- `aria-live="polite"` 영역으로 이동 결과 알림

### A11Y-3: i18n 접근성 키 추가
- 위젯명, 위치 안내, 키보드 안내 텍스트 (ko/en)

## Out of Scope
- 터치 제스처 (모바일)
- 드래그 중 시각적 고스트 이미지 개선
- 포커스 트랩

## Success Criteria
- 키보드만으로 위젯 순서 변경 가능
- 스크린 리더에서 위젯 위치 및 이동 결과 안내
- 기존 마우스 DnD 동작 영향 없음
