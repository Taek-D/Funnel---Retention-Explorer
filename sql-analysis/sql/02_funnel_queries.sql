-- ============================================================
-- 02. 이커머스 퍼널 분석 (Ecommerce Funnel Analysis)
-- Dataset: bigquery-public-data.google_analytics_sample
-- Period: 2016-08-01 ~ 2017-08-01
--
-- eCommerceAction.action_type 매핑:
--   '1' = Click through of product lists
--   '2' = Product detail views (상품 조회)
--   '3' = Add product(s) to cart (장바구니)
--   '5' = Check out (결제 시작)
--   '6' = Completed purchase (구매 완료)
-- ============================================================

-- ------------------------------------------------------------
-- Q1. 4단계 퍼널: 세션 기준 전환율
-- 목적: Product View → Cart → Checkout → Purchase 단계별
--       도달 세션 수와 전환율을 측정한다.
-- 기대: 가장 큰 이탈 지점(biggest drop-off)을 식별한다.
-- ------------------------------------------------------------
WITH funnel AS (
  SELECT
    fullVisitorId,
    visitId,
    MAX(IF(hits.eCommerceAction.action_type = '2', 1, 0)) AS product_view,
    MAX(IF(hits.eCommerceAction.action_type = '3', 1, 0)) AS add_to_cart,
    MAX(IF(hits.eCommerceAction.action_type = '5', 1, 0)) AS checkout,
    MAX(IF(hits.eCommerceAction.action_type = '6', 1, 0)) AS purchase
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`,
    UNNEST(hits) AS hits
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    fullVisitorId, visitId
)
SELECT
  COUNT(*) AS total_sessions,
  COUNTIF(product_view = 1) AS product_view_sessions,
  COUNTIF(add_to_cart = 1) AS add_to_cart_sessions,
  COUNTIF(checkout = 1) AS checkout_sessions,
  COUNTIF(purchase = 1) AS purchase_sessions,
  -- 단계별 전환율 (이전 단계 대비)
  ROUND(COUNTIF(add_to_cart = 1) * 100.0 / NULLIF(COUNTIF(product_view = 1), 0), 2)
    AS view_to_cart_pct,
  ROUND(COUNTIF(checkout = 1) * 100.0 / NULLIF(COUNTIF(add_to_cart = 1), 0), 2)
    AS cart_to_checkout_pct,
  ROUND(COUNTIF(purchase = 1) * 100.0 / NULLIF(COUNTIF(checkout = 1), 0), 2)
    AS checkout_to_purchase_pct,
  -- 전체 전환율 (Product View → Purchase)
  ROUND(COUNTIF(purchase = 1) * 100.0 / NULLIF(COUNTIF(product_view = 1), 0), 2)
    AS overall_conversion_pct
FROM funnel;


-- ------------------------------------------------------------
-- Q2. 디바이스별 퍼널 비교
-- 목적: Desktop vs Mobile vs Tablet 전환율 차이를 정량화한다.
-- 기대: 모바일 전환율이 데스크톱보다 낮다는 가설을 검증한다.
-- ------------------------------------------------------------
WITH funnel AS (
  SELECT
    device.deviceCategory AS device,
    fullVisitorId,
    visitId,
    MAX(IF(hits.eCommerceAction.action_type = '2', 1, 0)) AS product_view,
    MAX(IF(hits.eCommerceAction.action_type = '3', 1, 0)) AS add_to_cart,
    MAX(IF(hits.eCommerceAction.action_type = '5', 1, 0)) AS checkout,
    MAX(IF(hits.eCommerceAction.action_type = '6', 1, 0)) AS purchase
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`,
    UNNEST(hits) AS hits
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    device, fullVisitorId, visitId
)
SELECT
  device,
  COUNT(*) AS total_sessions,
  COUNTIF(product_view = 1) AS pv_sessions,
  COUNTIF(add_to_cart = 1) AS atc_sessions,
  COUNTIF(checkout = 1) AS co_sessions,
  COUNTIF(purchase = 1) AS purchase_sessions,
  ROUND(COUNTIF(add_to_cart = 1) * 100.0 / NULLIF(COUNTIF(product_view = 1), 0), 2)
    AS view_to_cart_pct,
  ROUND(COUNTIF(checkout = 1) * 100.0 / NULLIF(COUNTIF(add_to_cart = 1), 0), 2)
    AS cart_to_checkout_pct,
  ROUND(COUNTIF(purchase = 1) * 100.0 / NULLIF(COUNTIF(checkout = 1), 0), 2)
    AS checkout_to_purchase_pct,
  ROUND(COUNTIF(purchase = 1) * 100.0 / NULLIF(COUNTIF(product_view = 1), 0), 2)
    AS overall_conversion_pct
FROM funnel
GROUP BY device
ORDER BY total_sessions DESC;


