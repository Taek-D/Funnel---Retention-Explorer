import type { ReportFrequency } from '../types';

export interface ScheduledReportPayload {
  reportName: string;
  frequency: ReportFrequency;
  generatedAt: string;
  dataset: {
    totalEvents: number;
    uniqueUsers: number;
    dateRange: string;
  };
  funnel: {
    stepCount: number;
    overallConversion: number | null;
    topDropOff: string | null;
  } | null;
  retention: {
    cohortCount: number;
    avgDay1: number | null;
    avgDay7: number | null;
  } | null;
  highlights: string[];
}

export function buildScheduledPayload(
  reportName: string,
  frequency: ReportFrequency,
  datasetRows: Record<string, unknown>[],
  analysisResults?: {
    funnel?: { steps: string[]; results: { step: string; users: number; conversionRate: number }[] };
    retention?: { cohortCount: number; avgDay1: number | null; avgDay7: number | null };
  }
): ScheduledReportPayload {
  const uniqueUsers = new Set(datasetRows.map(r => r.user_id ?? r.userId ?? r.uid)).size;

  let dateRange = 'N/A';
  const dates = datasetRows
    .map(r => {
      const d = r.timestamp ?? r.date ?? r.created_at;
      return typeof d === 'string' ? new Date(d) : null;
    })
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length > 0) {
    dateRange = `${dates[0].toISOString().slice(0, 10)} ~ ${dates[dates.length - 1].toISOString().slice(0, 10)}`;
  }

  let funnel: ScheduledReportPayload['funnel'] = null;
  if (analysisResults?.funnel) {
    const { results } = analysisResults.funnel;
    const overallConversion = results.length > 1
      ? (results[results.length - 1].users / results[0].users) * 100
      : null;

    let topDropOff: string | null = null;
    let maxDrop = 0;
    for (let i = 1; i < results.length; i++) {
      const drop = results[i - 1].users - results[i].users;
      if (drop > maxDrop) {
        maxDrop = drop;
        topDropOff = `${results[i - 1].step} → ${results[i].step}`;
      }
    }

    funnel = {
      stepCount: results.length,
      overallConversion: overallConversion !== null ? parseFloat(overallConversion.toFixed(1)) : null,
      topDropOff,
    };
  }

  const retention = analysisResults?.retention ?? null;

  const highlights: string[] = [];
  if (funnel?.overallConversion !== null && funnel?.overallConversion !== undefined) {
    highlights.push(`Overall funnel conversion: ${funnel.overallConversion}%`);
  }
  if (funnel?.topDropOff) {
    highlights.push(`Biggest drop-off: ${funnel.topDropOff}`);
  }
  if (retention?.avgDay1 !== null && retention?.avgDay1 !== undefined) {
    highlights.push(`D1 retention: ${retention.avgDay1}%`);
  }

  return {
    reportName,
    frequency,
    generatedAt: new Date().toISOString(),
    dataset: {
      totalEvents: datasetRows.length,
      uniqueUsers,
      dateRange,
    },
    funnel,
    retention,
    highlights,
  };
}

export function formatSummaryText(payload: ScheduledReportPayload): { title: string; message: string } {
  const freqLabel = payload.frequency === 'daily' ? 'Daily' : payload.frequency === 'weekly' ? 'Weekly' : 'Monthly';
  const title = `[${freqLabel}] ${payload.reportName}`;

  const lines: string[] = [
    `Generated: ${new Date(payload.generatedAt).toLocaleString()}`,
    `Events: ${payload.dataset.totalEvents.toLocaleString()} | Users: ${payload.dataset.uniqueUsers.toLocaleString()}`,
    `Period: ${payload.dataset.dateRange}`,
  ];

  if (payload.funnel) {
    lines.push(`Funnel: ${payload.funnel.stepCount} steps, ${payload.funnel.overallConversion?.toFixed(1) ?? 'N/A'}% conversion`);
    if (payload.funnel.topDropOff) {
      lines.push(`  Drop-off: ${payload.funnel.topDropOff}`);
    }
  }

  if (payload.retention) {
    lines.push(`Retention: D1 ${payload.retention.avgDay1?.toFixed(1) ?? 'N/A'}%, D7 ${payload.retention.avgDay7?.toFixed(1) ?? 'N/A'}%`);
  }

  if (payload.highlights.length > 0) {
    lines.push('', 'Highlights:');
    for (const h of payload.highlights) {
      lines.push(`  • ${h}`);
    }
  }

  return { title, message: lines.join('\n') };
}
