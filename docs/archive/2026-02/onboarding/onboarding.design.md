# Onboarding & First Experience — Design

> **Feature**: Phase 3 Onboarding
> **Plan**: `docs/01-plan/features/onboarding.plan.md`
> **Status**: Design
> **Created**: 2026-02-10

---

## 1. OB-1: 샘플 데이터 모듈

### 1.1 파일: `lib/sampleData.ts` (신규)

#### 1.1.1 Export 인터페이스

```typescript
type SampleDataType = 'ecommerce' | 'saas';

interface SampleDataResult {
  data: RawRow[];        // Record<string, string>[]
  headers: string[];
  mapping: ColumnMapping;
  fileName: string;      // 화면 표시용 가상 파일명
}

function generateSampleData(type: SampleDataType): SampleDataResult;
```

#### 1.1.2 이커머스 샘플 스키마

| 컬럼 | 헤더명 | 생성 규칙 |
|------|--------|----------|
| timestamp | `timestamp` | 최근 90일, 랜덤 분포 |
| user_id | `user_id` | `user_001` ~ `user_300` |
| event_name | `event_name` | 아래 전환율 표 참조 |
| session_id | `session_id` | `sess_XXXXX` (사용자당 1~5개 세션) |
| platform | `platform` | `web`(60%), `mobile`(30%), `ios`(10%) |
| channel | `channel` | `organic`(40%), `paid`(35%), `referral`(25%) |

**이벤트 전환 퍼널**:

| 이벤트 | 누적 전환율 | 사용자 수 (~300명 기준) |
|--------|:----------:|:---------------------:|
| page_view | 100% | 300 |
| product_view | 65% | ~195 |
| add_to_cart | 30% | ~90 |
| checkout_start | 15% | ~45 |
| purchase | 5% | ~15 |

- 각 사용자는 세션 내에서 순차적으로 이벤트를 발생 (page_view → product_view → ...)
- 이탈 확률은 각 단계에서 독립 적용
- 타임스탬프는 세션 내 이벤트 간 1~30분 간격

#### 1.1.3 SaaS 샘플 스키마

| 컬럼 | 헤더명 | 생성 규칙 |
|------|--------|----------|
| timestamp | `timestamp` | 최근 90일, 랜덤 분포 |
| user_id | `user_id` | `user_001` ~ `user_200` |
| event_name | `event_name` | 아래 전환율 표 참조 |
| session_id | `session_id` | `sess_XXXXX` |
| platform | `platform` | `web`(70%), `mobile`(20%), `desktop`(10%) |
| channel | `channel` | `organic`(45%), `paid`(30%), `referral`(25%) |

**이벤트 전환 퍼널**:

| 이벤트 | 누적 전환율 | 사용자 수 (~200명 기준) |
|--------|:----------:|:---------------------:|
| signup | 100% | 200 |
| onboarding_complete | 60% | ~120 |
| feature_use | 40% | ~80 |
| subscription_start | 15% | ~30 |
| subscription_cancel | 5% | ~10 |

- subscription_cancel은 subscription_start 이후 7~60일 뒤 발생
- feature_use는 사용자당 1~10회 반복 가능 (리텐션 데이터 생성용)

#### 1.1.4 날짜 생성 전략

```typescript
function generateBaseDate(): Date {
  // 오늘 기준 90일 전 ~ 오늘 사이의 랜덤 날짜
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return new Date(ninetyDaysAgo.getTime() + Math.random() * (now.getTime() - ninetyDaysAgo.getTime()));
}
```

- 시드 없는 `Math.random()` 사용 (매번 다른 데이터, 체험 느낌)
- 모든 타임스탬프는 ISO 8601 문자열로 출력 (기존 csvParser 호환)

#### 1.1.5 출력 매핑

```typescript
const mapping: ColumnMapping = {
  timestamp: 'timestamp',
  userid: 'user_id',
  eventname: 'event_name',
  sessionid: 'session_id',
  platform: 'platform',
  channel: 'channel',
};
```

100% 자동 매핑 — 사용자 개입 불필요.

#### 1.1.6 예상 행 수

| 타입 | 사용자 | 이벤트/사용자 평균 | 총 행 |
|------|:------:|:-----------------:|:-----:|
| ecommerce | 300 | ~6 | ~1,800 |
| saas | 200 | ~8 | ~1,600 |

---

## 2. OB-2: DataImport 샘플 데이터 섹션

### 2.1 파일: `hooks/useCSVUpload.ts` (수정)

