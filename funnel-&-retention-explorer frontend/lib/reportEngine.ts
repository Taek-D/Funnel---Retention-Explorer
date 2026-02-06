import type { AppState } from '../types';

interface ReportSnapshot {
  generatedAt: string;
  datasetInfo: {
    totalEvents: number;
    uniqueUsers: number;
    dataType: string;
    dateRange: string;
  };
  funnel: {
    steps: string[];
    results: { step: string; users: number; conversionRate: number }[];
    overallConversion: number | null;
  } | null;
  retention: {
    cohortCount: number;
    avgDay1: number | null;
    avgDay7: number | null;
  } | null;
  insights: { type: string; title: string; body: string }[];
  subscription: {
    paidUsers: number;
    churnRate: number;
    revenue: number | null;
  } | null;
  aiSummary: string | null;
}

export function buildReportSnapshot(state: AppState): ReportSnapshot {
  const { processedData, funnelResults, retentionResults, insights, subscriptionKPIs, detectedType, dataQualityReport } = state;

  let dateRange = 'N/A';
  if (dataQualityReport?.minDate && dataQualityReport?.maxDate) {
    dateRange = `${dataQualityReport.minDate.toLocaleDateString()} - ${dataQualityReport.maxDate.toLocaleDateString()}`;
  }

  const datasetInfo = {
    totalEvents: processedData.length,
    uniqueUsers: dataQualityReport?.uniqueUsers || 0,
    dataType: detectedType === 'ecommerce' ? 'E-commerce' : detectedType === 'subscription' ? 'Subscription' : 'General',
    dateRange,
  };

  let funnel: ReportSnapshot['funnel'] = null;
  if (funnelResults && funnelResults.length > 0) {
    const overallConversion = funnelResults.length > 1
      ? (funnelResults[funnelResults.length - 1].users / funnelResults[0].users) * 100
      : null;
    funnel = {
      steps: funnelResults.map(s => s.step),
      results: funnelResults.map(s => ({ step: s.step, users: s.users, conversionRate: s.conversionRate })),
      overallConversion,
    };
  }

  let retention: ReportSnapshot['retention'] = null;
  if (retentionResults && retentionResults.length > 0) {
    const avgDay1 = retentionResults.reduce((sum, r) => sum + (r.days['D1'] || 0), 0) / retentionResults.length;
    const avgDay7 = retentionResults.reduce((sum, r) => sum + (r.days['D7'] || 0), 0) / retentionResults.length;
    retention = {
      cohortCount: retentionResults.length,
      avgDay1: parseFloat(avgDay1.toFixed(1)),
      avgDay7: parseFloat(avgDay7.toFixed(1)),
    };
  }

  let subscription: ReportSnapshot['subscription'] = null;
  if (subscriptionKPIs) {
    subscription = {
      paidUsers: subscriptionKPIs.paid_user_count,
      churnRate: subscriptionKPIs.cancel_rate_paid,
      revenue: subscriptionKPIs.gross_revenue,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    datasetInfo,
    funnel,
    retention,
    insights: insights.slice(0, 10).map(i => ({ type: i.type, title: i.title, body: i.body })),
    subscription,
    aiSummary: state.aiSummary || null,
  };
}

// --- Canvas-based PNG rendering ---

const PAGE_W = 1240;
const PAGE_H = 1754;
const MARGIN = 60;
const CONTENT_W = PAGE_W - MARGIN * 2;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const char of paragraph) {
      const test = current + char;
      if (ctx.measureText(test).width > maxWidth) {
        lines.push(current);
        current = char;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

function createPageCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext('2d')!;

  // Dark background
  ctx.fillStyle = '#0a0e27';
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  return { canvas, ctx };
}

function drawHeader(ctx: CanvasRenderingContext2D, y: number): number {
  ctx.fillStyle = '#00d4aa';
  ctx.font = 'bold 36px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  ctx.fillText('FRE Analytics Report', MARGIN, y);
  y += 20;

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(PAGE_W - MARGIN, y);
  ctx.stroke();
  y += 30;

  return y;
}

function drawSectionTitle(ctx: CanvasRenderingContext2D, title: string, y: number): number {
  ctx.fillStyle = '#00d4aa';
  ctx.font = 'bold 22px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  ctx.fillText(title, MARGIN, y);
  y += 10;

  ctx.strokeStyle = 'rgba(0,212,170,0.3)';
  ctx.beginPath();
  ctx.moveTo(MARGIN, y);
  ctx.lineTo(MARGIN + ctx.measureText(title).width, y);
  ctx.stroke();
  y += 25;

  return y;
}

function drawKeyValue(ctx: CanvasRenderingContext2D, key: string, value: string, y: number): number {
  ctx.font = '16px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(key + ':', MARGIN + 20, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(value, MARGIN + 200, y);
  return y + 28;
}

export function renderReportPages(snapshot: ReportSnapshot): HTMLCanvasElement[] {
  const pages: HTMLCanvasElement[] = [];

  // --- Page 1: Overview + Funnel ---
  const { canvas: p1, ctx: c1 } = createPageCanvas();
  let y = MARGIN + 40;
  y = drawHeader(c1, y);

  // Generated at
  c1.fillStyle = '#64748b';
  c1.font = '14px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  c1.fillText(`Generated: ${new Date(snapshot.generatedAt).toLocaleString()}`, MARGIN, y);
  y += 40;

  // Dataset Overview
  y = drawSectionTitle(c1, 'Dataset Overview', y);
  y = drawKeyValue(c1, 'Total Events', snapshot.datasetInfo.totalEvents.toLocaleString(), y);
  y = drawKeyValue(c1, 'Unique Users', snapshot.datasetInfo.uniqueUsers.toLocaleString(), y);
  y = drawKeyValue(c1, 'Data Type', snapshot.datasetInfo.dataType, y);
  y = drawKeyValue(c1, 'Date Range', snapshot.datasetInfo.dateRange, y);
  y += 20;

  // Subscription KPIs
  if (snapshot.subscription) {
    y = drawSectionTitle(c1, 'Subscription Metrics', y);
    y = drawKeyValue(c1, 'Paid Users', snapshot.subscription.paidUsers.toLocaleString(), y);
    y = drawKeyValue(c1, 'Churn Rate', snapshot.subscription.churnRate.toFixed(1) + '%', y);
    if (snapshot.subscription.revenue != null) {
      y = drawKeyValue(c1, 'Revenue', '$' + snapshot.subscription.revenue.toLocaleString(), y);
    }
    y += 20;
  }

  // Funnel
  if (snapshot.funnel) {
    y = drawSectionTitle(c1, 'Funnel Analysis', y);
    if (snapshot.funnel.overallConversion != null) {
      y = drawKeyValue(c1, 'Overall Conversion', snapshot.funnel.overallConversion.toFixed(1) + '%', y);
      y += 5;
    }

    // Draw funnel bars
    const maxUsers = Math.max(...snapshot.funnel.results.map(r => r.users), 1);
    const barMaxWidth = CONTENT_W - 200;

    for (const step of snapshot.funnel.results) {
      const barWidth = (step.users / maxUsers) * barMaxWidth;

      // Bar
      c1.fillStyle = 'rgba(0,212,170,0.2)';
      c1.beginPath();
      c1.roundRect(MARGIN + 20, y - 16, barWidth, 24, 4);
      c1.fill();

      c1.fillStyle = '#00d4aa';
      c1.beginPath();
      c1.roundRect(MARGIN + 20, y - 16, Math.max(barWidth * (step.conversionRate / 100), 4), 24, 4);
      c1.fill();

      // Label
      c1.fillStyle = '#ffffff';
      c1.font = '14px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      c1.fillText(`${step.step}  —  ${step.users.toLocaleString()} users (${step.conversionRate.toFixed(1)}%)`, MARGIN + barWidth + 30, y);

      y += 36;
      if (y > PAGE_H - MARGIN - 50) break;
    }
    y += 10;
  }

  pages.push(p1);

  // --- Page 2: Retention + Insights ---
  const { canvas: p2, ctx: c2 } = createPageCanvas();
  y = MARGIN + 40;
  y = drawHeader(c2, y);

  // Retention
  if (snapshot.retention) {
    y = drawSectionTitle(c2, 'Retention', y);
    y = drawKeyValue(c2, 'Cohorts', snapshot.retention.cohortCount.toString(), y);
    if (snapshot.retention.avgDay1 != null) {
      y = drawKeyValue(c2, 'Avg D1 Retention', snapshot.retention.avgDay1 + '%', y);
    }
    if (snapshot.retention.avgDay7 != null) {
      y = drawKeyValue(c2, 'Avg D7 Retention', snapshot.retention.avgDay7 + '%', y);
    }
    y += 30;
  }

  // Insights
  if (snapshot.insights.length > 0) {
    y = drawSectionTitle(c2, 'Key Insights', y);

    const typeColors: Record<string, string> = {
      success: '#00d4aa',
      warning: '#f59e0b',
      danger: '#f97066',
      info: '#38bdf8',
    };

    for (const insight of snapshot.insights) {
      if (y > PAGE_H - MARGIN - 100) break;

      // Type badge
      c2.fillStyle = typeColors[insight.type] || '#94a3b8';
      c2.font = 'bold 12px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      c2.fillText(`[${insight.type.toUpperCase()}]`, MARGIN + 20, y);

      // Title
      c2.fillStyle = '#ffffff';
      c2.font = 'bold 15px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      c2.fillText(insight.title, MARGIN + 100, y);
      y += 24;

      // Body (wrapped)
      c2.fillStyle = '#94a3b8';
      c2.font = '13px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      const bodyLines = wrapText(c2, insight.body, CONTENT_W - 40);
      for (const line of bodyLines.slice(0, 3)) {
        c2.fillText(line, MARGIN + 20, y);
        y += 20;
      }
      y += 12;
    }
  }

  // Footer
  c2.fillStyle = '#64748b';
  c2.font = '12px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  c2.fillText('Generated by FRE Analytics — fre-analytics.vercel.app', MARGIN, PAGE_H - MARGIN);

  pages.push(p2);

  // --- Page 3+: AI Analysis Summary (if exists) ---
  if (snapshot.aiSummary) {
    let { canvas: aiCanvas, ctx: aiCtx } = createPageCanvas();
    let aiY = MARGIN + 40;
    aiY = drawHeader(aiCtx, aiY);
    aiY = drawSectionTitle(aiCtx, 'AI 분석 요약', aiY);

    aiCtx.fillStyle = '#cbd5e1';
    aiCtx.font = '14px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    const summaryLines = wrapText(aiCtx, snapshot.aiSummary, CONTENT_W - 40);

    for (const line of summaryLines) {
      if (aiY > PAGE_H - MARGIN - 60) {
        // Footer on current page
        aiCtx.fillStyle = '#64748b';
        aiCtx.font = '12px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
        aiCtx.fillText('Generated by FRE Analytics — fre-analytics.vercel.app', MARGIN, PAGE_H - MARGIN);
        pages.push(aiCanvas);

        // Start new page
        ({ canvas: aiCanvas, ctx: aiCtx } = createPageCanvas());
        aiY = MARGIN + 40;
        aiY = drawHeader(aiCtx, aiY);
        aiY = drawSectionTitle(aiCtx, 'AI 분석 요약 (계속)', aiY);
        aiCtx.fillStyle = '#cbd5e1';
        aiCtx.font = '14px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      }
      aiCtx.fillText(line, MARGIN + 20, aiY);
      aiY += 22;
    }

    // Footer on last AI page
    aiCtx.fillStyle = '#64748b';
    aiCtx.font = '12px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    aiCtx.fillText('Generated by FRE Analytics — fre-analytics.vercel.app', MARGIN, PAGE_H - MARGIN);
    pages.push(aiCanvas);
  }

  return pages;
}

export async function exportReportAsPNG(state: AppState): Promise<void> {
  const snapshot = buildReportSnapshot(state);
  const pages = renderReportPages(snapshot);

  // Detect hostile environments (iOS Safari, WebView)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const useNewTab = isIOS || (isSafari && pages.length > 1);

  for (let i = 0; i < pages.length; i++) {
    const canvas = pages[i];
    const fileName = pages.length === 1
      ? 'fre-report.png'
      : `fre-report-page${i + 1}.png`;

    if (useNewTab) {
      // Fallback: open in new tab
      const dataUrl = canvas.toDataURL('image/png');
      const win = window.open('');
      if (win) {
        win.document.write(`<img src="${dataUrl}" style="max-width:100%;background:#0a0e27" />`);
        win.document.title = fileName;
      }
    } else {
      // Standard download
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Small delay between downloads
      if (i < pages.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
}
