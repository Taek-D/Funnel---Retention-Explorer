# Funnel & Retention Explorer

> **"지표를 '소비'하는 분석가에서 '설계'하는 분석가로 — 퍼널·리텐션·A/B 테스트 계산 로직을 직접 구현한 프로젝트"**

Mixpanel/Amplitude가 내부에서 사용하는 퍼널 순차 매칭, 코호트 캘린더 연산, Z-test 비율 검정 로직을 TypeScript로 직접 구현하며, 프로덕트 지표가 어떻게 만들어지는지 체득한 풀스택 프로젝트입니다. CSV 업로드로 퍼널 전환율, 코호트 리텐션, 세그먼트 비교, DAU/MAU 스티키니스를 확인할 수 있습니다.

**Live Demo**: https://fre-analytics-castletaek9643-9522s-projects.vercel.app

---

## Why — 이 프로젝트를 만든 이유

프로덕트 분석의 핵심 지표들 — 퍼널 전환율, 코호트 리텐션, DAU/MAU 스티키니스 — 은 대부분 Mixpanel이나 Amplitude 같은 도구의 UI에서 숫자로만 접합니다. 하지만 이 숫자들이 **어떤 로직으로 집계되는지** 이해하지 못하면:

- 리텐션 D7이 낮을 때 **코호트 그룹핑 기준이 daily인지 weekly인지**에 따라 해석이 달라진다는 걸 놓칩니다
- A/B 테스트에서 **p-value와 신뢰구간**이 뭔지 모른 채 "유의미하다"고 보고합니다
- 퍼널 드롭오프를 볼 때 **중간 소요 시간(median time)**이 전환율만큼 중요하다는 걸 간과합니다

이 프로젝트는 **분석 지표의 계산 로직 자체를 TypeScript로 구현**함으로써, 지표가 어떤 가정 위에서 작동하는지 체득하고, 지표를 설계하고 검증할 수 있는 역량을 쌓기 위해 만들었습니다.

---

## Analytical Framework — 분석 엔진 설계

### 1. 퍼널 분석 엔진 (`funnelEngine.ts`)

```
view_item → add_to_cart → begin_checkout → purchase
  1,000       620 (62%)      380 (61.3%)    285 (75%)
```

**설계 의사결정:**
- **순차 매칭**: 동일 유저의 이벤트를 시간순 정렬 후 순차적으로 다음 스텝 존재 여부를 판단합니다. 단순 집합 교차(set intersection)가 아니라 **시간 순서를 보장하는 퍼널**입니다.
- **Median Time Between Steps**: 평균이 아닌 중앙값을 사용합니다. 소수의 극단적 지연 사용자가 있을 때 평균은 왜곡되지만, 중앙값은 "전형적인 사용자 경험"을 반영합니다.
- **데이터 유형별 자동 템플릿**: 이벤트 패턴을 감지하여 이커머스(`view → cart → checkout → purchase`), 구독(`signup → trial → subscribe`), 생애주기(`install → activate → retain`) 퍼널을 자동 구성합니다.

### 2. 리텐션 코호트 엔진 (`retentionEngine.ts`)

```
         D0    D1    D3    D7    D14   D30
Week 1  100%  42%   35%   28%   18%   12%
Week 2  100%  45%   38%   30%   20%    -
Week 3  100%  40%   32%   25%    -     -
```

**설계 의사결정:**
- **Cohort Grouping (daily/weekly/monthly)**: `groupDateKey()` 함수가 날짜를 `YYYY-MM-DD`, `YYYY-W##`, `YYYY-MM` 형식으로 변환합니다. Weekly/Monthly 그룹핑은 코호트 크기를 늘려 통계적 신뢰도를 높이는 대신 시간 해상도를 포기하는 트레이드오프입니다.
- **Period Offset 캘린더 연산**: `advancePeriodKey()`가 Weekly면 7일, Monthly면 다음 달 1일로 정확히 이동합니다. "D7"이 daily 기준 7일인지, weekly 기준 1주 뒤인지 혼동하지 않도록 그룹핑에 따라 기간 레이블(D/W/M prefix)을 자동 변환합니다.
- **Activity vs Paid Retention 분리**: 활동 리텐션(아무 이벤트 발생)과 유료 리텐션(구독 유지)은 질문이 다릅니다. "사용자가 돌아왔는가" vs "사용자가 돈을 내고 있는가"를 별도 엔진으로 분리했습니다.

### 3. 세그먼트 비교 엔진 (`segmentEngine.ts`)

