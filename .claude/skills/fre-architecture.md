---
name: fre-architecture
description: FRE 전체 아키텍처 및 프로젝트 구조. Use when adding new features, creating new files, or understanding the overall system.
---

# FRE Architecture

## 앱 구조

```
index.tsx → Providers 계층 → RouterProvider → Pages
```

### Provider 순서 (변경 금지)
```
AuthProvider > AppProvider > ToastProvider > NotificationProvider > RouterProvider
```

### 라우팅
- 공개: `/` (Landing), `/login`, `/signup`
- 보호: `/app/*` → ProtectedRoute → AppShell → 하위 페이지

## 데이터 흐름

```
CSV 업로드 → csvParser.ts (papaparse)
  → dataProcessor.ts (autoDetectColumns: 이름매칭 + 값분석)
  → useCSVUpload Hook (dispatch → AppContext)
  → Pages에서 분석 (funnelEngine, retentionEngine, segmentEngine)
```

## 모듈 의존 방향

```
pages/ → hooks/ → lib/ (순수 TS)
pages/ → components/
pages/ → context/ (useAppContext, useAuth)
hooks/ → context/
hooks/ → lib/
lib/ 간 의존: constants ← dataProcessor ← columnValueDetector
```

## 상태 추가 패턴

1. `types/index.ts` — 타입 추가
2. `context/reducer.ts` — 초기값 + case 추가
3. `context/actions.ts` — action type 추가 (필요 시)
4. `hooks/` — 로직 Hook 추가/수정
5. `pages/` — UI 연결

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `types/index.ts` | 전체 타입 정의 (Single Source) |
| `context/AppContext.tsx` | useReducer 기반 전역 상태 |
| `context/AuthContext.tsx` | Supabase Auth 상태 |
| `router.tsx` | 라우트 정의 |
| `index.html` | Tailwind 설정 + 테마 색상 |