#### 2.1.1 새 함수: `loadSampleData`

```typescript
const loadSampleData = useCallback(async (type: SampleDataType) => {
  dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 10, message: '샘플 데이터 생성 중...' } });

  // Dynamic import로 번들 분리
  const { generateSampleData } = await import('../lib/sampleData');
  const sample = generateSampleData(type);

  dispatch({
    type: 'SET_RAW_DATA',
    payload: { rawData: sample.data, headers: sample.headers, fileName: sample.fileName }
  });
  dispatch({ type: 'SET_COLUMN_MAPPING', payload: sample.mapping });
  dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 50, message: '컬럼 자동 매핑 완료' } });

  // 자동으로 confirmMapping까지 실행 (원클릭 체험)
  // confirmMapping 내부 로직을 인라인 호출
  // ...processData, detectDatasetType, generateInsights 등...

  dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 100, message: '완료!' } });
  toast('success', '샘플 데이터 로드 완료', `${typeName} 샘플 데이터가 로드되었습니다.`);
}, [dispatch, toast, state.rawData, state.headers]);
```

**핵심**: `loadSampleData`는 파일 업로드 + 매핑 확인을 한 번에 수행한다. 사용자는 클릭 1번으로 Dashboard까지 도달해야 한다.

#### 2.1.2 반환값 수정

```typescript
return {
  handleFileUpload,
  confirmMapping,
  loadSampleData,    // 추가
  isProcessing: state.isProcessing,
  processingProgress: state.processingProgress,
  processingMessage: state.processingMessage,
  planGate,
};
```

### 2.2 파일: `pages/DataImport.tsx` (수정)

#### 2.2.1 샘플 데이터 섹션 위치

파일 업로드 영역(`bg-surface` 카드) 바로 아래, 컬럼 매핑 위에 삽입:

```
[파일 업로드 영역] ← 기존
[샘플 데이터 섹션] ← 신규 (Step 1에서만 표시)
[컬럼 매핑]        ← 기존 (hasData일 때)
```

#### 2.2.2 샘플 데이터 카드 UI

```
+---[샘플 데이터로 체험하기]---+
|                              |
| +--이커머스--+ +--SaaS----+ |
| | ShoppingBag| | Briefcase| |
| | 이커머스    | | SaaS     | |
| | ~1,800행   | | ~1,600행  | |
| | 300명 사용자| | 200명 사용자| |
| +------------+ +-----------+ |
|                              |
+------------------------------+
```

- `currentStep === 1` (파일 미업로드)일 때만 표시
- 클릭 시 `loadSampleData('ecommerce')` 또는 `loadSampleData('saas')` 호출
- 로드 완료 후 자동으로 Step 3 (처리 완료) 상태로 전환

#### 2.2.3 아이콘

`components/Icons.tsx`에 추가:
- `ShoppingBag` (이커머스용)
- `Briefcase` (SaaS용)

둘 다 lucide-react에 존재.

---

## 3. OB-3: Dashboard 빈 상태 CTA

### 3.1 파일: `pages/Dashboard.tsx` (수정)

#### 3.1.1 빈 상태 판별

```typescript
const hasData = processedData.length > 0;
```

`hasData === false`일 때 전체 Dashboard를 **EmptyState CTA**로 교체.

#### 3.1.2 EmptyState CTA 레이아웃

기존 KPI + 차트 + 인사이트 영역 전체를 하나의 CTA 블록으로 대체:

```
+-----------------------------------------------+
|  [Activity 아이콘 + 그라데이션 배경]            |
|                                                |
|  CSV 데이터를 분석해보세요                      |
|  퍼널, 리텐션, 세그먼트, AI 인사이트까지       |
|                                                |
|  [샘플 데이터로 체험] (primary)                 |
|  [CSV 파일 업로드]    (secondary)               |
|                                                |
|  가이드 보기 →                                 |
+-----------------------------------------------+
|                                                |
| [기능 카드 3개 - 퍼널/리텐션/AI 미리보기]      |
+-----------------------------------------------+
```

#### 3.1.3 CTA 버튼 동작

| 버튼 | 동작 |
|------|------|
| 샘플 데이터로 체험 | `navigate('/app/upload?sample=ecommerce')` |
| CSV 파일 업로드 | `navigate('/app/upload')` |
| 가이드 보기 | `startTour()` (온보딩 투어 시작) |

#### 3.1.4 DataImport query param 처리

`pages/DataImport.tsx`에서 `useSearchParams`로 `?sample=ecommerce` 또는 `?sample=saas` 감지:

