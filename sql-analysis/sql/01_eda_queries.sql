-- ============================================================
-- 01. 탐색적 데이터 분석 (Exploratory Data Analysis)
-- Dataset: bigquery-public-data.google_analytics_sample
-- Period: 2016-08-01 ~ 2017-08-01
-- ============================================================

-- ------------------------------------------------------------
-- Q0. 데이터 품질 점검: 주요 필드 NULL 비율
-- 목적: 분석 전 데이터 무결성을 확인한다.
-- 기대: 핵심 필드(visitor, date, device)는 NULL이 없어야 한다.
-- ------------------------------------------------------------
SELECT
  COUNT(*) AS total_rows,
  COUNTIF(fullVisitorId IS NULL) AS null_visitor_id,
  COUNTIF(date IS NULL) AS null_date,
  COUNTIF(device.deviceCategory IS NULL) AS null_device,
  COUNTIF(channelGrouping IS NULL) AS null_channel,
  COUNTIF(geoNetwork.country IS NULL) AS null_country,
  COUNTIF(totals.pageviews IS NULL) AS null_pageviews,
  COUNTIF(totals.visits IS NULL) AS null_visits
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801';


-- ------------------------------------------------------------
-- Q1. 데이터 개요: 전체 세션 수, 유니크 방문자 수, 날짜 범위
-- 목적: 분석 대상 데이터의 규모와 기간을 파악한다.
-- ------------------------------------------------------------
SELECT
  COUNT(*) AS total_sessions,
  COUNT(DISTINCT fullVisitorId) AS unique_visitors,
  MIN(PARSE_DATE('%Y%m%d', date)) AS first_date,
  MAX(PARSE_DATE('%Y%m%d', date)) AS last_date,
  DATE_DIFF(
    MAX(PARSE_DATE('%Y%m%d', date)),
    MIN(PARSE_DATE('%Y%m%d', date)),
    DAY
  ) AS date_range_days
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801';


-- ------------------------------------------------------------
-- Q2. 일별 세션 추이
-- 목적: 트래픽 트렌드와 계절성, 이상치를 파악한다.
-- ------------------------------------------------------------
SELECT
  PARSE_DATE('%Y%m%d', date) AS session_date,
  COUNT(*) AS sessions,
  COUNT(DISTINCT fullVisitorId) AS visitors
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  session_date
ORDER BY
  session_date;


-- ------------------------------------------------------------
-- Q3. 디바이스 카테고리별 세션 분포
-- 목적: 사용자의 접속 환경을 파악하여 디바이스별 전략을 수립한다.
-- ------------------------------------------------------------
SELECT
  device.deviceCategory AS device,
  COUNT(*) AS sessions,
  COUNT(DISTINCT fullVisitorId) AS visitors,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS session_pct
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  device
ORDER BY
  sessions DESC;


-- ------------------------------------------------------------
-- Q4. 채널별 세션 분포
-- 목적: 어떤 마케팅 채널이 트래픽을 유도하는지 파악한다.
-- ------------------------------------------------------------
SELECT
  channelGrouping AS channel,
  COUNT(*) AS sessions,
  COUNT(DISTINCT fullVisitorId) AS visitors,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS session_pct
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  channel
ORDER BY
  sessions DESC;


-- ------------------------------------------------------------
-- Q5. 국가별 세션 분포 (Top 10)
-- 목적: 주요 시장을 파악한다.
-- ------------------------------------------------------------
SELECT
  geoNetwork.country AS country,
  COUNT(*) AS sessions,
  COUNT(DISTINCT fullVisitorId) AS visitors,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS session_pct
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  country
ORDER BY
  sessions DESC
LIMIT 10;


-- ------------------------------------------------------------
-- Q6. 이커머스 전환율 개요
-- 목적: 전체 방문 대비 구매 전환율을 파악한다.
-- totals.transactions > 0인 세션이 구매 세션.
-- ------------------------------------------------------------
SELECT
  COUNT(*) AS total_sessions,
  COUNTIF(totals.transactions > 0) AS purchase_sessions,
  ROUND(COUNTIF(totals.transactions > 0) * 100.0 / COUNT(*), 4) AS conversion_rate_pct,
  SUM(totals.totalTransactionRevenue) / 1e6 AS total_revenue_usd
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801';


-- ------------------------------------------------------------
-- Q7. 세션당 페이지뷰 수 분포
-- 목적: 사용자 참여도(engagement)를 파악한다.
-- ------------------------------------------------------------
SELECT
  totals.pageviews AS pageviews_per_session,
  COUNT(*) AS session_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS pct
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  pageviews_per_session
ORDER BY
  pageviews_per_session
LIMIT 30;


-- ------------------------------------------------------------
-- Q8. 월별 트래픽 및 매출 추이
-- 목적: 월 단위 성장 트렌드와 매출 변화를 파악한다.
-- ------------------------------------------------------------
SELECT
  FORMAT_DATE('%Y-%m', PARSE_DATE('%Y%m%d', date)) AS month,
  COUNT(*) AS sessions,
  COUNT(DISTINCT fullVisitorId) AS visitors,
  COUNTIF(totals.transactions > 0) AS purchases,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6, 2) AS revenue_usd
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  month
ORDER BY
  month;
