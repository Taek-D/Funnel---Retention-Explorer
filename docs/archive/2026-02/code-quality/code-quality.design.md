# Code Quality Design Document

> **Summary**: Convention compliance, DRY principle, test coverage improvement
>
> **Project**: Funnel & Retention Explorer
> **Version**: 1.0.0
> **Date**: 2026-02-09
> **Status**: Draft
> **Planning Doc**: [code-quality.plan.md](../../01-plan/features/code-quality.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- Tailwind CSS 컨벤션 준수 (인라인 스타일 최소화)
- 매직 넘버 제거로 유지보수성 향상
- 중복 코드 DRY 원칙 적용
- 핵심 비즈니스 로직 단위 테스트 커버리지 확대
- 사용자 대면 에러 메시지 한국어 통일

### 1.2 Design Principles

- **Minimal impact**: 기존 동작 변경 없이 내부 품질만 개선
- **Convention-first**: CLAUDE.md에 명시된 코딩 컨벤션 준수
- **Test-driven verification**: 리팩토링 후 테스트로 동작 보장

---

## 2. Task Specifications

### D1. 인라인 스타일 → Tailwind 전환 (Q1)

#### D1.1 AskAIPanel.tsx:120-122 — Animation Delay

**현재 코드:**
```tsx
<div className="... animate-bounce" style={{ animationDelay: '0ms' }} />
<div className="... animate-bounce" style={{ animationDelay: '150ms' }} />
<div className="... animate-bounce" style={{ animationDelay: '300ms' }} />
```

**전환 방법:** `index.html`의 `<style>` 블록에 CSS 클래스 추가

```css
.animation-delay-0 { animation-delay: 0ms; }
.animation-delay-150 { animation-delay: 150ms; }
.animation-delay-300 { animation-delay: 300ms; }
```

**변경 후:**
```tsx
<div className="... animate-bounce animation-delay-0" />
<div className="... animate-bounce animation-delay-150" />
<div className="... animate-bounce animation-delay-300" />
```

#### D1.2 LandingHeader.tsx:59-62 — Mobile Menu Toggle

**현재 코드:**
```tsx
<div
  className="md:hidden overflow-hidden transition-all duration-250"
  style={{ maxHeight: mobileOpen ? '280px' : '0px', opacity: mobileOpen ? 1 : 0 }}
>
```

**전환 방법:** Tailwind 조건부 클래스

```tsx
<div className={`md:hidden overflow-hidden transition-all duration-250 ${
  mobileOpen ? 'max-h-[280px] opacity-100' : 'max-h-0 opacity-0'
}`}>
```

#### D1.3 DataImport.tsx:118 — Progress Bar Width

**현재 코드:**
```tsx
<div className="h-full bg-accent rounded-full transition-all duration-300"
     style={{ width: `${processingProgress}%` }} />
```

**전환 방법:** CSS 변수 + Tailwind arbitrary value는 동적 % 값에 적합하지 않음. 대안으로 인라인 style의 width만 유지하되, 이를 정당화하는 주석 추가하지 않고 그대로 유지.

**결론:** 동적 퍼센트 값이므로 **인라인 유지** (Tailwind arbitrary value는 빌드 타임 값만 지원). 계획서의 CSS 변수 방안도 결국 인라인 style 필요.

#### D1.4 LandingPage.tsx:257-260 — FAQ Accordion

**현재 코드:**
```tsx
<div className="overflow-hidden transition-all duration-300"
     style={{ maxHeight: openFaq === i ? '200px' : '0px', opacity: openFaq === i ? 1 : 0 }}>
```

**전환 방법:** Tailwind 조건부 클래스

```tsx
<div className={`overflow-hidden transition-all duration-300 ${
  openFaq === i ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
}`}>
```

#### D1.5 RetentionAnalysis.tsx:192-195 — Heatmap Cell

**현재 코드:**
```tsx
style={{
  backgroundColor: `rgba(0, 212, 170, ${opacity})`,
  color: rate > 50 ? 'white' : 'rgba(255,255,255,0.7)'
}}
```

**결론:** **인라인 유지** — 셀별 동적 RGB opacity 값은 Tailwind로 표현 불가

#### D1.6 SegmentComparison.tsx:117 — Bar Width

**현재 코드:**
```tsx
<div className={`h-full rounded-full ${isTop ? 'bg-accent' : 'bg-slate-600'}`}
     style={{ width: `${barWidth}%` }} />
```

**결론:** DataImport.tsx와 동일 사유. 동적 퍼센트 값이므로 **인라인 유지**.

#### D1 Summary

| File | Lines | 전환 가능 | 방법 |
|------|-------|:---------:|------|
| AskAIPanel.tsx | 120-122 | Yes | CSS 클래스 (`index.html <style>`) |
| LandingHeader.tsx | 59-62 | Yes | Tailwind 조건부 클래스 |
| DataImport.tsx | 118 | No | 동적 % — 인라인 유지 |
| LandingPage.tsx | 257-260 | Yes | Tailwind 조건부 클래스 |
| RetentionAnalysis.tsx | 192-195 | No | 동적 RGB — 인라인 유지 |
| SegmentComparison.tsx | 117 | No | 동적 % — 인라인 유지 |

**전환 가능: 3곳 / 인라인 유지 정당화: 3곳** (계획서의 7곳 전환에서 재분석 후 3곳으로 축소)

---

### D2. 매직 넘버 상수화 (Q2)

#### D2.1 추가할 상수 (`lib/constants.ts`)

```typescript
// === Analysis Constants ===

/** 활동 리텐션 분석 최대 일수 */
export const ACTIVITY_RETENTION_MAX_DAYS = 14;

/** 유료 리텐션 측정 기준 일수 */
export const PAID_RETENTION_DAYS = [0, 7, 14, 30, 60, 90] as const;

/** 유료 리텐션 코호트 최대 표시 수 */
export const PAID_RETENTION_MAX_COHORTS = 10;

/** 전체 데이터 리텐션 코호트 최대 표시 수 */
export const FULL_DATA_RETENTION_MAX_COHORTS = 7;

/** 인사이트 엔진 리텐션 분석 최대 일수 */
export const INSIGHTS_RETENTION_MAX_DAYS = 14;

/** 최근 파일 목록 최대 수 */
export const RECENT_FILES_MAX_COUNT = 5;
```

#### D2.2 적용 파일별 변경 사항

| File | Current | Constant | Lines |
|------|---------|----------|-------|
| `retentionEngine.ts:40,179` | `<= 14` | `ACTIVITY_RETENTION_MAX_DAYS` | 40, 179 |
| `retentionEngine.ts:101` | `[0,7,14,30,60,90]` | `PAID_RETENTION_DAYS` | 101 |
| `retentionEngine.ts:105` | `.slice(0, 10)` | `PAID_RETENTION_MAX_COHORTS` | 105 |
| `retentionEngine.ts:174` | `.slice(0, 7)` | `FULL_DATA_RETENTION_MAX_COHORTS` | 174 |
| `insightsEngine.ts:113,119` | `<= 14` | `INSIGHTS_RETENTION_MAX_DAYS` | 113, 119 |
| `recentFiles.ts:4` | `5` | `RECENT_FILES_MAX_COUNT` | 4 |

---

### D3. 중복 코드 추출 (Q3)

#### D3.1 새 파일: `lib/eventUtils.ts`

```typescript
import type { ProcessedEvent } from '../types';

/** 정확 매칭: 이벤트명으로 고유 사용자 Set 반환 */
export function getUsersByEvent(data: ProcessedEvent[], eventName: string): Set<string> {
  return new Set(
    data.filter(e => e.eventName === eventName).map(e => e.userId)
  );
}

/** Fuzzy 매칭: 이벤트명 포함 매칭으로 고유 사용자 Set 반환 */
export function getUsersByEventFuzzy(data: ProcessedEvent[], eventName: string): Set<string> {
  const lower = eventName.toLowerCase();
  return new Set(
    data.filter(e => e.eventName && e.eventName.toLowerCase().includes(lower))
      .map(e => e.userId)
  );
}
```

#### D3.2 적용 위치

| File | Lines | Current Pattern | Replacement |
|------|-------|----------------|-------------|
| `funnelEngine.ts:16-18` | 첫 번째 스텝 사용자 | `new Set(processedData.filter(e => e.eventName === step).map(e => e.userId))` | `getUsersByEvent(processedData, step)` |
| `segmentEngine.ts:101-103` | 스텝별 사용자 (else) | `new Set(segmentData.filter(e => e.eventName === stepName).map(e => e.userId))` | `getUsersByEvent(segmentData, stepName)` |
| `segmentEngine.ts:162-165` | fuzzy 첫 스텝 | `new Set(data.filter(e => e.eventName && e.eventName.toLowerCase().includes(...)).map(e => e.userId))` | `getUsersByEventFuzzy(data, steps[0])` |
| `segmentEngine.ts:167-170` | fuzzy 마지막 스텝 | 동일 패턴 | `getUsersByEventFuzzy(data, steps[steps.length - 1])` |
| `funnelEngine.ts:122-125` | fullData 첫 스텝 | `new Set(stepEvents.map(e => e.userId))` — 이미 다른 필터 적용 | 변환 불가 (fuzzy + 별도 필터 조건) |

**참고**: `funnelEngine.ts:31-35`의 두 번째 이후 스텝은 `prevUsers.has(e.userId)` 조건이 추가되어 단순 추출 불가. 단순 패턴만 추출 대상.

---

### D4. 단위 테스트 추가 (Q4)

#### D4.1 새 테스트 파일 목록

| # | File | Test Target | Key Test Cases |
|---|------|-------------|----------------|
| 1 | `__tests__/unit/columnValueDetector.test.ts` | `detectColumnsByValues()` | 타임스탬프 감지, userId 감지, 이벤트 감지, 이미 매핑된 컬럼 무시, 빈 데이터 |
| 2 | `__tests__/unit/csvParser.test.ts` | `parseCSVText()` 검증 | 행수 초과 에러, 정상 파싱, 빈 입력 |
| 3 | `__tests__/unit/funnelEngine.test.ts` | `calculateFunnel()`, `calculateMedianTimeBetweenSteps` | 기본 퍼널, 2스텝 미만 빈 배열, medianTime 계산, 빈 userSet |
| 4 | `__tests__/unit/retentionEngine.test.ts` | `calculateActivityRetention()`, `calculatePaidRetention()` | 코호트 그룹핑, 일별 리텐션율, 빈 데이터, 취소 사용자 처리 |
| 5 | `__tests__/unit/sanitize.test.ts` | `sanitizeEventName()` | XSS 문자 제거 (`<`, `>`, `"`, `'`, `&`), 정상 문자 유지, 빈 문자열 |

#### D4.2 테스트 구조

```
__tests__/
├── unit/
│   ├── formatters.test.ts          (기존)
│   ├── dataProcessor.test.ts       (기존)
│   ├── columnValueDetector.test.ts  (신규)
│   ├── csvParser.test.ts            (신규)
│   ├── funnelEngine.test.ts         (신규)
│   ├── retentionEngine.test.ts      (신규)
│   └── sanitize.test.ts             (신규)
└── integration/
    ├── csv-to-processed.test.ts    (기존)
    ├── funnel-pipeline.test.ts     (기존)
    ├── retention-pipeline.test.ts  (기존)
    ├── segment-pipeline.test.ts    (기존)
    ├── subscription-pipeline.test.ts (기존)
    ├── insights-pipeline.test.ts   (기존)
    └── full-pipeline.test.ts       (기존)
```

**총 파일 수**: 9 (기존) → 14 (목표)

#### D4.3 주요 테스트 케이스 상세

**columnValueDetector.test.ts:**
```
- ISO 8601 날짜 컬럼 정확 감지
- "user_001" 형식의 userId 컬럼 감지
- 이벤트명 패턴 ("view_item" 등) 감지
- 이미 이름 매칭된 컬럼은 덮어쓰지 않음
- 빈 rawData → 기존 mapping 반환
```

**funnelEngine.test.ts:**
```
- 3-step 퍼널: 정확한 conversionRate, dropOff 계산
- 1-step 미만: 빈 배열 반환
- medianTime: 올바른 중간값 (홀수/짝수 배열)
- 빈 userSet에서 medianTime = 0
```

**retentionEngine.test.ts:**
```
- 코호트 날짜별 사용자 그룹핑
- D0 = 100% 보장
- D1 리텐션율 정확 계산
- 빈 데이터 → 빈 배열
- 취소 사용자: 취소일 이후 retained 미포함
```

---

### D5. 에러 메시지 한국어 표준화 (Q5)

#### D5.1 변경 대상

| File | Line | Current | Target | 변경 여부 |
|------|------|---------|--------|:---------:|
| `supabaseData.ts:33` | createProject | `'Not authenticated'` | `'인증되지 않았습니다'` | Yes |
| `index.tsx:12` | root mount | `'Could not find root element to mount to'` | 유지 (개발자 전용) | No |
| `AuthContext.tsx:43` | Supabase error | `error.message` | 유지 (외부 소스) | No |

**변경 건수**: 1건

---

## 3. Implementation Order

```
D2 (상수화) → D3 (중복 코드 추출) → D1 (인라인 스타일) → D5 (에러 메시지) → D4 (테스트)
```

| Phase | Task | Files Modified | Files Created |
|-------|------|:--------------:|:-------------:|
| 1 | D2: 매직 넘버 상수화 | 3 (`constants.ts`, `retentionEngine.ts`, `insightsEngine.ts`, `recentFiles.ts`) | 0 |
| 2 | D3: 중복 코드 추출 | 2 (`funnelEngine.ts`, `segmentEngine.ts`) | 1 (`eventUtils.ts`) |
| 3 | D1: 인라인 스타일 전환 | 3 (`AskAIPanel.tsx`, `LandingHeader.tsx`, `LandingPage.tsx`) + `index.html` | 0 |
| 4 | D5: 에러 메시지 | 1 (`supabaseData.ts`) | 0 |
| 5 | D4: 단위 테스트 | 0 | 5 (테스트 파일) |

---

## 4. Success Criteria

| Metric | Before | Target |
|--------|--------|--------|
| 인라인 스타일 | 6곳 | 3곳 (동적 값만) |
| 매직 넘버 | 6 locations | 0 (상수화) |
| 코드 중복 | 4 similar patterns | 공통 함수 추출 |
| 테스트 파일 수 | 9 | 14 |
| 영어 에러 메시지 (user-facing) | 1 | 0 |
| 빌드 상태 | Passing | Passing |
| 전체 테스트 | Passing | Passing |

---

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tailwind arbitrary values 렌더링 차이 | UI 깨짐 | 전환 후 시각적 확인 |
| eventUtils 추출 시 동작 변경 | 퍼널/세그먼트 계산 오류 | 기존 integration test로 검증 |
| 상수 이름 변경으로 import 누락 | 빌드 실패 | `vite build`로 즉시 확인 |

---

*Created: 2026-02-09*
*PDCA Phase: Design*
*Feature: code-quality*
