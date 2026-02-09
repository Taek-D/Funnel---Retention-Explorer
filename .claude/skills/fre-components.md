---
name: fre-components
description: UI 컴포넌트, 페이지, 스타일링 패턴. Use when building UI, modifying pages, or working with components and styling.
---

# FRE UI Components

## 디자인 시스템

### 테마 색상 (index.html tailwind.config)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `background` | `#0c0f14` | 페이지 배경 |
| `surface` | `#14181f` | 카드/패널 배경 |
| `elevated` | `#1a1f28` | 떠있는 요소 |
| `accent` | `#00d4aa` | 주요 액션, 강조 |
| `coral` | `#ff6b6b` | 위험/경고 |
| `amber` | `#fbbf24` | 주의 |

### 폰트
- 본문: DM Sans
- 모노: JetBrains Mono (`font-mono`)

### 공통 스타일 패턴

```
카드: bg-surface border border-white/[0.06] rounded-lg p-6
버튼: px-6 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium
라벨: text-slate-400 text-xs uppercase font-bold tracking-wider
제목: text-white text-xl font-bold
```

## 컴포넌트 구조

### Layout
- `AppShell.tsx` — Sidebar + Header + Outlet (라우트 렌더링)
- `Sidebar.tsx` — 네비게이션 (useNavigate/useLocation)
- `ProtectedRoute.tsx` — 인증 체크 (게스트 모드 허용)

### 공유 컴포넌트
- `Modal.tsx` — 모달 다이얼로그
- `Toast.tsx` — 토스트 알림 (ToastProvider + useToast)
- `Icons.tsx` — Lucide React 아이콘 re-export
- `UserMenu.tsx` — 사용자 메뉴 드롭다운
- `AskAIPanel.tsx` — AI 질의 사이드 패널
- `SaveAnalysisButton.tsx` — Supabase 저장 버튼
- `SearchModal.tsx` — 글로벌 검색
- `NotificationPanel.tsx` — 알림 패널

### 페이지
- `Dashboard.tsx` — KPI 카드 + 차트 요약
- `DataImport.tsx` — CSV 업로드 + 컬럼 매핑 (3-step)
- `FunnelAnalysis.tsx` — 퍼널 분석 + Recharts 차트
- `RetentionAnalysis.tsx` — 코호트 리텐션 히트맵
- `SegmentComparison.tsx` — A/B 세그먼트 비교
- `Insights.tsx` — 자동 인사이트 + AI 분석
- `LandingPage.tsx` — 마케팅 랜딩 (공개)

## 새 컴포넌트 추가 규칙

1. 아이콘: `components/Icons.tsx`에서 re-export
2. 상태: `useAppContext()` → `state.xxx` / `dispatch()`
3. 네비게이션: `useNavigate()` / `useLocation()`
4. 반응형: `grid-cols-1 lg:grid-cols-12` 패턴
5. 애니메이션: `animate-fade-up`, `animate-slide-down` (index.html에 정의)
