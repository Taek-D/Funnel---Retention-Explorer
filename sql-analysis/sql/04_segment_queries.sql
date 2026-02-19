-- ============================================================
-- 04. 세그먼트 비교 분석 (Segment Comparison Analysis)
-- Dataset: bigquery-public-data.google_analytics_sample
-- Period: 2016-08-01 ~ 2017-08-01
-- ============================================================

-- ------------------------------------------------------------
-- Q1. 신규 vs 재방문 사용자 비교
-- visitNumber = 1: 신규, visitNumber > 1: 재방문
-- 목적: 신규 사용자와 재방문 사용자의 행동 차이를 정량화한다.
-- ------------------------------------------------------------
SELECT
  IF(visitNumber = 1, 'new', 'returning') AS visitor_type,
  COUNT(*) AS sessions,
  COUNT(DISTINCT fullVisitorId) AS visitors,
  ROUND(AVG(totals.pageviews), 2) AS avg_pageviews,
  ROUND(AVG(totals.timeOnSite), 1) AS avg_time_on_site_sec,
  ROUND(COUNTIF(totals.bounces = 1) * 100.0 / COUNT(*), 2) AS bounce_rate_pct,
  COUNTIF(totals.transactions > 0) AS purchase_sessions,
  ROUND(COUNTIF(totals.transactions > 0) * 100.0 / COUNT(*), 4) AS conversion_rate_pct,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6, 2) AS revenue_usd,
  ROUND(
    SUM(totals.totalTransactionRevenue) / NULLIF(COUNTIF(totals.transactions > 0), 0) / 1e6, 2
  ) AS aov_usd
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  visitor_type
ORDER BY
  visitor_type;


-- ------------------------------------------------------------
-- Q2. 채널별 성과 비교 (ROAS 지표)
-- 목적: 마케팅 채널별 효율성을 비교한다.
-- Note: GA 공개 데이터에는 광고비가 없으므로 매출/세션 지표를 사용한다.
-- ------------------------------------------------------------
SELECT
  channelGrouping AS channel,
  COUNT(*) AS sessions,
  COUNT(DISTINCT fullVisitorId) AS visitors,
  ROUND(AVG(totals.pageviews), 2) AS avg_pageviews,
  ROUND(COUNTIF(totals.bounces = 1) * 100.0 / COUNT(*), 2) AS bounce_rate_pct,
  COUNTIF(totals.transactions > 0) AS purchase_sessions,
  ROUND(COUNTIF(totals.transactions > 0) * 100.0 / COUNT(*), 4) AS conversion_rate_pct,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6, 2) AS revenue_usd,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6 / COUNT(*), 4) AS revenue_per_session_usd
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  channel
ORDER BY
  revenue_usd DESC;


-- ------------------------------------------------------------
-- Q3. 디바이스별 핵심 지표 비교
-- 목적: Desktop/Mobile/Tablet 간 세션 품질과 매출 차이를 파악한다.
-- ------------------------------------------------------------
SELECT
  device.deviceCategory AS device,
  COUNT(*) AS sessions,
  ROUND(AVG(totals.pageviews), 2) AS avg_pageviews,
  ROUND(AVG(totals.timeOnSite), 1) AS avg_time_on_site_sec,
  ROUND(COUNTIF(totals.bounces = 1) * 100.0 / COUNT(*), 2) AS bounce_rate_pct,
  ROUND(COUNTIF(totals.transactions > 0) * 100.0 / COUNT(*), 4) AS conversion_rate_pct,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6, 2) AS revenue_usd,
  ROUND(
    SUM(totals.totalTransactionRevenue) / NULLIF(COUNTIF(totals.transactions > 0), 0) / 1e6, 2
  ) AS aov_usd
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  device
ORDER BY
  sessions DESC;


-- ------------------------------------------------------------
-- Q4. 지역별 비교: US vs Non-US
-- 목적: 미국 사용자와 해외 사용자의 구매 행동 차이를 파악한다.
-- Google Merchandise Store는 미국 기반이므로 지역 편향이 예상된다.
-- ------------------------------------------------------------
SELECT
  IF(geoNetwork.country = 'United States', 'US', 'Non-US') AS region,
  COUNT(*) AS sessions,
  COUNT(DISTINCT fullVisitorId) AS visitors,
  ROUND(AVG(totals.pageviews), 2) AS avg_pageviews,
  ROUND(COUNTIF(totals.bounces = 1) * 100.0 / COUNT(*), 2) AS bounce_rate_pct,
  COUNTIF(totals.transactions > 0) AS purchase_sessions,
  ROUND(COUNTIF(totals.transactions > 0) * 100.0 / COUNT(*), 4) AS conversion_rate_pct,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6, 2) AS revenue_usd
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  region
ORDER BY
  region;


-- ------------------------------------------------------------
-- Q5. Z-test 데이터: 신규 vs 재방문 전환율 비교
-- 목적: Python에서 비율 차이 Z-test를 수행하기 위한 원시 데이터를 준비한다.
-- ------------------------------------------------------------
SELECT
  IF(visitNumber = 1, 'new', 'returning') AS visitor_type,
  COUNT(*) AS total_sessions,
  COUNTIF(totals.transactions > 0) AS conversions,
  ROUND(COUNTIF(totals.transactions > 0) * 100.0 / COUNT(*), 4) AS conversion_rate_pct
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  visitor_type
ORDER BY
  visitor_type;


-- ------------------------------------------------------------
-- Q6. 고가치 사용자 프로파일링 (상위 10% 매출 기여자)
-- 목적: 매출 상위 사용자의 특성을 파악하여 타겟팅 전략을 수립한다.
-- ------------------------------------------------------------
WITH user_revenue AS (
  SELECT
    fullVisitorId,
    COUNT(*) AS total_sessions,
    SUM(totals.totalTransactionRevenue) / 1e6 AS total_revenue_usd,
    COUNTIF(totals.transactions > 0) AS purchase_count,
    MAX(device.deviceCategory) AS primary_device,
    MAX(channelGrouping) AS primary_channel,
    MAX(geoNetwork.country) AS country
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    fullVisitorId
  HAVING
    total_revenue_usd > 0
),
percentiles AS (
  SELECT
    APPROX_QUANTILES(total_revenue_usd, 10)[OFFSET(9)] AS p90_revenue
  FROM user_revenue
)
SELECT
  'top_10_pct' AS segment,
  COUNT(*) AS users,
  ROUND(AVG(ur.total_sessions), 1) AS avg_sessions,
  ROUND(AVG(ur.purchase_count), 1) AS avg_purchases,
  ROUND(AVG(ur.total_revenue_usd), 2) AS avg_revenue_usd,
  ROUND(SUM(ur.total_revenue_usd), 2) AS total_revenue_usd
FROM user_revenue ur
CROSS JOIN percentiles p
WHERE ur.total_revenue_usd >= p.p90_revenue

UNION ALL

SELECT
  'bottom_90_pct' AS segment,
  COUNT(*) AS users,
  ROUND(AVG(ur.total_sessions), 1) AS avg_sessions,
  ROUND(AVG(ur.purchase_count), 1) AS avg_purchases,
  ROUND(AVG(ur.total_revenue_usd), 2) AS avg_revenue_usd,
  ROUND(SUM(ur.total_revenue_usd), 2) AS total_revenue_usd
FROM user_revenue ur
CROSS JOIN percentiles p
WHERE ur.total_revenue_usd < p.p90_revenue;
