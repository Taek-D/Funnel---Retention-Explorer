# SQL 기반 이커머스 분석 프로젝트

BigQuery GA4 공개 데이터셋(Google Merchandise Store)을 활용한 퍼널/리텐션/세그먼트 분석 프로젝트입니다.

## 핵심 발견

> 아래 수치는 노트북 실행 결과에서 도출됩니다. 정확한 값은 각 노트북의 동적 출력을 참조하세요.

1. **최대 이탈 지점**: Product View → Add to Cart 단계에서 가장 큰 전환 손실 발생 → 상품 상세 페이지 CTA 개선이 최우선 과제 (`02_funnel.ipynb`)
2. **모바일 전환율 격차**: Mobile vs Desktop 전환율 차이가 카이제곱 검정에서 통계적으로 유의미 → 모바일 UX 개선 기회 (`02_funnel.ipynb`, `04_segments.ipynb`)
3. **Week 1 리텐션 크리티컬**: 첫 방문 후 1주 이내에 가장 큰 리텐션 하락 발생 → 초기 경험 최적화가 핵심 (`03_retention.ipynb`)
4. **구매 경험 = 리텐션 부스터**: 구매자의 재방문율이 비구매자 대비 유의미하게 높음 → 첫 구매 유도 인센티브의 ROI가 높음 (`03_retention.ipynb`)
5. **매출 집중**: 소수 고가치 구매자에게 매출이 집중 (파레토 패턴) → VIP 리텐션 전략 필요 (`04_segments.ipynb`)

## 데이터셋

| 항목 | 내용 |
|------|------|
| **Source** | Google Merchandise Store (실제 이커머스 트래픽) |
| **Table** | `bigquery-public-data.google_analytics_sample.ga_sessions_*` |
| **Period** | 2016-08-01 ~ 2017-08-01 (약 1년) |
| **Scale** | 수십만 세션 규모 (정확한 수치는 `01_eda.ipynb` 실행 참조) |
| **Schema** | Universal Analytics — hits(REPEATED), totals(STRUCT), device, trafficSource |

## 프로젝트 구조

```
sql-analysis/
├── README.md                    # 이 파일
├── requirements.txt             # Python 의존성
├── setup.md                     # BigQuery 설정 가이드
├── notebooks/
│   ├── 01_eda.ipynb             # 탐색적 데이터 분석
│   ├── 02_funnel.ipynb          # 이커머스 퍼널 분석
│   ├── 03_retention.ipynb       # 주간 코호트 리텐션
│   ├── 04_segments.ipynb        # 세그먼트 비교 분석
│   └── 05_insights.ipynb        # 종합 인사이트 + 액션 아이템
└── sql/
    ├── 01_eda_queries.sql       # EDA 쿼리
    ├── 02_funnel_queries.sql    # 퍼널 분석 쿼리
    ├── 03_retention_queries.sql # 리텐션 분석 쿼리
    ├── 04_segment_queries.sql   # 세그먼트 분석 쿼리
    └── 05_insights_queries.sql  # 인사이트 쿼리
```

## 분석 내용

### 01. 탐색적 데이터 분석 (EDA)
- 데이터 규모 및 기간 파악
- 일별/월별 트래픽 추이 (시계열 분석)
- 디바이스/채널/지역 분포
- 이커머스 전환율 개요
- 세션당 페이지뷰 분포

### 02. 이커머스 퍼널 분석
- 4단계 퍼널: Product View → Cart → Checkout → Purchase
- 단계별 전환율 및 이탈율 측정
- 디바이스별 퍼널 비교
- 요일별 전환율 패턴
- 통계 검정: **카이제곱 검정** (Desktop vs Mobile 전환율)

### 03. 코호트 리텐션 분석
- 주간 코호트 정의 및 리텐션 매트릭스
- 리텐션 히트맵 시각화
- 평균 리텐션 커브 (Week 0~12)
- 구매자 vs 비구매자 리텐션 비교

### 04. 세그먼트 비교 분석
- 신규 vs 재방문 사용자 행동 비교
- 채널별 효율성 비교 (Revenue per Session)
- 디바이스별 핵심 지표 (CVR, AOV, Bounce Rate)
- US vs Non-US 구매 행동 차이
- 통계 검정: **비율 Z-test** + 95% 신뢰구간 + Cohen's h 효과크기
- 고가치 사용자 프로파일링 (파레토 분석)

### 05. 종합 인사이트
- Executive KPI Dashboard
- 모바일 기회 크기 산출 (추가 매출 추정)
- 채널 효율성 매트릭스
- 개선 기회 우선순위 (Impact vs Effort)
- 비즈니스 액션 아이템

## 기술 스택

| 기술 | 용도 |
|------|------|
| **SQL (BigQuery)** | 핵심 데이터 분석 — 모든 지표 계산 |
| **Python** | 시각화 + 통계 검정 |
| **pandas** | 데이터프레임 조작 |
| **matplotlib / seaborn** | 차트 시각화 (10+ 차트) |
| **scipy** | 카이제곱 검정, Z-test, 효과크기 |
| **google-cloud-bigquery** | BigQuery 연결 |

## 실행 방법

```bash
# 1. BigQuery 인증 설정 (setup.md 참조)
export GOOGLE_APPLICATION_CREDENTIALS="path/to/credentials.json"

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 노트북 실행
jupyter notebook notebooks/
```

BigQuery 무료 티어(매월 1TB)로 전체 분석 실행 가능합니다.

## FRE 프로젝트와의 관계

이 SQL 프로젝트는 **"실제 데이터로 인사이트를 도출하는 분석 역량"**을 보여줍니다.

[Funnel & Retention Explorer](../funnel-&-retention-explorer%20frontend/)는 동일한 분석 프레임워크(퍼널, 리텐션, 세그먼트)를 **자동화된 SaaS 대시보드**로 제품화한 프로젝트입니다.

| SQL 분석 프로젝트 | FRE SaaS |
|:-----------------|:---------|
| BigQuery SQL 직접 작성 | CSV 업로드 원클릭 분석 |
| 수동 코호트 리텐션 계산 | 자동 리텐션 히트맵 생성 |
| Python 통계 검정 | 내장 세그먼트 비교 + AI 인사이트 |
| 일회성 Jupyter 분석 | 반복 가능한 대시보드 + 알림 |
