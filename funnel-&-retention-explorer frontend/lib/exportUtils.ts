import i18n from './i18n';
import type { FunnelStep, RetentionCohort, SegmentResult } from '../types';

const BOM = '\uFEFF';

function getDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function arrayToCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return BOM + lines.join('\r\n');
}

export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportFunnelCSV(funnelData: FunnelStep[]): void {
  const t = i18n.t.bind(i18n);
  const headers = [
    t('dataExport.headers.step'),
    t('dataExport.headers.users'),
    t('dataExport.headers.conversionRate'),
    t('dataExport.headers.dropOff'),
  ];
  const rows = funnelData.map(s => [
    s.step,
    s.users,
    `${s.conversionRate.toFixed(1)}%`,
    s.dropOff,
  ]);
  const csv = arrayToCSV(headers, rows);
  downloadFile(csv, `fre-funnel-${getDateStr()}.csv`, 'text/csv;charset=utf-8');
}

export function exportRetentionCSV(retentionData: RetentionCohort[]): void {
  if (retentionData.length === 0) return;
  const t = i18n.t.bind(i18n);

  const dayKeys = Object.keys(retentionData[0].days).sort((a, b) => Number(a) - Number(b));
  const headers = [
    t('dataExport.headers.cohort'),
    t('dataExport.headers.cohortSize'),
    ...dayKeys.map(d => `Day ${d}`),
  ];
  const rows = retentionData.map(c => [
    c.cohortDate,
    c.cohortSize,
    ...dayKeys.map(d => {
      const val = c.days[d];
      return val != null ? `${val.toFixed(1)}%` : '-';
    }),
  ]);
  const csv = arrayToCSV(headers, rows);
  downloadFile(csv, `fre-retention-${getDateStr()}.csv`, 'text/csv;charset=utf-8');
}

export function exportSegmentCSV(segmentResults: SegmentResult[]): void {
  const t = i18n.t.bind(i18n);
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
    `${s.conversion.toFixed(1)}%`,
    `${s.uplift >= 0 ? '+' : ''}${s.uplift.toFixed(1)}%p`,
    s.pValue.toFixed(4),
  ]);
  const csv = arrayToCSV(headers, rows);
  downloadFile(csv, `fre-segment-${getDateStr()}.csv`, 'text/csv;charset=utf-8');
}
