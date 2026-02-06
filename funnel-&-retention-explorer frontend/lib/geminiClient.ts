const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PLACEHOLDER_API_KEY') {
    return { text: '', error: 'Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env.local.' };
  }

  const contents: GeminiMessage[] = [
    ...(history || []),
    { role: 'user', parts: [{ text: prompt }] },
  ];

  const body: Record<string, any> = { contents };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  body.generationConfig = {
    temperature: 0.7,
    maxOutputTokens: 2048,
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { text: '', error: errorData?.error?.message || `API error: ${response.status}` };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text };
  } catch (err: any) {
    return { text: '', error: err.message || 'Network error' };
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
  subscriptionKPIs?: Record<string, any> | null;
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
