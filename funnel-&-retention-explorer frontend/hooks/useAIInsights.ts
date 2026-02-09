import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNotifications } from '../context/NotificationContext';
import { usePlanGate } from './usePlanGate';
import type { GeminiMessage } from '../lib/geminiClient';

const SYSTEM_INSTRUCTION = `You are an expert data analyst for FRE Analytics, a SaaS analytics platform.
Your job is to provide actionable insights based on funnel, retention, and segment analysis data.
Always be concise and data-driven. Format your response with clear headings and bullet points.
If the data seems insufficient, explain what additional data would help.
Always respond in Korean (한국어).`;

export function useAIInsights() {
  const { state, dispatch } = useAppContext();
  const { addNotification } = useNotifications();
  const planGate = usePlanGate();
  const aiSummary = state.aiSummary;
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<GeminiMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  const generateSummary = useCallback(async () => {
    if (state.processedData.length === 0) {
      setAiError('No data available. Upload and process data first.');
      return;
    }

    if (!planGate.canUseAI) {
      planGate.openUpgradeModal('ai_limit');
      return;
    }

    setAiLoading(true);
    setAiError('');

    const { generateContent, buildAnalysisPrompt } = await import('../lib/geminiClient');

    const dataContext = buildAnalysisPrompt({
      datasetType: state.detectedType,
      totalUsers: state.dataQualityReport?.uniqueUsers || 0,
      totalEvents: state.processedData.length,
      uniqueEvents: state.uniqueEvents,
      funnelSteps: state.funnelSteps,
      funnelConversion: state.funnelResults && state.funnelResults.length > 1
        ? (state.funnelResults[state.funnelResults.length - 1].users / state.funnelResults[0].users) * 100
        : null,
      retentionDay1: state.retentionResults?.[0]?.days['D1'] ?? null,
      retentionDay7: state.retentionResults?.[0]?.days['D7'] ?? null,
      topInsights: state.insights.slice(0, 5).map(i => `[${i.type}] ${i.title}: ${i.body}`),
      subscriptionKPIs: state.subscriptionKPIs,
    });

    const prompt = `${dataContext}\n\nBased on this data, provide a comprehensive analysis summary with:\n1. Key findings (top 3-5 observations)\n2. Areas of concern\n3. Recommended actions\n4. What additional data would help deepen the analysis`;

    const result = await generateContent(prompt, SYSTEM_INSTRUCTION);

    if (result.error) {
      setAiError(result.error);
    } else {
      dispatch({ type: 'SET_AI_SUMMARY', payload: result.text });
      addNotification('ai', 'AI 분석 완료', '대시보드에서 AI 요약을 확인하세요.');
    }

    setAiLoading(false);
  }, [state, addNotification, dispatch, planGate]);

  const askQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;

    if (!planGate.canUseAI) {
      planGate.openUpgradeModal('ai_limit');
      return;
    }

    setChatMessages(prev => [...prev, { role: 'user', text: question }]);

    const { generateContent, buildAnalysisPrompt } = await import('../lib/geminiClient');

    const dataContext = buildAnalysisPrompt({
      datasetType: state.detectedType,
      totalUsers: state.dataQualityReport?.uniqueUsers || 0,
      totalEvents: state.processedData.length,
      uniqueEvents: state.uniqueEvents,
      funnelSteps: state.funnelSteps,
      funnelConversion: state.funnelResults && state.funnelResults.length > 1
        ? (state.funnelResults[state.funnelResults.length - 1].users / state.funnelResults[0].users) * 100
        : null,
      retentionDay1: state.retentionResults?.[0]?.days['D1'] ?? null,
      retentionDay7: state.retentionResults?.[0]?.days['D7'] ?? null,
      topInsights: state.insights.slice(0, 5).map(i => `[${i.type}] ${i.title}: ${i.body}`),
      subscriptionKPIs: state.subscriptionKPIs,
    });

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
  }, [state, chatHistory, planGate]);

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
    planGate,
  };
}
