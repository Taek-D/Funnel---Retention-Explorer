-- ============================================================
-- 03. 코호트 리텐션 분석 (Cohort Retention Analysis)
-- Dataset: bigquery-public-data.google_analytics_sample
-- Period: 2016-08-01 ~ 2017-08-01
--
-- 코호트 정의: 첫 방문 주(week) 기준
-- 리텐션: N주차에 재방문한 사용자 비율
-- ============================================================

-- ------------------------------------------------------------
-- Q1. 주간 코호트 리텐션 매트릭스 (Week 0 ~ Week 12)
-- 목적: 사용자의 재방문 패턴을 코호트별로 파악한다.
-- 기대: 리텐션 히트맵 시각화를 위한 pivot 데이터를 생성한다.
-- ------------------------------------------------------------
WITH first_visit AS (
  -- 각 사용자의 첫 방문 주(week)
  SELECT
    fullVisitorId,
    DATE_TRUNC(MIN(PARSE_DATE('%Y%m%d', date)), WEEK(MONDAY)) AS cohort_week
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    fullVisitorId
),
user_activity AS (
  -- 각 사용자의 방문 주 목록
  SELECT DISTINCT
    fullVisitorId,
    DATE_TRUNC(PARSE_DATE('%Y%m%d', date), WEEK(MONDAY)) AS activity_week
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
),
retention_data AS (
  SELECT
    fv.cohort_week,
    DATE_DIFF(ua.activity_week, fv.cohort_week, WEEK) AS week_number,
    COUNT(DISTINCT fv.fullVisitorId) AS users
  FROM first_visit fv
  JOIN user_activity ua
    ON fv.fullVisitorId = ua.fullVisitorId
  WHERE
    DATE_DIFF(ua.activity_week, fv.cohort_week, WEEK) BETWEEN 0 AND 12
  GROUP BY
    cohort_week, week_number
),
cohort_size AS (
  SELECT
    cohort_week,
    users AS cohort_users
  FROM retention_data
  WHERE week_number = 0
)
SELECT
  rd.cohort_week,
  cs.cohort_users,
  rd.week_number,
  rd.users AS retained_users,
  ROUND(rd.users * 100.0 / cs.cohort_users, 2) AS retention_pct
FROM retention_data rd
JOIN cohort_size cs
  ON rd.cohort_week = cs.cohort_week
ORDER BY
  rd.cohort_week, rd.week_number;


-- ------------------------------------------------------------
-- Q2. 전체 평균 리텐션 커브 (Week 0 ~ 12)
-- 목적: 코호트를 합산한 평균 리텐션 커브를 산출한다.
-- 기대: Week 1 drop-off 비율을 확인한다.
-- ------------------------------------------------------------
WITH first_visit AS (
  SELECT
    fullVisitorId,
    DATE_TRUNC(MIN(PARSE_DATE('%Y%m%d', date)), WEEK(MONDAY)) AS cohort_week
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    fullVisitorId
),
user_activity AS (
  SELECT DISTINCT
    fullVisitorId,
    DATE_TRUNC(PARSE_DATE('%Y%m%d', date), WEEK(MONDAY)) AS activity_week
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
)
SELECT
  DATE_DIFF(ua.activity_week, fv.cohort_week, WEEK) AS week_number,
  COUNT(DISTINCT fv.fullVisitorId) AS retained_users,
  ROUND(
    COUNT(DISTINCT fv.fullVisitorId) * 100.0
    / (SELECT COUNT(DISTINCT fullVisitorId) FROM first_visit),
    2
  ) AS retention_pct
FROM first_visit fv
JOIN user_activity ua
  ON fv.fullVisitorId = ua.fullVisitorId
WHERE
  DATE_DIFF(ua.activity_week, fv.cohort_week, WEEK) BETWEEN 0 AND 12
GROUP BY
  week_number
ORDER BY
  week_number;


-- ------------------------------------------------------------
-- Q3. 구매자 vs 비구매자 리텐션 비교
-- 목적: 구매 경험이 리텐션에 미치는 영향을 정량화한다.
-- 기대: 구매자의 리텐션이 비구매자보다 유의미하게 높을 것이다.
-- ------------------------------------------------------------
WITH purchasers AS (
  -- 기간 내 1회 이상 구매한 사용자
  SELECT DISTINCT fullVisitorId
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`,
    UNNEST(hits) AS hits
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
    AND hits.eCommerceAction.action_type = '6'
),
first_visit AS (
  SELECT
    fullVisitorId,
    DATE_TRUNC(MIN(PARSE_DATE('%Y%m%d', date)), WEEK(MONDAY)) AS cohort_week
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
  GROUP BY
    fullVisitorId
),
user_activity AS (
  SELECT DISTINCT
    fullVisitorId,
    DATE_TRUNC(PARSE_DATE('%Y%m%d', date), WEEK(MONDAY)) AS activity_week
  FROM
    `bigquery-public-data.google_analytics_sample.ga_sessions_*`
  WHERE
    _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
),
classified AS (
  SELECT
    fv.fullVisitorId,
    fv.cohort_week,
    ua.activity_week,
    DATE_DIFF(ua.activity_week, fv.cohort_week, WEEK) AS week_number,
    IF(p.fullVisitorId IS NOT NULL, 'purchaser', 'non_purchaser') AS user_type
  FROM first_visit fv
  JOIN user_activity ua
    ON fv.fullVisitorId = ua.fullVisitorId
  LEFT JOIN purchasers p
    ON fv.fullVisitorId = p.fullVisitorId
  WHERE
    DATE_DIFF(ua.activity_week, fv.cohort_week, WEEK) BETWEEN 0 AND 12
)
SELECT
  user_type,
  week_number,
  COUNT(DISTINCT fullVisitorId) AS retained_users,
  ROUND(
    COUNT(DISTINCT fullVisitorId) * 100.0
    / MAX(IF(week_number = 0, COUNT(DISTINCT fullVisitorId), NULL)) OVER(PARTITION BY user_type),
    2
  ) AS retention_pct
FROM classified
GROUP BY
  user_type, week_number
ORDER BY
  user_type, week_number;


-- ------------------------------------------------------------
-- Q4. 코호트 크기 추이
-- 목적: 시간에 따른 신규 사용자 유입 추세를 파악한다.
-- ------------------------------------------------------------
SELECT
  DATE_TRUNC(MIN(PARSE_DATE('%Y%m%d', date)), WEEK(MONDAY)) AS cohort_week,
  COUNT(DISTINCT fullVisitorId) AS new_users
FROM
  `bigquery-public-data.google_analytics_sample.ga_sessions_*`
WHERE
  _TABLE_SUFFIX BETWEEN '20160801' AND '20170801'
GROUP BY
  fullVisitorId
HAVING
  cohort_week IS NOT NULL
ORDER BY
  cohort_week;
