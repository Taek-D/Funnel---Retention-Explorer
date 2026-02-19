-- ============================================================
-- 05. 종합 인사이트 쿼리 (Cross-Analysis Insights)
-- Dataset: bigquery-public-data.google_analytics_sample
-- Period: 2016-08-01 ~ 2017-08-01
--
-- 앞선 4개 분석의 핵심 지표를 종합하여
-- 비즈니스 의사결정에 필요한 인사이트를 도출한다.
-- ============================================================

-- ------------------------------------------------------------
-- Q1. Executive Dashboard: 핵심 KPI 요약
-- 목적: 주요 비즈니스 지표를 한 눈에 파악한다.
-- ------------------------------------------------------------
SELECT
  COUNT(*) AS total_sessions,
  COUNT(DISTINCT fullVisitorId) AS unique_visitors,
  ROUND(COUNTIF(totals.transactions > 0) * 100.0 / COUNT(*), 4) AS overall_cvr_pct,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6, 2) AS total_revenue_usd,
  ROUND(
    SUM(totals.totalTransactionRevenue) / NULLIF(COUNTIF(totals.transactions > 0), 0) / 1e6, 2
  ) AS aov_usd,
  ROUND(AVG(totals.pageviews), 2) AS avg_pageviews,
  ROUND(COUNTIF(totals.bounces = 1) * 100.0 / COUNT(*), 2) AS bounce_rate_pct,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6 / COUNT(DISTINCT fullVisitorId), 2)
    AS revenue_per_visitor_usd
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801';


-- ------------------------------------------------------------
-- Q2. 모바일 전환 기회 크기 산출
-- 목적: 모바일 전환율을 데스크톱 수준으로 올렸을 때 추가 매출을 추정한다.
-- "So What?": 모바일 UX 개선의 ROI를 정량화한다.
-- ------------------------------------------------------------
WITH device_metrics AS (
  SELECT
    device.deviceCategory AS device,
    COUNT(*) AS sessions,
    COUNTIF(totals.transactions > 0) AS purchases,
    SUM(totals.totalTransactionRevenue) / 1e6 AS revenue_usd,
    ROUND(COUNTIF(totals.transactions > 0) * 100.0 / COUNT(*), 4) AS cvr_pct
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY device
)
SELECT
  mobile.sessions AS mobile_sessions,
  mobile.cvr_pct AS mobile_cvr,
  desktop.cvr_pct AS desktop_cvr,
  -- 모바일 전환율이 데스크톱 수준이 되면 추가되는 구매 건수
  ROUND(mobile.sessions * (desktop.cvr_pct - mobile.cvr_pct) / 100, 0)
    AS additional_purchases,
  -- 추가 매출 (데스크톱 AOV 기준)
  ROUND(
    mobile.sessions * (desktop.cvr_pct - mobile.cvr_pct) / 100
    * (desktop.revenue_usd / NULLIF(desktop.purchases, 0)),
    2
  ) AS additional_revenue_usd
FROM
  (SELECT * FROM device_metrics WHERE device = 'mobile') mobile,
  (SELECT * FROM device_metrics WHERE device = 'desktop') desktop;


-- ------------------------------------------------------------
-- Q3. 채널 효율성 매트릭스
-- 목적: 각 채널의 "비용 효율"(revenue per session)과 규모를 비교한다.
-- "So What?": 채널별 투자 우선순위를 결정한다.
-- ------------------------------------------------------------
SELECT
  channelGrouping AS channel,
  COUNT(*) AS sessions,
  ROUND(COUNTIF(totals.transactions > 0) * 100.0 / COUNT(*), 4) AS cvr_pct,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6, 2) AS revenue_usd,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6 / COUNT(*), 4) AS rps_usd,
  -- 효율성 등급
  CASE
    WHEN SUM(totals.totalTransactionRevenue) / 1e6 / COUNT(*) > 0.5 THEN 'High Efficiency'
    WHEN SUM(totals.totalTransactionRevenue) / 1e6 / COUNT(*) > 0.1 THEN 'Medium Efficiency'
    ELSE 'Low Efficiency'
  END AS efficiency_tier
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  channel
ORDER BY
  rps_usd DESC;