```typescript
const [searchParams] = useSearchParams();
const sampleType = searchParams.get('sample') as SampleDataType | null;

useEffect(() => {
  if (sampleType && !hasData) {
    loadSampleData(sampleType);
  }
}, [sampleType]);
```

#### 3.1.5 기능 미리보기 카드 (3개)

데이터 없는 상태에서도 제품의 가치를 전달:

| 카드 | 아이콘 | 설명 |
|------|--------|------|
| 퍼널 분석 | Filter | 다단계 전환 퍼널로 이탈 지점 발견 |
| 리텐션 코호트 | Users | 코호트별 사용자 리텐션 시각화 |
| AI 인사이트 | Zap | Gemini AI 기반 실행 가능한 인사이트 |

---

## 4. OB-4: 인터랙티브 온보딩 가이드

### 4.1 파일: `hooks/useOnboardingTour.ts` (신규)

#### 4.1.1 인터페이스

```typescript
interface TourStep {
  target: string;          // CSS selector 또는 data-tour 속성
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourState {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  isCompleted: boolean;
}
```

#### 4.1.2 투어 스텝 정의

```typescript
const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="upload"]',
    title: '데이터 업로드',
    description: 'CSV 파일을 업로드하거나 샘플 데이터를 로드하세요. 이커머스와 SaaS 샘플이 준비되어 있습니다.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="analysis"]',
    title: '분석 시작',
    description: '퍼널 분석, 리텐션 코호트, 세그먼트 비교 — 사이드바에서 원하는 분석을 선택하세요.',
    placement: 'right',
  },
  {
    target: '[data-tour="insights"]',
    title: 'AI 인사이트',
    description: 'Gemini AI가 데이터를 분석하여 실행 가능한 인사이트를 자동 생성합니다.',
    placement: 'right',
  },
];
```

#### 4.1.3 localStorage 키

- `fre_onboarding_completed`: `'true'` | 존재하지 않음
- 완료/건너뛰기 시 `'true'` 저장
- 첫 방문 시 자동 실행 조건: 키가 존재하지 않음

#### 4.1.4 자동 실행 로직

```typescript
useEffect(() => {
  if (!isCompleted && !hasData) {
    // 500ms 딜레이 후 투어 시작 (페이지 로드 후 자연스러운 시작)
    const timer = setTimeout(() => startTour(), 500);
    return () => clearTimeout(timer);
  }
}, []);
```

- `hasData === true`면 자동 실행하지 않음 (이미 데이터가 있는 재방문자)
- 수동 실행은 항상 가능 (`startTour()`)

### 4.2 파일: `components/OnboardingTour.tsx` (신규)

#### 4.2.1 구조

```tsx
<OnboardingTour>
  {isActive && (
    <>
      {/* 1. 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" />

      {/* 2. 타겟 하이라이트 (cutout) */}
      <div className="fixed z-[9999]" style={targetRect에 맞춘 위치}>
        {/* 타겟 주위 밝은 테두리 */}
      </div>

      {/* 3. 툴팁 */}
      <div className="fixed z-[10000]" style={placement에 따른 위치}>
        <div className="bg-surface border border-accent/30 rounded-lg p-4 shadow-2xl max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-accent font-mono text-xs">{currentStep + 1}/{steps.length}</span>
            <h4 className="text-white font-bold text-sm">{step.title}</h4>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">{step.description}</p>
          <div className="flex justify-between items-center">
            <button onClick={skipTour} className="text-slate-500 text-xs hover:text-white">
              건너뛰기
            </button>
            <button onClick={nextStep} className="px-4 py-1.5 bg-accent text-background text-xs font-semibold rounded">
              {isLastStep ? '완료' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </>
  )}
</OnboardingTour>
```

#### 4.2.2 타겟 위치 계산

```typescript
function getTargetRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}
```

- `ResizeObserver` / `scroll` 이벤트로 위치 업데이트
- 타겟 요소가 없으면 해당 스텝 건너뛰기

#### 4.2.3 하이라이트 구현

CSS `box-shadow` 방식 (clip-path보다 간단):

```css
.tour-highlight {
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(0, 212, 170, 0.5);
  border-radius: 8px;
  pointer-events: none;
}
```

### 4.3 data-tour 속성 추가 위치

| 속성 | 파일 | 요소 |
|------|------|------|
| `data-tour="upload"` | `pages/DataImport.tsx` | 파일 업로드 드롭존 |
| `data-tour="analysis"` | `components/Sidebar.tsx` | 퍼널/리텐션/세그먼트 메뉴 그룹 |
| `data-tour="insights"` | `components/Sidebar.tsx` | AI 인사이트 메뉴 항목 |