-- ------------------------------------------------------------
-- Q3. 요일별 전환율
-- 목적: 요일에 따른 전환율 변화를 파악한다.
-- 기대: 주중 vs 주말 구매 행동 차이를 발견한다.
-- ------------------------------------------------------------
WITH funnel AS (
  SELECT
    PARSE_DATE('%Y%m%d', date) AS session_date,
    fullVisitorId,
    visitId,
    MAX(IF(hits.eCommerceAction.action_type = '2', 1, 0)) AS product_view,
    MAX(IF(hits.eCommerceAction.action_type = '6', 1, 0)) AS purchase
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`,
    UNNEST(hits) AS hits
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    session_date, fullVisitorId, visitId
)
SELECT
  FORMAT_DATE('%A', session_date) AS day_of_week,
  EXTRACT(DAYOFWEEK FROM session_date) AS day_num,
  COUNT(*) AS total_sessions,
  COUNTIF(product_view = 1) AS pv_sessions,
  COUNTIF(purchase = 1) AS purchase_sessions,
  ROUND(COUNTIF(purchase = 1) * 100.0 / NULLIF(COUNTIF(product_view = 1), 0), 2)
    AS conversion_rate_pct
FROM funnel
GROUP BY day_of_week, day_num
ORDER BY day_num;


-- ------------------------------------------------------------
-- Q4. 상품 조회에서 구매까지 소요 시간 분석
-- 목적: 사용자가 상품을 본 후 구매까지 걸리는 시간을 파악한다.
-- hits.time은 세션 시작부터 ms 단위의 오프셋이다.
-- ------------------------------------------------------------
WITH hit_times AS (
  SELECT
    fullVisitorId,
    visitId,
    MIN(IF(hits.eCommerceAction.action_type = '2', hits.time, NULL)) AS first_view_ms,
    MIN(IF(hits.eCommerceAction.action_type = '6', hits.time, NULL)) AS purchase_ms
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`,
    UNNEST(hits) AS hits
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    fullVisitorId, visitId
  HAVING
    first_view_ms IS NOT NULL AND purchase_ms IS NOT NULL
)
SELECT
  COUNT(*) AS sessions_with_purchase,
  ROUND(AVG(purchase_ms - first_view_ms) / 1000, 1) AS avg_seconds_to_purchase,
  ROUND(APPROX_QUANTILES(purchase_ms - first_view_ms, 100)[OFFSET(50)] / 1000, 1)
    AS median_seconds_to_purchase,
  ROUND(MIN(purchase_ms - first_view_ms) / 1000, 1) AS min_seconds,
  ROUND(MAX(purchase_ms - first_view_ms) / 1000, 1) AS max_seconds
FROM hit_times
WHERE purchase_ms >= first_view_ms;


-- ------------------------------------------------------------
-- Q5. 카이제곱 검정 데이터: 디바이스별 구매 여부 크로스탭
-- 목적: Python에서 카이제곱 검정을 수행하기 위한 원시 데이터를 준비한다.
-- 기대: Desktop vs Mobile 전환율 차이의 통계적 유의성을 검증한다.
-- ------------------------------------------------------------
WITH funnel AS (
  SELECT
    device.deviceCategory AS device,
    fullVisitorId,
    visitId,
    MAX(IF(hits.eCommerceAction.action_type = '2', 1, 0)) AS product_view,
    MAX(IF(hits.eCommerceAction.action_type = '6', 1, 0)) AS purchase
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`,
    UNNEST(hits) AS hits
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    device, fullVisitorId, visitId
)
SELECT
  device,
  COUNTIF(product_view = 1 AND purchase = 1) AS purchased,
  COUNTIF(product_view = 1 AND purchase = 0) AS not_purchased,
  COUNTIF(product_view = 1) AS total_product_viewers
FROM funnel
WHERE device IN ('desktop', 'mobile')
GROUP BY device
ORDER BY device;


-- ------------------------------------------------------------
-- Q6. 순차 검증 퍼널 (Sequential Funnel Validation)
-- 목적: 이벤트 발생 순서를 검증하여 정확한 순차 퍼널을 구축한다.
--
-- Q1은 "세션 내 이벤트 존재 여부"만 확인한다.
-- 이 쿼리는 "View → Cart → Checkout → Purchase 순서로 진행했는가"를
-- hits.hitNumber 기반으로 검증한다.
-- 비순차 퍼널과 비교하면 전환율이 달라질 수 있으며,
-- 그 차이가 퍼널 설계의 정확도에 직접 영향을 준다.
-- ------------------------------------------------------------
WITH ordered_actions AS (
  SELECT
    fullVisitorId,
    visitId,
    MIN(IF(hits.eCommerceAction.action_type = '2', hits.hitNumber, NULL)) AS view_hit,
    MIN(IF(hits.eCommerceAction.action_type = '3', hits.hitNumber, NULL)) AS cart_hit,
    MIN(IF(hits.eCommerceAction.action_type = '5', hits.hitNumber, NULL)) AS checkout_hit,
    MIN(IF(hits.eCommerceAction.action_type = '6', hits.hitNumber, NULL)) AS purchase_hit
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`,
    UNNEST(hits) AS hits
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    fullVisitorId, visitId
)
SELECT
  'non_sequential' AS method,
  COUNTIF(view_hit IS NOT NULL) AS step1_view,
  COUNTIF(cart_hit IS NOT NULL) AS step2_cart,
  COUNTIF(checkout_hit IS NOT NULL) AS step3_checkout,
  COUNTIF(purchase_hit IS NOT NULL) AS step4_purchase
