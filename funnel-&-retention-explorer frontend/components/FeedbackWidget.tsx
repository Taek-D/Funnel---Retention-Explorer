import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Star, Send } from './Icons';
import { isBetaActive } from '../lib/betaConfig';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

type FeedbackCategory = 'bug' | 'feature' | 'ui' | 'other';

const CATEGORIES: { value: FeedbackCategory; labelKey: string }[] = [
  { value: 'bug', labelKey: 'beta.feedbackCategoryBug' },
  { value: 'feature', labelKey: 'beta.feedbackCategoryFeature' },
  { value: 'ui', labelKey: 'beta.feedbackCategoryUi' },
  { value: 'other', labelKey: 'beta.feedbackCategoryOther' },
];

async function submitFeedback(data: {
  rating: number;
  category: string;
  message: string;
  page: string;
}): Promise<boolean> {
  if (!supabase) {
    const key = 'fre_beta_feedback_queue';
    try {
      const queue = JSON.parse(localStorage.getItem(key) || '[]') as unknown[];
      queue.push({ ...data, created_at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(queue.slice(-20)));
    } catch { /* ignore */ }
    return true;
  }
  const { error } = await supabase.from('fre_beta_feedback').insert({
    rating: data.rating,
    category: data.category,
    message: data.message,
    page: data.page,
    user_agent: navigator.userAgent,
  });
  return !error;
}

export const FeedbackWidget: React.FC = () => {
  const { t } = useTranslation('pages');
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  if (!isBetaActive()) return null;

  const reset = () => {
    setRating(0);
    setHoverRating(0);
    setCategory('feature');
    setMessage('');
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (rating === 0 || !message.trim()) return;
    setSending(true);
    const ok = await submitFeedback({
      rating,
      category,
      message: message.slice(0, 500),
      page: location.pathname,
    });
    setSending(false);
    if (ok) {
      trackEvent('beta_feedback_submit', { rating, category });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 2000);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={t('beta.feedbackTitle')}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-accent text-background shadow-lg hover:bg-accent/90 transition-all hover:scale-105 flex items-center justify-center"
      >
        {open ? <X size={20} aria-hidden="true" /> : <MessageSquare size={20} aria-hidden="true" />}
      </button>

      {/* Feedback panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-surface border border-white/[0.06] rounded-xl shadow-2xl animate-fade-up" role="dialog" aria-label={t('beta.feedbackTitle')}>
          {submitted ? (
            <div className="p-6 text-center">
              <div className="text-2xl mb-2">&#10024;</div>
              <p className="text-sm text-accent font-medium">{t('beta.feedbackThanks')}</p>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">{t('beta.feedbackTitle')}</h3>

              {/* Rating */}
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">{t('beta.feedbackRating')}</label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5 transition-colors"
                      aria-label={`${n}/5`}
                    >
                      <Star
                        size={18}
                        className={n <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="feedback-category" className="text-[10px] text-slate-500 uppercase tracking-wider">{t('beta.feedbackCategory')}</label>
                <select
                  id="feedback-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                  className="mt-1 w-full bg-background border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} className="bg-surface">{t(c.labelKey)}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="feedback-message" className="text-[10px] text-slate-500 uppercase tracking-wider">{t('beta.feedbackMessage')}</label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="mt-1 w-full bg-background border border-white/[0.06] rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-accent/50 resize-none"
                  placeholder={t('beta.feedbackMessage')}
                />
                <div className="text-right text-[10px] text-slate-600 mt-0.5">{message.length}/500</div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || !message.trim() || sending}
                className="w-full py-2 text-xs font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Send size={12} aria-hidden="true" />
                {sending ? '...' : t('beta.feedbackSubmit')}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
