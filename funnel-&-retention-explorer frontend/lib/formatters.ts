export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}분`;
  } else if (minutes < 1440) {
    return `${(minutes / 60).toFixed(1)}시간`;
  } else {
    return `${(minutes / 1440).toFixed(1)}일`;
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
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
