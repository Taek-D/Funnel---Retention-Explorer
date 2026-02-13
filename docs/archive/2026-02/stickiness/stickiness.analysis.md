# Gap Analysis: Stickiness (DAU/MAU Stickiness Analysis)

**Date**: 2026-02-13
**Match Rate**: 100% (22/22)
**Iterations**: 0

## Results

### ST-1: Engine (5/5) — PASS
| # | Item | Status |
|---|------|--------|
| 1 | stickinessEngine.ts 파일 존재 | PASS |
| 2 | calculateStickiness 함수 export | PASS |
| 3 | StickinessResult 타입 export | PASS |
| 4 | daily 배열에 date/dau/mau/ratio 필드 | PASS |
| 5 | summary에 avgRatio/peakRatio/lowRatio/avgDAU/avgMAU/totalDays | PASS |

### ST-2: Page (6/6) — PASS
| # | Item | Status |
|---|------|--------|
| 6 | StickinessPage 컴포넌트 export | PASS |
| 7 | KPI 카드 3개 (avg/peak/low ratio) | PASS |
| 8 | AreaChart with ratio dataKey | PASS |
| 9 | 테이블 (date/dau/mau/ratio 컬럼) | PASS |
| 10 | ChartDownloadButton 포함 | PASS |
| 11 | 빈 상태 (processedData 없을 때) | PASS |

### ST-3: Route/Sidebar (3/3) — PASS
| # | Item | Status |
|---|------|--------|
| 12 | /app/stickiness lazy route in router.tsx | PASS |
| 13 | Sidebar에 stickiness 메뉴 항목 | PASS |
| 14 | Activity 아이콘 사용 | PASS |

### ST-4: Dashboard Widget (5/5) — PASS
| # | Item | Status |
|---|------|--------|
| 15 | 'stickiness-chart' in WidgetId union | PASS |
| 16 | DASHBOARD_WIDGETS에 stickiness-chart 항목 | PASS |
| 17 | DEFAULT_LAYOUT에 추가 (visible: false) | PASS |
| 18 | PRESET_TEMPLATES saas에 추가 | PASS |
| 19 | Dashboard.tsx에 스티키니스 위젯 렌더링 | PASS |

### ST-5: i18n (3/3) — PASS
| # | Item | Status |
|---|------|--------|
| 20 | 12 stickiness.* keys in ko/en pages.json | PASS |
| 21 | nav.stickiness in ko/en common.json | PASS |
| 22 | dashboard.widgets.stickinessChart in ko/en pages.json | PASS |

## Summary
- **Total**: 22/22 PASS
- **Match Rate**: 100%
- **Gaps**: None
- **Test Impact**: Dashboard.test.tsx fix (filter visible widgets in DEFAULT_LAYOUT iteration)
- **Build**: Success (5.19s)
- **Tests**: 310/310 passing
