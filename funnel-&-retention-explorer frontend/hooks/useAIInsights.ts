import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateContent, buildAnalysisPrompt, type GeminiMessage } from '../lib/geminiClient';
import { useNotifications } from '../context/NotificationContext';

const SYSTEM_INSTRUCTION = `You are an expert data analyst for FRE Analytics, a SaaS analytics platform.
Your job is to provide actionable insights based on funnel, retention, and segment analysis data.
Always be concise and data-driven. Format your response with clear headings and bullet points.
If the data seems insufficient, explain what additional data would help.
Respond in the same language as the user's question (Korean or English).`;

export function useAIInsights() {
  const { state } = useAppContext();
  const { addNotification } = useNotifications();
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<GeminiMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  const getDataContext = useCallback(() => {
    const funnelConversion = state.funnelResults && state.funnelResults.length > 1
      ? (state.funnelResults[state.funnelResults.length - 1].users / state.funnelResults[0].users) * 100
      : null;

    let retentionDay1: number | null = null;
    let retentionDay7: number | null = null;
    if (state.retentionResults && state.retentionResults.length > 0) {
      const firstCohort = state.retentionResults[0];
      retentionDay1 = firstCohort.days['D1'] ?? null;
      retentionDay7 = firstCohort.days['D7'] ?? null;
    }

    return buildAnalysisPrompt({
      datasetType: state.detectedType,
      totalUsers: state.dataQualityReport?.uniqueUsers || 0,
      totalEvents: state.processedData.length,
      uniqueEvents: state.uniqueEvents,
      funnelSteps: state.funnelSteps,
      funnelConversion,
      retentionDay1,
      retentionDay7,
      topInsights: state.insights.slice(0, 5).map(i => `[${i.type}] ${i.title}: ${i.body}`),
      subscriptionKPIs: state.subscriptionKPIs,
    });
  }, [state]);

  const generateSummary = useCallback(async () => {
    if (state.processedData.length === 0) {
      setAiError('No data available. Upload and process data first.');
      return;
    }

    setAiLoading(true);
    setAiError('');

    const dataContext = getDataContext();
    const prompt = `${dataContext}\n\nBased on this data, provide a comprehensive analysis summary with:\n1. Key findings (top 3-5 observations)\n2. Areas of concern\n3. Recommended actions\n4. What additional data would help deepen the analysis`;

    const result = await generateContent(prompt, SYSTEM_INSTRUCTION);

    if (result.error) {
      setAiError(result.error);
    } else {
      setAiSummary(result.text);
      addNotification('ai', 'AI 분석 완료', '대시보드에서 AI 요약을 확인하세요.');
    }

    setAiLoading(false);
  }, [state.processedData.length, getDataContext, addNotification]);

  const askQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', text: question }]);

    const dataContext = getDataContext();
    const fullPrompt = `${dataContext}\n\nUser question: ${question}`;

    const result = await generateContent(fullPrompt, SYSTEM_INSTRUCTION, chatHistory);

    if (result.error) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Error: ${result.error}` }]);
    } else {
      setChatMessages(prev => [...prev, { role: 'assistant', text: result.text }]);
      setChatHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: fullPrompt }] },
        { role: 'model', parts: [{ text: result.text }] },
      ]);
    }
  }, [getDataContext, chatHistory]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
    setChatHistory([]);
  }, []);

  return {
    aiSummary,
    aiLoading,
    aiError,
    generateSummary,
    chatMessages,
    askQuestion,
    clearChat,
    hasData: state.processedData.length > 0,
  };
}
