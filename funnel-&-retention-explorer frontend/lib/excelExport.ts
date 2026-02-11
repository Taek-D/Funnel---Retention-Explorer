import i18n from './i18n';
import type { FunnelStep, RetentionCohort, SegmentResult } from '../types';

function getDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadXLSX() {
  const XLSX = await import('xlsx');
  return XLSX;
}

function t(key: string): string {
  return i18n.t(key);
}

function buildFunnelSheet(XLSX: typeof import('xlsx'), funnelData: FunnelStep[]) {
  const headers = [
    t('dataExport.headers.step'),
    t('dataExport.headers.users'),
    t('dataExport.headers.conversionRate'),
    t('dataExport.headers.dropOff'),
  ];
  const rows = funnelData.map(s => [s.step, s.users, s.conversionRate / 100, s.dropOff]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Format conversion rate as percentage
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let r = 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 2 })];
    if (cell) cell.z = '0.0%';
  }
  ws['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];
  return ws;
}

function buildRetentionSheet(XLSX: typeof import('xlsx'), retentionData: RetentionCohort[]) {
  if (retentionData.length === 0) return null;
  const dayKeys = Object.keys(retentionData[0].days).sort((a, b) => Number(a) - Number(b));
  const headers = [t('dataExport.headers.cohort'), t('dataExport.headers.cohortSize'), ...dayKeys.map(d => `Day ${d}`)];
  const rows = retentionData.map(c => [
    c.cohortDate,
    c.cohortSize,
    ...dayKeys.map(d => {
      const val = c.days[d];
      return val != null ? val / 100 : null;
    }),
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // Format day columns as percentage
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let r = 1; r <= range.e.r; r++) {
    for (let c = 2; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.v != null) cell.z = '0.0%';
    }
  }
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, ...dayKeys.map(() => ({ wch: 8 }))];
  return ws;
}

function buildSegmentSheet(XLSX: typeof import('xlsx'), segmentResults: SegmentResult[]) {
  const headers = [
    t('dataExport.headers.segment'),
    t('dataExport.headers.type'),
    t('dataExport.headers.population'),
    t('dataExport.headers.conversionRate'),
    t('dataExport.headers.uplift'),
    t('dataExport.headers.pValue'),
  ];
  const rows = segmentResults.map(s => [
    s.name,
    s.type,
    s.population,
    s.conversion / 100,
    s.uplift / 100,
    s.pValue,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let r = 1; r <= range.e.r; r++) {
    const cellC = ws[XLSX.utils.encode_cell({ r, c: 3 })];
    if (cellC) cellC.z = '0.0%';
    const cellD = ws[XLSX.utils.encode_cell({ r, c: 4 })];
    if (cellD) cellD.z = '+0.0%;-0.0%';
    const cellE = ws[XLSX.utils.encode_cell({ r, c: 5 })];
    if (cellE) cellE.z = '0.0000';
  }
  ws['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];
  return ws;
}

export async function exportFunnelExcel(funnelData: FunnelStep[]): Promise<void> {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildFunnelSheet(XLSX, funnelData), 'Funnel');
  XLSX.writeFile(wb, `fre-funnel-${getDateStr()}.xlsx`);
}

export async function exportRetentionExcel(retentionData: RetentionCohort[]): Promise<void> {
  const XLSX = await loadXLSX();
  const ws = buildRetentionSheet(XLSX, retentionData);
  if (!ws) return;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Retention');
  XLSX.writeFile(wb, `fre-retention-${getDateStr()}.xlsx`);
}

export async function exportSegmentExcel(segmentResults: SegmentResult[]): Promise<void> {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSegmentSheet(XLSX, segmentResults), 'Segments');
  XLSX.writeFile(wb, `fre-segment-${getDateStr()}.xlsx`);
}

export async function exportAllAsExcel(
  funnelData: FunnelStep[] | null,
  retentionData: RetentionCohort[] | null,
  segmentResults: SegmentResult[] | null
): Promise<void> {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();

  if (funnelData && funnelData.length > 0) {
    XLSX.utils.book_append_sheet(wb, buildFunnelSheet(XLSX, funnelData), 'Funnel');
  }
  if (retentionData && retentionData.length > 0) {
    const ws = buildRetentionSheet(XLSX, retentionData);
    if (ws) XLSX.utils.book_append_sheet(wb, ws, 'Retention');
  }
  if (segmentResults && segmentResults.length > 0) {
    XLSX.utils.book_append_sheet(wb, buildSegmentSheet(XLSX, segmentResults), 'Segments');
  }

  if (wb.SheetNames.length === 0) return;
  XLSX.writeFile(wb, `fre-analytics-${getDateStr()}.xlsx`);
}
