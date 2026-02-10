# Core Features Enhancement — Plan

> **Feature**: Phase 4 Core Features (MONETIZATION-ROADMAP.md)
> **Goal**: Pro 요금제의 가치를 증명하여 전환율을 높인다
> **Scope**: PDF 리포트, 저장된 분석 불러오기, 공유 URL, Free 워터마크
> **Status**: Plan
> **Created**: 2026-02-10

---

## 1. 배경 및 목적

현재 FRE Analytics의 Pro 요금제는 CSV 행 수 제한 해제(10K→500K)와 AI 호출 횟수(3→50) 차별화만 있다.
Pro 유저에게 **눈에 보이는 가치**를 추가해야 전환율이 올라간다.

Phase 4에서는:
- **PDF 리포트 내보내기** (Pro 전용) — 현재 PNG만 지원
- **저장된 분석 불러오기** — DB 저장은 되지만 불러오기 UI 없음
- **공유 가능한 리포트 URL** (Pro 전용) — 팀 공유 니즈 충족
- **Free 워터마크** — Free/Pro 차별화 시각적 표시

## 2. 현재 상태 분석

### 2-1. 리포트 내보내기 (reportEngine.ts)
- Canvas 기반 PNG 렌더링만 구현 (~393줄)
- 다크 테마, 한글 폰트, 멀티페이지 지원
- iOS/Safari 대응 (새 탭 fallback)
- **PDF 미지원** — jsPDF 등 라이브러리 없음

### 2-2. 분석 저장/불러오기
- `SaveAnalysisButton.tsx` — 저장 UI 동작 중 (Supabase `fre_analysis_snapshots`)
- `supabaseData.ts` — `saveSnapshot()`, `listSnapshots()` 함수 존재
- **Dashboard에서 불러오기 UI 없음** — 저장만 되고 재접속 시 사라짐

### 2-3. 공유 리포트 URL
- 존재하지 않음
- `router.tsx`에 `/shared/:id` 라우트 없음
- `fre_analysis_snapshots` 테이블에 shared/public 플래그 없음

### 2-4. AI 대화 UX
- **이미 완료** — 채팅 UI, 추천 질문 4개, 타이핑 애니메이션, 메시지 히스토리 모두 구현됨
- 추가 작업 불필요

### 2-5. Free/Pro 리포트 구분
- `usePlanGate` 훅 동작 중 (isPro, csvRowLimit, aiCallsRemaining 등)
- 리포트에 워터마크 구분 없음 — Free/Pro 동일한 PNG 출력

## 3. 작업 항목

### CF-1: PDF 리포트 내보내기 (Pro 전용)

**파일**: `lib/reportEngine.ts` (수정), `package.json` (수정)

기존 Canvas 기반 PNG 렌더링을 jsPDF로 PDF 변환:
- `jspdf` npm 패키지 추가 (dynamic import로 번들 분리)
- 기존 `renderReportPages()` Canvas 결과를 jsPDF에 이미지로 삽입
- `exportReportAsPDF(state: AppState): Promise<void>` 함수 추가
- 단일 PDF 파일 다운로드 (`fre-report.pdf`)

**Pro 게이팅**:
- Dashboard에서 내보내기 버튼 클릭 시 `isPro` 체크
- Free: PNG만 가능 (기존 동작)
- Pro: PNG + PDF 선택 가능

### CF-2: 저장된 분석 불러오기

**파일**: `pages/Dashboard.tsx` (수정), `hooks/useSavedAnalyses.ts` (신규), `lib/supabaseData.ts` (수정)

Dashboard에서 이전에 저장한 분석을 불러오는 UI:
- `useSavedAnalyses` 훅: `listSnapshots()` 호출하여 저장된 분석 목록 로드
- Dashboard에 "저장된 분석" 섹션 (데이터 있을 때, 사이드 패널 또는 드롭다운)
- 스냅샷 선택 시 해당 데이터를 AppContext에 복원
- 삭제 기능 (`deleteSnapshot` 함수 추가)

### CF-3: 공유 가능한 리포트 URL (Pro 전용)

**파일**: `pages/SharedReport.tsx` (신규), `router.tsx` (수정), `lib/supabaseData.ts` (수정), `components/ShareButton.tsx` (신규)

공유 URL로 비로그인 유저도 리포트 열람 가능:
- `fre_analysis_snapshots`에 `share_token TEXT`, `is_shared BOOLEAN DEFAULT false` 컬럼 추가 (Supabase Migration)
- `ShareButton` 컴포넌트: 클릭 시 share_token 생성(UUID) + is_shared=true 업데이트
- `/shared/:token` 라우트 추가 (public, 인증 불필요)
- `SharedReport.tsx`: token으로 스냅샷 조회 → 읽기 전용 리포트 렌더링
- RLS 정책: `is_shared = true AND share_token = :token`이면 공개 읽기 허용

