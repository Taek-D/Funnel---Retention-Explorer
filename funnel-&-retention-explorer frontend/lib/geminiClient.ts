import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const AI_PROXY_URL = `${SUPABASE_URL}/functions/v1/ai-proxy`;

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

export async function generateContent(
  prompt: string,
  systemInstruction?: string,
  history?: GeminiMessage[]
): Promise<GeminiResponse> {
  if (!supabase) {
    return { text: '', error: 'AI 서비스를 사용하려면 Supabase 설정이 필요합니다.' };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { text: '', error: 'AI 인사이트를 사용하려면 로그인이 필요합니다.' };
  }

  const contents: GeminiMessage[] = [
    ...(history || []),
    { role: 'user', parts: [{ text: prompt }] },
  ];

  const body: Record<string, unknown> = { contents };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  body.generationConfig = {
    temperature: 0.7,
    maxOutputTokens: 2048,
  };

  try {
    const response = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { text: '', error: errorData?.error?.message || errorData?.error || `API error: ${response.status}` };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text };
  } catch (err: unknown) {
    return { text: '', error: err instanceof Error ? err.message : 'Network error' };
  }
}

export function buildAnalysisPrompt(context: {
  datasetType?: string | null;
  totalUsers?: number;
  totalEvents?: number;
  uniqueEvents?: string[];
  funnelSteps?: string[];
  funnelConversion?: number | null;
  retentionDay1?: number | null;
  retentionDay7?: number | null;
  topInsights?: string[];
  subscriptionKPIs?: Record<string, number | string | null> | null;
}): string {
  const parts: string[] = [];

  parts.push('Here is the analytics data summary for the current dataset:');
  parts.push('');

  if (context.datasetType) {
    parts.push(`- Dataset Type: ${context.datasetType}`);
  }
  if (context.totalUsers) {
    parts.push(`- Total Unique Users: ${context.totalUsers.toLocaleString()}`);
  }
  if (context.totalEvents) {
    parts.push(`- Total Events: ${context.totalEvents.toLocaleString()}`);
  }
  if (context.uniqueEvents && context.uniqueEvents.length > 0) {
    parts.push(`- Event Types: ${context.uniqueEvents.slice(0, 20).join(', ')}`);
  }
  if (context.funnelSteps && context.funnelSteps.length > 0) {
    parts.push(`- Funnel Steps: ${context.funnelSteps.join(' → ')}`);
  }
  if (context.funnelConversion != null) {
    parts.push(`- Overall Funnel Conversion: ${context.funnelConversion.toFixed(1)}%`);
  }
  if (context.retentionDay1 != null) {
    parts.push(`- Day 1 Retention: ${context.retentionDay1.toFixed(1)}%`);
  }
  if (context.retentionDay7 != null) {
    parts.push(`- Day 7 Retention: ${context.retentionDay7.toFixed(1)}%`);
  }
  if (context.subscriptionKPIs) {
    const kpis = context.subscriptionKPIs;
    parts.push(`- Paid Users: ${kpis.paid_user_count || 0}`);
    parts.push(`- Churn Rate: ${kpis.cancel_rate_paid?.toFixed(1) || 0}%`);
    if (kpis.gross_revenue) parts.push(`- Revenue: $${kpis.gross_revenue.toLocaleString()}`);
  }
  if (context.topInsights && context.topInsights.length > 0) {
    parts.push('');
    parts.push('Existing rule-based insights:');
    context.topInsights.forEach((i, idx) => parts.push(`  ${idx + 1}. ${i}`));
  }

  return parts.join('\n');
}
