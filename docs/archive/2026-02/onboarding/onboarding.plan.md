# Onboarding & First Experience — Plan

> **Feature**: Phase 3 Onboarding (MONETIZATION-ROADMAP.md)
> **Goal**: 첫 방문자가 30초 안에 가치를 느끼게 만든다
> **Scope**: 샘플 데이터 원클릭 로드, 빈 상태 개선, 인터랙티브 온보딩 가이드
> **Status**: Plan
> **Created**: 2026-02-10

---

## 1. 배경 및 목적

현재 FRE Analytics는 CSV 업로드 없이는 어떤 분석도 체험할 수 없다. 첫 방문자가 앱에 진입하면:
- Dashboard: "데이터를 업로드하여 시작하세요." 한 줄 텍스트만 표시
- DataImport: 빈 업로드 영역 + 빈 최근 파일 목록
- 퍼널/리텐션/세그먼트: 모두 빈 상태

이로 인해 첫 방문 → 이탈이 빠르게 발생한다. Phase 3에서는 **샘플 데이터**와 **가이드**를 통해 첫 경험을 극적으로 개선한다.

## 2. 현재 상태 분석

### 2-1. Landing Page
- 가짜 수치 이미 제거됨 (Phase 1 PDCA에서 완료) — "얼리 액세스" 포지셔닝
- "가입 없이 체험하기" CTA → `/app/dashboard`로 이동
- **추가 작업 불필요** (3-4 항목 이미 완료)

### 2-2. Dashboard (빈 상태)
- KPI 카드: 값이 0/N/A로 표시 — 의미 없는 숫자
- 퍼널 차트: "데이터를 업로드하여 시작하세요." (line 128)
- 인사이트: "아직 인사이트가 없습니다." (line 142)
- 리텐션: "데이터를 업로드하여 시작하세요." (line 199)
- **CTA 버튼 없음** — 다음 행동 유도가 전혀 없다

### 2-3. DataImport
- 3단계 워크플로우 (업로드 → 매핑 → 완료)는 잘 동작
- 샘플 데이터 로드 기능 없음
- 파일 업로드만 유일한 진입점

### 2-4. 온보딩 가이드
- 존재하지 않음
- 첫 방문자를 위한 투어/가이드 컴포넌트 없음

## 3. 작업 항목

### OB-1: 샘플 데이터 모듈 생성

**파일**: `lib/sampleData.ts` (신규)

이커머스 + SaaS 샘플 데이터 2종을 in-memory로 생성한다.

| 샘플 | 이벤트 수 | 사용자 수 | 이벤트 유형 |
|------|----------|----------|------------|
| 이커머스 | ~2,000행 | ~300명 | page_view, product_view, add_to_cart, checkout_start, purchase |
| SaaS | ~2,000행 | ~200명 | signup, onboarding_complete, feature_use, subscription_start, subscription_cancel |

- 날짜 범위: 최근 90일 (동적 생성)
- 현실적인 전환율 분포: page_view(100%) → purchase(3~5%)
- 각 사용자에 platform(web/mobile/ios), channel(organic/paid/referral) 속성 포함
- 출력 형식: `Record<string, string>[]` (기존 csvParser 출력과 동일)
- **의존성 없음** (외부 라이브러리 불필요, 순수 TypeScript)

### OB-2: DataImport 샘플 데이터 버튼

**파일**: `pages/DataImport.tsx` (수정), `hooks/useCSVUpload.ts` (수정)

- 파일 업로드 영역 아래에 "샘플 데이터로 체험하기" 섹션 추가
- 이커머스 / SaaS 2개 카드, 클릭 시 즉시 데이터 로드
- `useCSVUpload`에 `loadSampleData(type: 'ecommerce' | 'saas')` 함수 추가
- 내부적으로 sampleData → headers/rawData/mapping → 기존 처리 파이프라인 재사용

### OB-3: Dashboard 빈 상태 CTA 개선

**파일**: `pages/Dashboard.tsx` (수정)

현재 빈 상태를 풍부한 CTA 섹션으로 교체:

```
+-----------------------------------------------+
|                                                |
|  CSV 데이터를 분석해보세요                      |
|                                                |
|  [샘플 데이터로 체험]    [CSV 업로드]           |
|                                                |
|  또는 2분 가이드 보기 →                         |
|                                                |
+-----------------------------------------------+
```