**Pro 게이팅**:
- 공유 버튼은 Pro 유저에게만 표시
- Free 유저 클릭 시 업그레이드 모달

### CF-4: Free 워터마크 추가

**파일**: `lib/reportEngine.ts` (수정)

Free 유저의 리포트(PNG/PDF)에 워터마크 삽입:
- 각 페이지 우측 하단에 "FRE Analytics — Free Plan" 반투명 텍스트
- `renderReportPages(snapshot, isPro)` 매개변수 추가
- Pro 유저: 워터마크 없는 깔끔한 리포트
- 기존 푸터 텍스트와 겹치지 않도록 위치 조정

## 4. 파일 변경 목록

| 파일 | 변경 | 설명 |
|------|------|------|
| `lib/reportEngine.ts` | 수정 | PDF 내보내기 + 워터마크 |
| `pages/Dashboard.tsx` | 수정 | 저장된 분석 불러오기 UI + 내보내기 포맷 선택 |
| `hooks/useSavedAnalyses.ts` | 신규 | 저장된 분석 CRUD 훅 |
| `pages/SharedReport.tsx` | 신규 | 공유 리포트 읽기 전용 페이지 |
| `components/ShareButton.tsx` | 신규 | 공유 링크 생성 버튼 |
| `lib/supabaseData.ts` | 수정 | deleteSnapshot, shareSnapshot, getSharedSnapshot 추가 |
| `router.tsx` | 수정 | `/shared/:token` 라우트 추가 |
| `package.json` | 수정 | jspdf 의존성 추가 |

**총 8파일** (3 신규, 5 수정)

## 5. 완료 기준

- [ ] CF-1: Pro 유저가 PDF 리포트 다운로드 가능 (단일 파일, 멀티페이지)
- [ ] CF-1: Free 유저는 PDF 버튼 클릭 시 업그레이드 모달 표시
- [ ] CF-2: Dashboard에서 저장된 분석 목록 표시 + 클릭 시 복원
- [ ] CF-2: 저장된 분석 삭제 가능
- [ ] CF-3: Pro 유저가 공유 URL 생성 → 비로그인 유저가 열람 가능
- [ ] CF-3: Free 유저는 공유 버튼 클릭 시 업그레이드 모달
- [ ] CF-4: Free 유저 리포트에 워터마크 표시, Pro 유저는 없음
- [ ] 빌드 성공 (vite build, 에러 없음)
- [ ] 기존 테스트 통과 (vitest run)
- [ ] jspdf는 dynamic import로 번들 분리

## 6. 제외 사항

- 4-4 (AI 대화 UX 개선) — 이미 완료됨 (채팅 UI + 추천 질문 + 타이핑 애니메이션)
- 리포트 디자인 리뉴얼 — 현재 Canvas 렌더링으로 충분
- 실시간 공동 편집 — 과잉, Phase 5 이후 검토
- 리포트 예약 자동 생성 — 별도 Phase에서 진행

## 7. 기술 결정

- **jsPDF**: Canvas→PDF 변환에 가장 가벼운 선택지 (~290KB gzipped)
  - Canvas `toDataURL('image/jpeg')` → `jsPDF.addImage()` 방식으로 기존 렌더링 재활용
  - dynamic import로 main bundle 영향 0
- **share_token**: UUID v4 — URL-safe, 추측 불가
  - 별도 인증 불필요, token 기반 접근
- **Supabase Migration**: `ALTER TABLE fre_analysis_snapshots ADD COLUMN share_token TEXT, ADD COLUMN is_shared BOOLEAN DEFAULT false`
- **워터마크**: Canvas API `ctx.globalAlpha` + 회전 텍스트 (외부 이미지 불필요)

## 8. 실행 순서

```
CF-4 (워터마크) → CF-1 (PDF 내보내기) → CF-2 (저장된 분석) → CF-3 (공유 URL)
```

- CF-4를 먼저 (reportEngine 기반 수정, CF-1과 함께 적용)
- CF-1이 reportEngine 수정 완료 후 CF-2/CF-3 병렬 가능
- CF-3은 Supabase Migration 필요 (DB 변경 포함)

## 9. Supabase Migration 필요

```sql
-- CF-3: 공유 기능용 컬럼 추가
ALTER TABLE fre_analysis_snapshots
  ADD COLUMN share_token TEXT UNIQUE,
  ADD COLUMN is_shared BOOLEAN DEFAULT false;

-- 공유된 스냅샷에 대한 공개 읽기 정책
CREATE POLICY "shared_snapshot_public_read" ON fre_analysis_snapshots
  FOR SELECT USING (is_shared = true);

-- share_token 인덱스 (조회 성능)
CREATE INDEX idx_snapshots_share_token ON fre_analysis_snapshots(share_token)
  WHERE share_token IS NOT NULL;
```