```
Segment      Users   Conv.Rate   Uplift    p-value
iOS          1,200   34.2%       +8.5%p    0.003 **
Android        890   28.1%       +2.4%p    0.142
Web            650   22.5%       -3.2%p    0.089
```

**설계 의사결정:**
- **Z-test 기반 통계적 유의성**: 세그먼트 간 전환율 차이가 표본 크기 대비 우연인지 유의미한지를 p-value로 판단합니다. 단순히 "iOS가 높다"가 아니라 "iOS가 통계적으로 유의미하게 높다(p=0.003)"라고 말할 수 있어야 합니다.
- **Uplift = 전체 평균 대비 차이**: 각 세그먼트를 전체 평균과 비교하여 상대적 성과를 %p 단위로 표시합니다.

### 4. A/B 테스트 엔진 (`abTestEngine.ts`)

**설계 의사결정:**
- **이항 검정(Binomial Test)**: 전환율 비교에 Z-test for proportions를 사용합니다. 표본 크기와 전환 수로 검정 통계량을 계산하고, 95% 신뢰구간을 제시합니다.
- **최소 표본 크기 경고**: 표본이 충분하지 않으면 "통계적으로 유의미하지 않음"이 아니라 "판단 불가 (insufficient sample)"로 표시합니다. 이 구분이 실무에서 매우 중요합니다.

### 5. 스티키니스 분석 (`stickinessEngine.ts`)

```
DAU/MAU Ratio: 32% → "Moderately Sticky"
Feature Frequency Distribution: 1day(40%), 2-3days(25%), 4-7days(20%), 8+days(15%)
```

**설계 의사결정:**
- **DAU/MAU 비율**: 일간 활성 사용자를 월간 활성 사용자로 나눈 비율. Facebook은 60%+, 일반 SaaS는 20~30%가 기준입니다. 이 수치 하나로 "제품이 습관이 되었는가"를 판단합니다.
- **빈도 분포 히스토그램**: 단일 비율보다 "몇 일 사용하는 사용자가 얼마나 되는가"의 분포가 더 풍부한 인사이트를 줍니다.

### 6. 사용자 여정 플로우 (`journeyEngine.ts`)

**설계 의사결정:**
- **Sankey 다이어그램**: 이벤트 간 전이 확률을 시각화합니다. 퍼널이 "정해진 경로의 이탈"을 보여준다면, 여정 플로우는 "사용자가 실제로 선택한 경로"를 보여줍니다.
- **Top-K 경로 추출**: 전체 경로 조합이 폭발적으로 늘어나므로, 빈도 상위 K개 경로만 추출하여 노이즈를 줄입니다.

### 7. 자동 인사이트 엔진 (`insightsEngine.ts`)

데이터 업로드 시 13가지 인사이트를 자동 생성합니다:

| 인사이트 | 임계값 | 분석적 의미 |
|---|---|---|
| 최대 이탈 지점 | 가장 큰 드롭오프 | 퍼널에서 가장 먼저 개선해야 할 단계 |
| D1 리텐션 경고 | < 25% | Aha Moment 도달 실패 신호 |
| 리텐션 급락 | 전일 대비 10%p+ 하락 | 특정 시점의 이탈 원인 조사 필요 |
| 플랫폼 성과 격차 | 10%p+ 차이 | 크로스 플랫폼 UX 불일치 |
| 낮은 Trial 전환율 | < 40% | 온보딩 또는 가치 전달 실패 |
| 높은 해지율 | > 10% | 제품-시장 적합성 재검토 |
| 느린 전환 시간 | > 72시간 | 의사결정 마찰 또는 복잡한 결제 경험 |

---

## Analytics Architecture — 데이터 흐름

