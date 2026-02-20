# ML Analysis - 환경 설정 가이드

## 1. Python 환경

Python 3.10 이상을 권장합니다.

```bash
cd ml-analysis
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. 데이터 다운로드

### Telco Customer Churn (Kaggle)

1. https://www.kaggle.com/datasets/blastchar/telco-customer-churn 접속
2. `WA_Fn-UseC_-Telco-Customer-Churn.csv` 다운로드
3. `data/telco_churn.csv`로 저장

| 항목 | 내용 |
|------|------|
| 규모 | 7,043 rows, 21 columns |
| 타겟 | Churn (Yes/No, ~26.5% churn rate) |
| Features | tenure, MonthlyCharges, Contract, InternetService 등 |

### UCI Online Retail II (UCI ML Repository)

1. https://archive.ics.uci.edu/dataset/502/online+retail+ii 접속
2. `online_retail_II.xlsx` 다운로드
3. Sheet "Year 2010-2011" 을 CSV로 변환 후 `data/online_retail.csv`로 저장

또는 Python으로 직접 변환:

```python
import pandas as pd
df = pd.read_excel('online_retail_II.xlsx', sheet_name='Year 2010-2011')
df.to_csv('data/online_retail.csv', index=False)
```

| 항목 | 내용 |
|------|------|
| 규모 | ~541,909 rows (2010-2011), 8 columns |
| Key Fields | InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID, Country |
| 특이사항 | CustomerID 결측 ~25%, 음수 Quantity = 반품 |

## 3. 노트북 실행

```bash
jupyter notebook notebooks/
```

노트북 순서대로 실행하세요:
1. `01_online_retail_eda.ipynb` — 이커머스 데이터 탐색
2. `02_rfm_segmentation.ipynb` — RFM 분석 + K-Means 클러스터링
3. `03_churn_eda.ipynb` — 통신사 이탈 데이터 탐색
4. `04_churn_modeling.ipynb` — 머신러닝 이탈 예측 모델링
5. `05_business_impact.ipynb` — 비즈니스 임팩트 종합

## 4. 차트 생성 (포트폴리오용)

```bash
python generate_charts.py
```

`screenshots/` 폴더에 5개 PNG 파일이 생성됩니다.
