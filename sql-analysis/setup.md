# BigQuery 설정 가이드

## 1. Google Cloud 프로젝트 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성 (또는 기존 프로젝트 사용)
2. BigQuery API 활성화: API & Services → Library → "BigQuery API" 검색 → Enable

## 2. 인증 설정

### 방법 A: 서비스 계정 (권장)

```bash
# 1. 서비스 계정 생성 (IAM & Admin → Service Accounts)
# 2. 키 파일 다운로드 (JSON)
# 3. 환경 변수 설정
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
```

### 방법 B: gcloud CLI

```bash
# gcloud 설치 후
gcloud auth application-default login
```

## 3. 데이터셋 정보

- **프로젝트**: `bigquery-public-data`
- **데이터셋**: `google_analytics_sample`
- **테이블**: `ga_sessions_*` (날짜 파티션)
- **기간**: 2016-08-01 ~ 2017-08-01
- **무료 티어**: 매월 1TB 쿼리 무료 (이 프로젝트 전체 ~10GB 이내)

## 4. 실행

```bash
# 의존성 설치
pip install -r requirements.txt

# Jupyter 실행
jupyter notebook notebooks/
```

## 5. 비용 참고

BigQuery 공개 데이터셋 쿼리는 **무료 티어 내**에서 충분히 실행 가능합니다.
- 무료 한도: 매월 1TB 처리
- 이 프로젝트 전체 쿼리: 약 5-10GB 예상
