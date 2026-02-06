import React, { useState, useRef, useEffect } from 'react';
import { Zap, ArrowRight, RefreshCw, X } from './Icons';
import { useAIInsights } from '../hooks/useAIInsights';

interface AskAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskAIPanel: React.FC<AskAIPanelProps> = ({ isOpen, onClose }) => {
  const { chatMessages, askQuestion, clearChat, hasData } = useAIInsights();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const question = input.trim();
    setInput('');
    setSending(true);
    await askQuestion(question);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
              <h3 className="text-white font-bold text-sm">Ask AI</h3>
              <p className="text-slate-500 text-xs">Powered by Gemini 2.0 Flash</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Clear chat"
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
              <p className="text-slate-400 text-sm">Upload and process data to start asking questions.</p>
            </div>
          )}

          {hasData && chatMessages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <p className="text-slate-400 text-sm">Ask anything about your data analysis.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'What are the key trends in my data?',
                  'Why is the conversion rate low?',
                  'How can I improve retention?',
                  'What segments perform best?',
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(suggestion); }}
                    className="px-3 py-1.5 text-xs text-slate-300 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
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
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasData ? 'Ask about your data...' : 'Upload data first...'}
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
