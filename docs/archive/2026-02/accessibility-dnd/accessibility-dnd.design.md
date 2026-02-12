# Accessibility DnD - Design Document

## Overview

대시보드 위젯 키보드 접근성 + ARIA 속성 추가. WCAG 2.1 AA 준수.

## References
- Plan: `docs/01-plan/features/accessibility-dnd.plan.md`
- DashboardWidget: `components/DashboardWidget.tsx`
- Dashboard: `pages/Dashboard.tsx`

---

## A11Y-1: DashboardWidget ARIA 속성

### Props 추가

```typescript
interface DashboardWidgetProps {
  // ... existing props
  index: number;        // NEW: 현재 위치 (0-based)
  totalCount: number;   // NEW: 전체 위젯 수
  onMoveUp: () => void; // NEW: 키보드 위로 이동
  onMoveDown: () => void; // NEW: 키보드 아래로 이동
}
```

### 편집 모드 draggable 컨테이너 속성

```tsx
<div
  draggable
  role="listitem"
  aria-roledescription={t('dashboard.a11y.sortableItem')}
  aria-label={t('dashboard.a11y.widgetPosition', { name: widgetId, pos: index + 1, total: totalCount })}
  tabIndex={0}
  onKeyDown={handleKeyDown}
  // ... existing drag handlers
>
```

### 키보드 핸들러

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    onMoveUp();
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    onMoveDown();
  }
};
```

### 버튼 aria-label 추가

```tsx
// 리사이즈 버튼: title → aria-label
<button aria-label={width === 'full' ? t('dashboard.a11y.halfWidth') : t('dashboard.a11y.fullWidth')}>

// 숨기기 버튼: title → aria-label
<button aria-label={t('dashboard.a11y.hideWidget')}>

// 보이기 버튼 (hidden state)
<button aria-label={t('dashboard.a11y.showWidget')}>
```

### GripVertical 아이콘

```tsx
<GripVertical size={14} className="..." aria-hidden="true" />
```

### Hidden (collapsed) 상태도 동일 적용

```tsx
<div
  draggable
  role="listitem"
  aria-roledescription={t('dashboard.a11y.sortableItem')}
  aria-label={t('dashboard.a11y.widgetHidden', { name: widgetId, pos: index + 1, total: totalCount })}
  tabIndex={0}
  onKeyDown={handleKeyDown}
>
```

---

## A11Y-2: Dashboard 키보드 리오더링

### 위젯 그리드 컨테이너

```tsx
<div
  className="grid grid-cols-1 md:grid-cols-2 gap-6"
  role={editMode ? 'list' : undefined}
  aria-label={editMode ? t('dashboard.a11y.widgetList') : undefined}
>
```

### 키보드 이동 핸들러

```typescript
const handleMoveUp = useCallback((index: number) => () => {
  if (index > 0) {
    reorder(index, index - 1);
    setAnnouncement(t('dashboard.a11y.movedTo', { pos: index }));
    // Focus the moved widget after reorder
    setTimeout(() => {
      const widgets = document.querySelectorAll('[role="listitem"]');
      (widgets[index - 1] as HTMLElement)?.focus();
    }, 50);
  }
}, [reorder, t]);

const handleMoveDown = useCallback((index: number) => () => {
  if (index < layout.length - 1) {
    reorder(index, index + 1);
    setAnnouncement(t('dashboard.a11y.movedTo', { pos: index + 2 }));
    setTimeout(() => {
      const widgets = document.querySelectorAll('[role="listitem"]');
      (widgets[index + 1] as HTMLElement)?.focus();
    }, 50);
  }
}, [reorder, layout.length, t]);
```

### aria-live 영역

```tsx
{/* Screen reader announcement */}
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>
```

### DashboardWidget에 새 props 전달

```tsx
<DashboardWidget
  // ... existing props
  index={index}
  totalCount={layout.length}
  onMoveUp={handleMoveUp(index)}
  onMoveDown={handleMoveDown(index)}
>
```

---

## A11Y-3: i18n 키

### ko.json (common namespace)

```json
{
  "dashboard": {
    "a11y": {
      "sortableItem": "정렬 가능한 항목",
      "widgetPosition": "{{name}} 위젯, {{total}}개 중 {{pos}}번째",
      "widgetHidden": "{{name}} 위젯 (숨김), {{total}}개 중 {{pos}}번째",
      "widgetList": "대시보드 위젯 목록",
      "movedTo": "{{pos}}번째 위치로 이동됨",
      "halfWidth": "반쪽 너비로 변경",
      "fullWidth": "전체 너비로 변경",
      "hideWidget": "위젯 숨기기",
      "showWidget": "위젯 표시"
    }
  }
}
```

### en.json (common namespace)

```json
{
  "dashboard": {
    "a11y": {
      "sortableItem": "sortable item",
      "widgetPosition": "{{name}} widget, {{pos}} of {{total}}",
      "widgetHidden": "{{name}} widget (hidden), {{pos}} of {{total}}",
      "widgetList": "Dashboard widget list",
      "movedTo": "Moved to position {{pos}}",
      "halfWidth": "Change to half width",
      "fullWidth": "Change to full width",
      "hideWidget": "Hide widget",
      "showWidget": "Show widget"
    }
  }
}
```

---

## 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `components/DashboardWidget.tsx` | MODIFY | ARIA 속성 + keyboard handler + props 추가 |
| `pages/Dashboard.tsx` | MODIFY | role="list" + 키보드 이동 + aria-live |
| `locales/ko/common.json` | MODIFY | a11y 키 9개 추가 |
| `locales/en/common.json` | MODIFY | a11y 키 9개 추가 |

## 성공 기준

- [ ] Tab으로 편집 모드 위젯 간 이동 가능
- [ ] Arrow Up/Down으로 위젯 순서 변경
- [ ] 이동 후 스크린 리더가 위치 안내
- [ ] 기존 마우스 DnD 동작 유지
- [ ] i18n ko/en 모두 지원