---

## 5. OB-5: Sidebar 시작 가이드

### 5.1 파일: `components/Sidebar.tsx` (수정)

#### 5.1.1 시작 가이드 버튼

`PlanBadge` 위(또는 아래), 로그아웃 버튼 근처에 배치:

```tsx
{!hasData && (
  <button
    onClick={startTour}
    className="w-10 h-10 flex items-center justify-center rounded-md text-accent/60 hover:text-accent hover:bg-accent/10 transition-colors"
    title="시작 가이드"
    data-tour="guide-button"
  >
    <HelpCircle size={18} />
  </button>
)}
```

#### 5.1.2 Sidebar Props 확장

```typescript
interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  hasData?: boolean;       // 추가
  onStartTour?: () => void; // 추가
}
```

- `hasData`와 `onStartTour`는 AppShell에서 주입

### 5.2 파일: `components/AppShell.tsx` (수정)

#### 5.2.1 OnboardingTour 통합

```tsx
import { OnboardingTour } from './OnboardingTour';
import { useOnboardingTour } from '../hooks/useOnboardingTour';
import { useAppContext } from '../context/AppContext';

export const AppShell: React.FC = () => {
  const { state } = useAppContext();
  const hasData = state.processedData.length > 0;
  const tour = useOnboardingTour(hasData);

  return (
    <div className="flex ...">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        hasData={hasData}
        onStartTour={tour.startTour}
      />
      {/* ... 기존 코드 ... */}
      <OnboardingTour {...tour} />
    </div>
  );
};
```

#### 5.2.2 Icons.tsx 추가

```typescript
export { HelpCircle } from 'lucide-react';
export { ShoppingBag } from 'lucide-react';
export { Briefcase } from 'lucide-react';
```

---

## 6. 구현 순서 및 의존성

```
OB-1: lib/sampleData.ts            (의존 없음)
  ↓
OB-2: useCSVUpload.ts + DataImport  (OB-1 의존)
  ↓
OB-3: Dashboard.tsx                 (OB-2 의존 — query param + navigate)
  ↓
OB-4: OnboardingTour + hook         (의존 없음, 병렬 가능)
  ↓
OB-5: Sidebar + AppShell            (OB-4 의존)
```

## 7. 파일 변경 요약

| # | 파일 | 변경 | 예상 라인 |
|---|------|------|:---------:|
| 1 | `lib/sampleData.ts` | 신규 | ~180 |
| 2 | `hooks/useOnboardingTour.ts` | 신규 | ~60 |
| 3 | `components/OnboardingTour.tsx` | 신규 | ~120 |
| 4 | `hooks/useCSVUpload.ts` | 수정 | +50 |
| 5 | `pages/DataImport.tsx` | 수정 | +60 |
| 6 | `pages/Dashboard.tsx` | 수정 | +80 |
| 7 | `components/Sidebar.tsx` | 수정 | +15 |
| 8 | `components/AppShell.tsx` | 수정 | +10 |
| 9 | `components/Icons.tsx` | 수정 | +3 |
| | **총** | **3 신규 + 6 수정** | **~578** |

## 8. 검증 체크리스트

- [ ] `generateSampleData('ecommerce')` → ~1,800행 반환, headers 6개
- [ ] `generateSampleData('saas')` → ~1,600행 반환, headers 6개
- [ ] DataImport에서 이커머스 카드 클릭 → Step 3 (처리 완료)까지 자동 진행
- [ ] DataImport에서 SaaS 카드 클릭 → Step 3까지 자동 진행
- [ ] Dashboard 빈 상태 → CTA 버튼 2개 + 가이드 링크 표시
- [ ] Dashboard "샘플 데이터로 체험" 클릭 → `/app/upload?sample=ecommerce`
- [ ] 첫 방문 시 온보딩 투어 자동 시작 (500ms 딜레이)
- [ ] 투어 3단계 진행 → 완료 시 localStorage에 저장
- [ ] 투어 "건너뛰기" → localStorage에 저장, 재실행 안 됨
- [ ] Sidebar "시작 가이드" 버튼 → 투어 재시작
- [ ] 데이터 로드 후 "시작 가이드" 버튼 숨김
- [ ] `vite build` 성공
- [ ] `vitest run` 기존 테스트 통과
- [ ] sampleData.ts는 dynamic import로 번들 분리 확인