FROM ordered_actions

UNION ALL

SELECT
  'sequential' AS method,
  COUNTIF(view_hit IS NOT NULL) AS step1_view,
  COUNTIF(
    view_hit IS NOT NULL
    AND cart_hit IS NOT NULL
    AND cart_hit > view_hit
  ) AS step2_cart,
  COUNTIF(
    view_hit IS NOT NULL
    AND cart_hit IS NOT NULL
    AND checkout_hit IS NOT NULL
    AND cart_hit > view_hit
    AND checkout_hit > cart_hit
  ) AS step3_checkout,
  COUNTIF(
    view_hit IS NOT NULL
    AND cart_hit IS NOT NULL
    AND checkout_hit IS NOT NULL
    AND purchase_hit IS NOT NULL
    AND cart_hit > view_hit
    AND checkout_hit > cart_hit
    AND purchase_hit > checkout_hit
  ) AS step4_purchase
FROM ordered_actions;


-- ------------------------------------------------------------
-- Q7. 퍼널 단계 간 소요 시간 분포 (Window Function 활용)
-- 목적: 각 단계 전환에 걸리는 시간의 분포를 파악한다.
-- hits.time은 세션 시작 이후 ms 오프셋이다.
-- APPROX_QUANTILES로 25/50/75 백분위를 산출한다.
-- ------------------------------------------------------------
WITH step_times AS (
  SELECT
    fullVisitorId,
    visitId,
    MIN(IF(hits.eCommerceAction.action_type = '2', hits.time, NULL)) AS view_time,
    MIN(IF(hits.eCommerceAction.action_type = '3', hits.time, NULL)) AS cart_time,
    MIN(IF(hits.eCommerceAction.action_type = '5', hits.time, NULL)) AS checkout_time,
    MIN(IF(hits.eCommerceAction.action_type = '6', hits.time, NULL)) AS purchase_time
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`,
    UNNEST(hits) AS hits
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    fullVisitorId, visitId
)
SELECT
  'view_to_cart' AS step,
  COUNT(*) AS n,
  ROUND(APPROX_QUANTILES((cart_time - view_time) / 1000, 4)[OFFSET(1)], 1) AS p25_sec,
  ROUND(APPROX_QUANTILES((cart_time - view_time) / 1000, 4)[OFFSET(2)], 1) AS median_sec,
  ROUND(APPROX_QUANTILES((cart_time - view_time) / 1000, 4)[OFFSET(3)], 1) AS p75_sec
FROM step_times
WHERE view_time IS NOT NULL AND cart_time IS NOT NULL AND cart_time > view_time

UNION ALL

SELECT
  'cart_to_checkout' AS step,
  COUNT(*) AS n,
  ROUND(APPROX_QUANTILES((checkout_time - cart_time) / 1000, 4)[OFFSET(1)], 1) AS p25_sec,
  ROUND(APPROX_QUANTILES((checkout_time - cart_time) / 1000, 4)[OFFSET(2)], 1) AS median_sec,
  ROUND(APPROX_QUANTILES((checkout_time - cart_time) / 1000, 4)[OFFSET(3)], 1) AS p75_sec
FROM step_times
WHERE cart_time IS NOT NULL AND checkout_time IS NOT NULL AND checkout_time > cart_time

UNION ALL

SELECT
  'checkout_to_purchase' AS step,
  COUNT(*) AS n,
  ROUND(APPROX_QUANTILES((purchase_time - checkout_time) / 1000, 4)[OFFSET(1)], 1) AS p25_sec,
  ROUND(APPROX_QUANTILES((purchase_time - checkout_time) / 1000, 4)[OFFSET(2)], 1) AS median_sec,
  ROUND(APPROX_QUANTILES((purchase_time - checkout_time) / 1000, 4)[OFFSET(3)], 1) AS p75_sec
FROM step_times
WHERE checkout_time IS NOT NULL AND purchase_time IS NOT NULL AND purchase_time > checkout_time;
