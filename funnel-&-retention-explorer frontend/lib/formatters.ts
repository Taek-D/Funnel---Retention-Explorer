import i18n from './i18n';

export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return i18n.t('time.minutes', { count: Math.round(minutes) });
  } else if (minutes < 1440) {
    return i18n.t('time.hours', { count: Number((minutes / 60).toFixed(1)) });
  } else {
    return i18n.t('time.days', { count: Number((minutes / 1440).toFixed(1)) });
  }
}

export function formatNum(n: number | null | undefined): string {
  if (n == null) return '-';
  return n.toLocaleString();
}

export function formatPct(n: number | null | undefined): string {
  if (n == null) return 'N/A';
  return n.toFixed(1) + '%';
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return 'N/A';
  return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatDate(date: Date): string {
  const locale = i18n.language?.startsWith('ko') ? 'ko-KR' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatDateTime(dateStr: string): string {
  const locale = i18n.language?.startsWith('ko') ? 'ko-KR' : 'en-US';
  const date = new Date(dateStr);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function sanitizeEventName(name: string): string {
  return name.replace(/[<>"'&]/g, '');
}
