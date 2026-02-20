# ML 기반 고객 분석 프로젝트

이커머스 고객 세그멘테이션(RFM + K-Means)과 통신사 이탈 예측(XGBoost) 프로젝트입니다.

## 핵심 발견

> 아래 수치는 노트북 실행 결과에서 도출됩니다. 정확한 값은 각 노트북의 동적 출력을 참조하세요.

1. **RFM 세그멘테이션**: K-Means(k=4)로 Champions/Loyal/At-Risk/Lost 4개 세그먼트 도출. Champions이 전체 매출의 ~42%를 차지 (`02_rfm_segmentation.ipynb`)
2. **이탈 핵심 요인**: Contract(계약 유형)이 이탈 예측에 가장 강력한 변수. Month-to-month 계약의 이탈률 42.7% vs Two year 2.9% (`03_churn_eda.ipynb`)
3. **ML 모델 성능**: XGBoost(GridSearchCV 튜닝)가 ROC-AUC 0.87로 최고 성능. 이탈자 80%를 사전 감지 (`04_churn_modeling.ipynb`)
4. **비즈니스 임팩트**: 모델 기반 리텐션 캠페인 ROI ~491%. 연간 $219K 순이익 추정 (`05_business_impact.ipynb`)

## 데이터셋

| 항목 | Online Retail (UCI) | Telco Churn (Kaggle) |
|------|---------------------|----------------------|
| **규모** | ~541,909 rows | 7,043 rows |
| **기간** | 2010-2011 | — |
| **용도** | RFM 세그멘테이션 | 이탈 예측 모델링 |
| **Key Features** | Quantity, UnitPrice, CustomerID | Contract, tenure, MonthlyCharges |

## 프로젝트 구조

```
ml-analysis/
├── README.md
├── requirements.txt
├── setup.md                      # 환경 설정 + 데이터 다운로드 가이드
├── generate_charts.py            # 포트폴리오 차트 생성
├── data/                         # (gitignored)
│   ├── online_retail.csv
│   └── telco_churn.csv
├── notebooks/
│   ├── 01_online_retail_eda.ipynb    # 이커머스 데이터 EDA
│   ├── 02_rfm_segmentation.ipynb     # RFM + K-Means 클러스터링
│   ├── 03_churn_eda.ipynb            # 이탈 데이터 EDA
│   ├── 04_churn_modeling.ipynb       # ML 이탈 예측 모델링
│   └── 05_business_impact.ipynb      # 비즈니스 임팩트 종합
└── screenshots/                  # 차트 이미지
```

## 분석 내용

### 01. 이커머스 EDA (UCI Online Retail)
- 데이터 품질 분석 (CustomerID 결측 ~25%, 반품 거래)
- 국가별 매출 분포 (UK ~82% 집중)
- 월별 매출 추이 및 계절성 (11월 피크)
- Top 10 상품 분석
- 통계 검정: **Independent t-test** (UK vs Non-UK AOV), **Chi-square** (반품률 차이)

### 02. RFM 세그멘테이션
- RFM Feature Engineering (Recency, Frequency, Monetary)
- RFM Quintile 스코어링 (1-5)
- K-Means 클러스터링 (Elbow Method + Silhouette Score)
- 4개 세그먼트 프로파일링: Champions, Loyal, At-Risk, Lost
- 통계 검정: **One-Way ANOVA** (클러스터 간 RFM 차이), **Silhouette Score** (클러스터 품질)

### 03. 이탈 EDA (Telco Customer Churn)
- 이탈률 26.5%, 21개 Feature 분석
- 범주형 변수별 이탈률 (Contract, InternetService, PaymentMethod)
- 수치형 변수 분포 (tenure, MonthlyCharges, TotalCharges)
- 통계 검정: **Chi-square + Cramer's V** (Contract vs Churn), **t-test + Cohen's d** (tenure, MonthlyCharges)

### 04. 이탈 예측 모델링
- 전처리: Label Encoding + StandardScaler + SMOTE
- 3개 모델: Logistic Regression, Random Forest, XGBoost
- GridSearchCV 하이퍼파라미터 튜닝 (5-Fold Stratified CV)
- 모델 해석: **SHAP** summary plot + feature importance
- 평가: ROC Curve, PR Curve, Confusion Matrix, Cross-Validation

### 05. 비즈니스 임팩트
- 이탈 비용 추정 (월간/연간 매출 손실)
- 리텐션 캠페인 ROI 시뮬레이션
- 고객 생애가치(CLV) by Contract
- RFM 세그먼트 × 이탈 위험 Action Matrix
- 통합 액션 플랜 (P0~P3 우선순위)

## 기술 스택

| 기술 | 용도 |
|------|------|
| **Python** | 분석 전체 |
| **pandas / numpy** | 데이터 처리 + Feature Engineering |
| **scikit-learn** | ML 모델 (LogReg, RF), 전처리, 평가, GridSearchCV |
| **XGBoost** | Gradient Boosting 모델 |
| **SHAP** | 모델 해석 (Feature Importance) |
| **imbalanced-learn** | SMOTE (클래스 불균형 처리) |
| **matplotlib / seaborn** | 시각화 (15+ 차트) |
| **scipy** | 통계 검정 (t-test, chi-square, ANOVA) |

## 통계 검정 목록 (13가지)

| 검정 | 노트북 | 용도 |
|------|--------|------|
| Independent t-test | 01, 03 | UK vs Non-UK AOV; tenure Churn vs Retained |
| Chi-square | 01, 03 | 반품률 국가 차이; Contract vs Churn |
| Cramer's V | 01, 03 | 범주형 연관성 효과 크기 |
| Cohen's d | 03 | 연속형 Feature 효과 크기 |
| One-Way ANOVA | 02 | 클러스터 간 RFM 차이 |
| Eta-squared | 02 | ANOVA 효과 크기 |
| Silhouette Score | 02 | 클러스터 품질 검증 |
| Elbow Method | 02 | 최적 k 결정 |
| ROC-AUC | 04 | 모델 판별력 |
| PR-AUC | 04 | 불균형 클래스 성능 |
| Cross-Validation | 04 | 모델 안정성 (5-Fold) |
| Confusion Matrix | 04 | 분류 성능 분해 |
| SHAP Values | 04 | Feature Importance 해석 |

## 실행 방법

```bash
# 1. 환경 설정 (setup.md 참조)
cd ml-analysis
pip install -r requirements.txt

# 2. 데이터 다운로드 (setup.md의 다운로드 가이드 참조)

# 3. 노트북 실행
jupyter notebook notebooks/

# 4. 차트 생성 (데이터 없이 실행 가능)
python generate_charts.py
```

## FRE 프로젝트와의 관계

이 ML 분석 프로젝트는 포트폴리오의 세 번째 축입니다:

| 프로젝트 | 역할 | 핵심 역량 |
|----------|------|----------|
| [FRE (SaaS)](../funnel-&-retention-explorer%20frontend/) | 분석 프레임워크 제품화 | TypeScript 엔진 설계, React SaaS, 364개 테스트 |
| [SQL Analysis](../sql-analysis/) | 실데이터 인사이트 도출 | BigQuery SQL, 퍼널/리텐션/세그먼트 |
| **ML Analysis** | 예측 모델링 + 비즈니스 임팩트 | scikit-learn, RFM, 이탈 예측, ROI 계산 |

**"분석 지표를 설계하고(FRE), 실데이터에서 인사이트를 도출하고(SQL), ML로 비즈니스 임팩트를 정량화할 수 있습니다."**