-- ------------------------------------------------------------
-- Q4. 구매자 재방문 가치 분석
-- 목적: 구매자의 재방문 빈도와 추가 매출 기여를 파악한다.
-- "So What?": 기존 구매자 리텐션 마케팅의 가치를 정량화한다.
-- ------------------------------------------------------------
WITH purchaser_visits AS (
  SELECT
    fullVisitorId,
    COUNT(*) AS total_visits,
    COUNTIF(totals.transactions > 0) AS purchase_visits,
    SUM(totals.totalTransactionRevenue) / 1e6 AS total_revenue_usd,
    MIN(PARSE_DATE('%Y%m%d', date)) AS first_visit,
    MAX(PARSE_DATE('%Y%m%d', date)) AS last_visit
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    fullVisitorId
  HAVING
    COUNTIF(totals.transactions > 0) > 0
)
SELECT
  CASE
    WHEN purchase_visits = 1 THEN '1-time buyer'
    WHEN purchase_visits = 2 THEN '2-time buyer'
    ELSE '3+ time buyer'
  END AS buyer_segment,
  COUNT(*) AS users,
  ROUND(AVG(total_visits), 1) AS avg_total_visits,
  ROUND(AVG(purchase_visits), 1) AS avg_purchase_visits,
  ROUND(AVG(total_revenue_usd), 2) AS avg_revenue_usd,
  ROUND(SUM(total_revenue_usd), 2) AS total_revenue_usd,
  ROUND(SUM(total_revenue_usd) * 100.0
    / SUM(SUM(total_revenue_usd)) OVER(), 2) AS revenue_share_pct
FROM purchaser_visits
GROUP BY buyer_segment
ORDER BY buyer_segment;


-- ------------------------------------------------------------
-- Q5. 월별 핵심 지표 추이 (Executive Trend)
-- 목적: 시간에 따른 비즈니스 성과 변화를 추적한다.
-- ------------------------------------------------------------
SELECT
  FORMAT_DATE('%Y-%m', PARSE_DATE('%Y%m%d', date)) AS month,
  COUNT(*) AS sessions,
  COUNT(DISTINCT fullVisitorId) AS visitors,
  ROUND(COUNTIF(totals.transactions > 0) * 100.0 / COUNT(*), 4) AS cvr_pct,
  ROUND(SUM(totals.totalTransactionRevenue) / 1e6, 2) AS revenue_usd,
  ROUND(
    SUM(totals.totalTransactionRevenue) / NULLIF(COUNTIF(totals.transactions > 0), 0) / 1e6, 2
  ) AS aov_usd,
  ROUND(COUNTIF(totals.bounces = 1) * 100.0 / COUNT(*), 2) AS bounce_rate_pct
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  month
ORDER BY
  month;


-- ------------------------------------------------------------
-- Q6. MoM 성장률 분석 (Window Function: LAG)
-- 목적: 월별 전월 대비 성장률을 산출하여 성장 모멘텀을 파악한다.
-- Window function(LAG)으로 이전 행의 값을 참조한다.
-- ------------------------------------------------------------
SELECT
  month,
  sessions,
  revenue_usd,
  prev_sessions,
  ROUND((sessions - prev_sessions) * 100.0
    / NULLIF(prev_sessions, 0), 2) AS sessions_mom_pct,
  prev_revenue,
  ROUND((revenue_usd - prev_revenue) * 100.0
    / NULLIF(prev_revenue, 0), 2) AS revenue_mom_pct
FROM (
  SELECT
    FORMAT_DATE('%Y-%m', PARSE_DATE('%Y%m%d', date)) AS month,
    COUNT(*) AS sessions,
    ROUND(SUM(totals.totalTransactionRevenue) / 1e6, 2) AS revenue_usd,
    LAG(COUNT(*)) OVER(ORDER BY FORMAT_DATE('%Y-%m', PARSE_DATE('%Y%m%d', date)))
      AS prev_sessions,
    LAG(ROUND(SUM(totals.totalTransactionRevenue) / 1e6, 2))
      OVER(ORDER BY FORMAT_DATE('%Y-%m', PARSE_DATE('%Y%m%d', date)))
      AS prev_revenue
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    month
)
ORDER BY
  month;


-- ------------------------------------------------------------
-- Q7. 사용자 가치 분위별 매출 기여 (Window Function: NTILE)
-- 목적: 사용자를 매출 기준 5분위로 나눠 각 분위의 기여도를 파악한다.
-- NTILE로 동일 크기 그룹을 만들고, 각 그룹의 합계를 산출한다.
-- ------------------------------------------------------------
WITH user_value AS (
  SELECT
    fullVisitorId,
    SUM(totals.totalTransactionRevenue) / 1e6 AS revenue_usd,
    COUNTIF(totals.transactions > 0) AS purchases
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    fullVisitorId
  HAVING
    revenue_usd > 0
),
quintiled AS (
  SELECT
    *,
    NTILE(5) OVER(ORDER BY revenue_usd DESC) AS quintile
  FROM user_value
)
SELECT
  quintile,
  COUNT(*) AS users,
  ROUND(MIN(revenue_usd), 2) AS min_revenue,
  ROUND(MAX(revenue_usd), 2) AS max_revenue,
  ROUND(AVG(revenue_usd), 2) AS avg_revenue,
  ROUND(SUM(revenue_usd), 2) AS total_revenue,
  ROUND(SUM(revenue_usd) * 100.0 / SUM(SUM(revenue_usd)) OVER(), 2) AS revenue_share_pct
FROM quintiled
GROUP BY quintile
ORDER BY quintile;
