import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, RefreshCw, X, Search } from './Icons';
import { useAIInsights } from '../hooks/useAIInsights';

const NL_PATTERNS: { pattern: RegExp; path: string }[] = [
  { pattern: /퍼널|funnel|전환율|conversion/i, path: '/app/funnels' },
  { pattern: /리텐션|retention|잔존율|코호트|cohort/i, path: '/app/retention' },
  { pattern: /세그먼트|segment|비교/i, path: '/app/segments' },
  { pattern: /스티키니스|stickiness|DAU.*MAU/i, path: '/app/stickiness' },
  { pattern: /여정|journey|flow|흐름/i, path: '/app/journey' },
  { pattern: /대시보드|dashboard|요약|overview/i, path: '/app/dashboard' },
  { pattern: /인사이트|insight|분석/i, path: '/app/insights' },
];

function detectNavIntent(question: string): string | null {
  for (const { pattern, path } of NL_PATTERNS) {
    if (pattern.test(question)) return path;
  }
  return null;
}

interface AskAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskAIPanel: React.FC<AskAIPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { chatMessages, askQuestion, clearChat, hasData } = useAIInsights();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [navHint, setNavHint] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (input.trim().length > 3) {
      setNavHint(detectNavIntent(input));
    } else {
      setNavHint(null);
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const question = input.trim();
    setInput('');
    setNavHint(null);
    setSending(true);
    await askQuestion(question);
    setSending(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQueries = [
    t('ai.suggestion1'),
    t('ai.suggestion2'),
    t('ai.suggestion3'),
    t('ai.suggestion4'),
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl h-[600px] max-h-[80vh] bg-surface border border-white/[0.06] rounded-lg flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">{t('ai.askLabel')}</h3>
              <p className="text-slate-500 text-xs">{t('ai.poweredBy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title={t('ai.clearChat')}
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!hasData && (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">{t('ai.noData')}</p>
            </div>
          )}

          {hasData && chatMessages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <p className="text-slate-400 text-sm">{t('ai.emptyChat')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {quickQueries.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(suggestion); }}
                    className="px-3 py-1.5 text-xs text-slate-300 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* NL Quick Navigation */}
              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <p className="text-[11px] text-slate-500 mb-2 flex items-center justify-center gap-1">
                  <Search size={11} />
                  {t('nlQuery.examples', '예시 질문')}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { text: t('nlQuery.ex1', '퍼널 전환율이 가장 낮은 단계는?'), path: '/app/funnels' },
                    { text: t('nlQuery.ex2', '지난 7일간 DAU/MAU 추이를 보여줘'), path: '/app/stickiness' },
                    { text: t('nlQuery.ex3', '주요 이탈 구간은 어디야?'), path: '/app/retention' },
                  ].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(q.text);
                        handleNavigate(q.path);
                      }}
                      className="px-3 py-1.5 text-[11px] text-accent/70 bg-accent/5 hover:bg-accent/10 rounded-full border border-accent/10 transition-colors"
                    >
                      {q.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-accent text-white rounded-br-md'
                    : 'bg-white/5 text-slate-200 rounded-bl-md border border-white/5'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-lg rounded-bl-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-150" />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Nav hint */}
        {navHint && (
          <div className="px-6 py-2 border-t border-white/[0.03] bg-accent/5">
            <button
              onClick={() => handleNavigate(navHint)}
              className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 transition-colors"
            >
              <ArrowRight size={12} />
              {t('nlQuery.navigating', '페이지로 이동')} → {navHint.replace('/app/', '')}
            </button>
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasData ? t('nlQuery.placeholder', t('ai.placeholder')) : t('ai.placeholderNoData')}
              disabled={!hasData || sending}
              className="flex-1 bg-background border border-white/[0.06] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!hasData || sending || !input.trim()}
              className="px-4 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
