# PDCA Plan: Phase 2 — Code Quality

> Previous: Phase 1 (Stability & Security) — Archived at `docs/archive/2026-02/stability-security/`

---

## 1. Overview

| Item | Detail |
|------|--------|
| **Feature** | code-quality |
| **Phase** | 2 of 3 |
| **Goal** | Convention compliance, DRY, test coverage |
| **Current Score** | 95/100 (post Phase 1) |
| **Target Score** | 98/100 |

---

## 2. Scope

Phase 1에서 해결된 Critical/Security 이슈를 제외하고 남은 Warning + Info 레벨 이슈를 해결합니다.

### 2.1 In Scope (5 tasks)

| # | Issue | Source | Priority | Effort |
|---|-------|--------|----------|--------|
| Q1 | 인라인 스타일 → Tailwind 전환 (8곳) | W1 | Medium | 2h |
| Q2 | 비즈니스 로직 매직 넘버 상수화 | I2 | Low | 1h |
| Q3 | Segment/Funnel 엔진 중복 코드 추출 | W8 | Medium | 1h |
| Q4 | 핵심 비즈니스 로직 단위 테스트 추가 | I1 | High | 3h |
| Q5 | 에러 메시지 한국어 표준화 | I5 | Low | 0.5h |

### 2.2 Out of Scope (Phase 3)

- useCSVUpload 함수 리팩토링 (I3)
- AI 쿼리 타임아웃/재시도 (I4)
- React 19 신규 기능 활용 (I6)
- 번들 크기 최적화 (코드 스플리팅)

---

## 3. Task Details

### Q1. 인라인 스타일 → Tailwind 전환

**현재 인라인 스타일 8곳:**

| File | Line | 용도 | 전환 방법 |
|------|------|------|----------|
| `AskAIPanel.tsx:120-122` | animation delay (0/150/300ms) | CSS 클래스를 index.html `<style>`에 추가 |
| `LandingHeader.tsx:59` | maxHeight + opacity (모바일 메뉴) | Tailwind `max-h-0`/`max-h-[280px]` + `opacity-0`/`opacity-100` |
| `DataImport.tsx:118` | progress bar width | Tailwind arbitrary `w-[var(--progress)]` |
| `LandingPage.tsx:257` | maxHeight + opacity (FAQ 아코디언) | Tailwind `max-h-0`/`max-h-[200px]` + `opacity-0`/`opacity-100` |
| `RetentionAnalysis.tsx:192` | 동적 backgroundColor + color (히트맵) | **유지** — 히트맵 셀별 동적 opacity 값은 Tailwind로 표현 불가 |
| `SegmentComparison.tsx:117` | bar width | Tailwind arbitrary `w-[var(--bar-width)]` |

**결론**: 8곳 중 7곳 전환 가능, 1곳(RetentionAnalysis 히트맵)은 동적 RGB 값으로 인라인 유지 정당화.

### Q2. 매직 넘버 상수화

**현재 하드코딩된 숫자들:**

| Location | Value | 의미 |
|----------|-------|------|
| `retentionEngine.ts:40,179` | `14` | 활동 리텐션 최대 일수 |
| `retentionEngine.ts:100` | `[0,7,14,30,60,90]` | 유료 리텐션 측정 일수 |
| `retentionEngine.ts:106,163` | `10`, `7` | 코호트 표시 최대 개수 |
| `insightsEngine.ts:113,119` | `14` | 리텐션 인사이트 분석 일수 |
| `recentFiles.ts:4` | `5` | 최근 파일 최대 개수 |
| `csvParser.ts:4-5` | `50*1024*1024`, `100_000` | 이미 상수화됨 ✅ |

**계획**: `lib/constants.ts`에 분석 관련 상수 추가.

### Q3. 중복 코드 추출

**segmentEngine.ts와 funnelEngine.ts 유사 패턴:**

```typescript
// 패턴: 이벤트명으로 사용자 필터링
data.filter(e => e.eventName === stepName).map(e => e.userId)
```

**계획**: `lib/eventUtils.ts`에 공통 함수 추출:
- `getUsersByEvent(data, eventName)` — 정확 매칭
- `getUsersByEventFuzzy(data, eventName)` — fuzzy 매칭

### Q4. 단위 테스트 추가

**현재 테스트 현황:**
- Unit: `formatters.test.ts`, `dataProcessor.test.ts` (2개)
- Integration: 7개 (csv, funnel, retention, segment, subscription, insights, full pipeline)
- **총 9개 파일**

**추가 필요 모듈 (핵심 알고리즘):**

| Module | 테스트 대상 | 우선순위 |
|--------|-----------|----------|
| `columnValueDetector.ts` | 점수 알고리즘, 패턴 매칭, 에지케이스 | High |
| `csvParser.ts` | 파일 크기/행수 검증 (Phase 1 추가분) | High |
| `funnelEngine.ts` | median time 계산, null checks | Medium |
| `retentionEngine.ts` | Map 인덱싱, 코호트 계산 | Medium |
| `sanitizeEventName` | XSS 문자 제거 | Medium |

**목표**: 9 → 14개 파일 (unit 5개 추가)

### Q5. 에러 메시지 한국어 표준화

**현재 영어로만 된 메시지:**

| Location | Current | Target |
|----------|---------|--------|
| `index.tsx:12` | `"Could not find root element to mount to"` | 개발자용 메시지 — **유지** |
| `supabaseData.ts:4` | `"Not authenticated"` | `"인증되지 않았습니다"` |
| `AuthContext.tsx:43` | error.message (Supabase 영어) | Supabase 에러는 외부 소스 — **유지** |

**결론**: supabaseData.ts의 1건만 변경, 나머지는 개발자/외부 메시지로 유지 정당화.

---

## 4. Implementation Order

```
Q2 (상수) → Q3 (중복 코드 추출) → Q1 (인라인 스타일) → Q5 (에러 메시지) → Q4 (테스트)
```

- Q2, Q3 먼저: lib/ 모듈 리팩토링 (다른 작업의 기반)
- Q1: UI 레이어 수정
- Q5: 단순 문자열 변경
- Q4: 마지막에 테스트 추가 (변경된 코드에 대한 테스트)

---

## 5. Success Criteria

| Metric | Before | Target |
|--------|--------|--------|
| 인라인 스타일 | 8곳 | 1곳 (히트맵만) |
| 매직 넘버 | 6+ locations | 0 (상수화) |
| 코드 중복 | 3+ similar patterns | 공통 함수 추출 |
| 테스트 파일 수 | 9 | 14+ |
| 영어 에러 메시지 | 2 user-facing | 0 user-facing |
| 빌드 상태 | Passing | Passing |

---

## 6. PDCA Cycle

```
[Plan] ✅ (this document)
  ↓
[Design] ⏳ — /pdca design code-quality
  ↓
[Do] ⏳ — Implementation
  ↓
[Check] ⏳ — /pdca analyze code-quality
  ↓
[Report] ⏳ — /pdca report code-quality
```

---

*Created: 2026-02-09*
*PDCA Phase: Plan*
*Feature: code-quality*