```
CSV Upload
    │
    ▼
┌─────────────────────────────────────────────────┐
│ dataProcessor.ts                                │
│ ┌───────────┐  ┌──────────────┐  ┌───────────┐ │
│ │ CSV Parse │→ │ Auto-Detect  │→ │ Column    │ │
│ │ (PapaParse)│  │ Dataset Type │  │ Mapping   │ │
│ └───────────┘  └──────────────┘  └───────────┘ │
│  이벤트 파싱     이커머스/구독 판별   timestamp,   │
│                                   user_id,      │
│                                   event_name 매핑│
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Analysis Engines (Pure TypeScript, No React)     │
│                                                  │
│ ┌──────────┐ ┌───────────┐ ┌──────────────────┐│
│ │ Funnel   │ │ Retention │ │ Segment Compare  ││
│ │ Engine   │ │ Engine    │ │ Engine           ││
│ │          │ │           │ │                  ││
│ │ 순차매칭  │ │ 코호트구성 │ │ Z-test 유의성   ││
│ │ 중앙값   │ │ D/W/M 그룹│ │ Uplift 계산     ││
│ │ 드롭오프  │ │ 히트맵    │ │ p-value         ││
│ └──────────┘ └───────────┘ └──────────────────┘│
│                                                  │
│ ┌──────────┐ ┌───────────┐ ┌──────────────────┐│
│ │ A/B Test │ │Stickiness │ │ Journey Flow     ││
│ │ Engine   │ │ Engine    │ │ Engine           ││
│ │          │ │           │ │                  ││
│ │ 이항검정  │ │ DAU/MAU  │ │ Sankey 전이확률  ││
│ │ 신뢰구간  │ │ 빈도분포  │ │ Top-K 경로      ││
│ └──────────┘ └───────────┘ └──────────────────┘│
│                                                  │
│ ┌────────────────┐  ┌────────────────────────┐  │
│ │ Insights Engine│  │ Subscription Engine    │  │
│ │ 13가지 자동 진단│  │ Trial→Paid 전환, 해지율│  │
│ └────────────────┘  └────────────────────────┘  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Visualization & Export                           │
│                                                  │
│ Dashboard  │ Cohort Heatmap │ Funnel Bar Chart  │
│ KPI Cards  │ Retention Curve│ Sankey Diagram    │
│ CSV/Excel  │ AI Summary     │ PNG Report        │
└─────────────────────────────────────────────────┘
```

**핵심 설계 원칙:**
- **엔진 분리**: 모든 분석 엔진은 `lib/` 디렉토리의 순수 TypeScript 모듈입니다. React 의존성이 없어 독립적으로 테스트 가능하며, 다른 프레임워크에서도 재사용할 수 있습니다.
- **WeakMap 기반 캐싱**: 동일 데이터에 대한 반복 계산을 방지합니다. 데이터 참조가 변경될 때만 자동으로 캐시가 무효화됩니다.
- **375개 자동화 테스트**: 362개 단위/통합 테스트(Vitest) + 13개 E2E 테스트(Playwright)로 엔진의 계산 정확성을 검증합니다.

---

## Features — 전체 기능

| 기능 | 분석적 의미 | 구현 |
|---|---|---|
| **퍼널 분석** | 전환 경로에서 이탈이 가장 큰 병목 식별 | 순차 매칭 + median time + 드롭오프 |
| **코호트 리텐션** | 시간 경과에 따른 사용자 잔존율 추적 | D/W/M 그룹핑 + 히트맵 + 평균 커브 |
| **세그먼트 비교** | 플랫폼/채널별 성과 차이의 통계적 유의성 | Z-test + p-value + uplift |
| **A/B 테스트** | 두 퍼널 간 전환율 차이 검증 | 이항 검정 + 95% 신뢰구간 |
| **스티키니스** | 제품이 사용자 습관에 얼마나 정착했는지 | DAU/MAU 비율 + 빈도 분포 |
| **사용자 여정** | 사용자의 실제 이동 경로 패턴 | Sankey 다이어그램 + Top-K 경로 |
| **퍼널 비교** | 기간/세그먼트별 퍼널 성과 변화 추적 | 사이드 바이 사이드 + 차이 하이라이트 |
| **리텐션 비교** | 코호트 간 잔존율 변화 추적 | 이중 코호트 테이블 + 델타 |
| **자동 인사이트** | 데이터에서 즉시 액션 아이템 도출 | 13가지 규칙 기반 진단 |
| **AI 분석** | 자연어로 데이터 질의 및 해석 | Gemini 2.0 Flash 통합 |
| **커스텀 이벤트** | 이벤트 별칭, 그룹, 조건부 이벤트 정의 | 이벤트 매핑 + 조건 빌더 |
| **예약 리포트** | 정기적 분석 결과 자동 전송 | 일간/주간/월간 스케줄링 |
| **팀 협업** | 분석 결과 공유 및 역할 기반 접근 제어 | 팀 초대 + RBAC |
| **데이터 커넥터** | GA4, Mixpanel, DB 연동 자동 동기화 | OAuth + 스케줄 동기화 |
| **웹훅** | 분석 이벤트를 Slack/Discord에 실시간 전송 | 커스텀 엔드포인트 + 재시도 |

---

## Project Scale