- "샘플 데이터로 체험" 클릭 → `/app/upload`로 이동 + 샘플 데이터 자동 로드 (query param)
- "CSV 업로드" 클릭 → `/app/upload`로 이동
- "2분 가이드 보기" 클릭 → 온보딩 투어 시작
- KPI 카드, 차트 영역의 빈 상태 텍스트도 각각 CTA 포함하도록 개선

### OB-4: 인터랙티브 온보딩 가이드

**파일**: `components/OnboardingTour.tsx` (신규), `hooks/useOnboardingTour.ts` (신규)

외부 라이브러리 없이 직접 구현 (~150줄):

**3단계 투어**:
1. "여기서 CSV를 업로드하거나 샘플 데이터를 로드하세요" → DataImport 영역 하이라이트
2. "컬럼이 자동 매핑됩니다. 필요시 수동 조정 가능" → 컬럼 매핑 영역
3. "퍼널, 리텐션, AI 인사이트를 확인하세요" → 사이드바 메뉴 하이라이트

**구현**:
- `useOnboardingTour` hook: step 관리, localStorage에 완료 여부 저장
- `OnboardingTour` component: tooltip + overlay (position: fixed, z-index 높게)
- 첫 방문 시 자동 실행 (localStorage `fre_onboarding_completed` 체크)
- "건너뛰기" / "다음" 버튼
- AppShell에서 조건부 렌더링

### OB-5: Sidebar 온보딩 진행 표시

**파일**: `components/Sidebar.tsx` (수정)

- 데이터가 없을 때 사이드바 하단에 "시작 가이드" 버튼 표시
- 클릭 시 온보딩 투어 재시작
- 데이터 로드 후 자동 숨김

## 4. 파일 변경 목록

| 파일 | 변경 | 설명 |
|------|------|------|
| `lib/sampleData.ts` | 신규 | 이커머스 + SaaS 샘플 데이터 생성기 |
| `hooks/useOnboardingTour.ts` | 신규 | 온보딩 투어 상태 관리 훅 |
| `components/OnboardingTour.tsx` | 신규 | 투어 UI (tooltip + overlay) |
| `pages/DataImport.tsx` | 수정 | 샘플 데이터 로드 섹션 추가 |
| `pages/Dashboard.tsx` | 수정 | 빈 상태 CTA 개선 |
| `hooks/useCSVUpload.ts` | 수정 | loadSampleData 함수 추가 |
| `components/Sidebar.tsx` | 수정 | 시작 가이드 버튼 |
| `components/AppShell.tsx` | 수정 | OnboardingTour 렌더링 |

**총 8파일** (3 신규, 5 수정)

## 5. 완료 기준

- [ ] OB-1: `lib/sampleData.ts` — 이커머스/SaaS 샘플 2종 생성, 각 ~2,000행
- [ ] OB-2: DataImport에서 샘플 데이터 클릭 1번으로 로드 → 자동 매핑 → 처리 완료
- [ ] OB-3: 빈 Dashboard에 CTA 버튼 2개(샘플/업로드) + 가이드 링크 표시
- [ ] OB-4: 첫 방문 시 3단계 온보딩 투어 자동 실행
- [ ] OB-5: Sidebar에 "시작 가이드" 버튼 (데이터 없을 때)
- [ ] 빌드 성공 (vite build, 에러 없음)
- [ ] 기존 테스트 통과 (vitest run)

## 6. 제외 사항

- 3-4 (랜딩 페이지 가짜 수치 제거) — Phase 1에서 이미 완료
- 모바일 반응형 최적화 — 별도 Phase에서 진행
- A/B 테스트 — Phase 5 (운영 인프라) 이후

## 7. 기술 결정

- **외부 라이브러리 없음**: 온보딩 투어를 직접 구현 (tooltip + overlay, ~150줄)
  - intro.js, react-joyride 등은 번들 크기 증가 대비 가치 부족
- **샘플 데이터 in-memory 생성**: 별도 JSON/CSV 파일 불필요
  - 동적 날짜 생성으로 항상 최근 데이터처럼 보임
- **localStorage 기반 상태**: 온보딩 완료 여부를 localStorage에 저장
  - DB 저장은 과잉 — 로컬 상태로 충분

## 8. 실행 순서

```
OB-1 (sampleData.ts) → OB-2 (DataImport 수정) → OB-3 (Dashboard CTA) → OB-4 (OnboardingTour) → OB-5 (Sidebar)
```

OB-1이 기반 모듈이므로 먼저 구현, 이후 UI 순서대로 진행.
