# Data Export Enhancement — Plan

> **Feature**: data-export
> **Priority**: 1/5 (Quick Win)
> **Date**: 2026-02-11

---

## 1. Background

Current export: PNG (free+watermark) and PDF (Pro only) via reportEngine.ts.
Users need to export raw analysis data as CSV/Excel for further analysis in spreadsheets.

## 2. Goals

- Add CSV export for each analysis type (funnel, retention, segments)
- Add Excel (XLSX) export with multi-sheet workbook
- Integrate export buttons into each analysis page
- Respect plan gating (Excel = Pro only, CSV = all users)
- Full i18n support (ko/en)

## 3. Scope

### In Scope
- DE-1: CSV export utility (`lib/exportUtils.ts`)
- DE-2: Excel export with SheetJS (`lib/excelExport.ts`)
- DE-3: Funnel page export buttons (CSV + Excel)
- DE-4: Retention page export buttons (CSV + Excel)
- DE-5: Segment page export buttons (CSV + Excel)
- DE-6: Dashboard quick-export (all data)
- DE-7: i18n keys for export UI

### Out of Scope
- Server-side export
- Scheduled/automated exports
- API data source export

## 4. Technical Approach

- **CSV**: Pure TypeScript, no dependencies (BOM + UTF-8 for Korean)
- **Excel**: SheetJS (xlsx) library — lightweight, no server needed
- **Plan Gate**: CSV = free, Excel = Pro only
- **UI**: Dropdown button (CSV | Excel) in each analysis page header

## 5. Success Criteria

- [ ] CSV downloads with correct Korean encoding
- [ ] Excel workbook with properly named sheets
- [ ] Pro gating works for Excel format
- [ ] All export strings localized (ko/en)
- [ ] Build passes, no bundle regression