| 항목 | 수치 |
|---|---|
| 분석 엔진 | 8개 (퍼널, 리텐션, 세그먼트, A/B, 스티키니스, 여정, 인사이트, 구독) |
| 페이지 | 18개 (대시보드, 분석 6종, 비교 3종, 설정 5종, 랜딩/인증) |
| 자동화 테스트 | 375개 (Vitest 362 + Playwright 13) |
| i18n 번역 키 | 840+ (한국어/영어) |
| 번들 최적화 | 20 chunks, 최대 367KB (React.lazy + code splitting) |
| TypeScript | strict mode, 0 any |
| Edge Functions | 12개 (결제, AI, 커넥터, 웹훅, 리포트) |
| 개발 규모 | 1인 풀스택, PDCA 사이클 기반 개발 |

---

## Tech Stack

| Layer | Technology | 선택 이유 |
|---|---|---|
| Language | TypeScript 5.8 | 분석 엔진의 타입 안전성 (any 금지, strict mode) |
| Framework | React 19 + Vite 6 | SPA 대시보드에 최적화된 빌드 성능 |
| Charts | Recharts 3 | 코호트 히트맵, 퍼널 바차트, 리텐션 커브 |
| CSV Parsing | PapaParse | 브라우저 내 대용량 CSV 스트림 파싱 |
| Auth & DB | Supabase | 인증 + PostgreSQL + Row Level Security |
| AI | Gemini 2.0 Flash | 자연어 데이터 분석 질의응답 |
| i18n | react-i18next | 한국어/영어 840+ 번역 키 |
| Testing | Vitest + Playwright | 362 단위/통합 + 13 E2E |
| Deploy | Vercel | main 브랜치 push 자동 배포 |
| Styling | Tailwind CSS | 다크 테마 SaaS 대시보드 UI |

---

## Getting Started

```bash
git clone https://github.com/Taek-D/Funnel---Retention-Explorer.git
cd "funnel-&-retention-explorer frontend"
npm install
npm run dev    # http://localhost:3000
npm test       # 375 tests
```

환경 변수 없이도 게스트 모드로 CSV 업로드 및 전체 분석 기능을 사용할 수 있습니다.

---

## 이 프로젝트에서 체득한 역량

| 역량 | 구현 | 체득한 것 |
|---|---|---|
| **퍼널 분석 설계** | User-level 순차 퍼널, 중앙값 소요시간, Fuzzy 이벤트 매칭 | 전환 병목 식별, 평균 vs 중앙값 선택의 의미 |
| **코호트 분석 설계** | Activity/Paid 이중 리텐션, D/W/M 캘린더 연산, 히트맵 시각화 | 시간 해상도별 해석 차이, Activity vs Paid 질문의 차이 |
| **통계적 의사결정** | Two-proportion Z-test, Pooled proportion, 95% 신뢰구간, p-value | "유의미하다"의 정확한 의미와 한계 |
| **구독 지표 체계** | ARPPU, Churn Rate, Trial Conversion, Plan Mix, Paid Retention | 구독 KPI 간 상호관계 이해 |
| **인사이트 자동화** | 13가지 규칙 기반 진단 + 임계값 설계 + 액션 아이템 도출 | 패턴 인식의 체계화 |
| **데이터 시각화** | Recharts 인터랙티브 차트, 코호트 히트맵, Sankey 다이어그램 | 지표별 최적 시각화 형태 판단 |
| **데이터 처리** | CSV 파싱, 자동 스키마 감지, 데이터 품질 리포트, WeakMap 캐싱 | 데이터 파이프라인 설계 사고 |
| **엔지니어링** | Auth + RLS + Edge Functions + 375개 테스트 + TypeScript strict | 분석 로직 정확성 보장 |

### 한계 및 개선 방향

- **한계점**: 브라우저 메모리 기반으로 대용량(10만+ 행) 처리에 한계. 실무에서는 SQL/BigQuery 파이프라인이 필수적
- **완료**: [SQL 기반 실데이터 분석 프로젝트](./sql-analysis/) — BigQuery GA4 공개 데이터셋(Google Merchandise Store)으로 퍼널/리텐션/세그먼트 분석을 SQL로 직접 수행. 카이제곱 검정, Z-test, 코호트 히트맵 등 통계 검정 포함.

> FRE가 **"지표 설계 역량"**을 보여준다면, [SQL 분석 프로젝트](./sql-analysis/)는 **"실제 데이터로 인사이트를 도출하는 분석 역량"**을 보여줍니다.

---

## License

This project is available for personal and commercial use.
