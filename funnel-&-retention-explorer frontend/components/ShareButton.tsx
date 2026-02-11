import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Check, Copy, Loader2 } from './Icons';
import { usePlanGate } from '../hooks/usePlanGate';
import { useToast } from './Toast';

type ShareButtonProps = {
  snapshotId: string;
  existingToken?: string | null;
};

export const ShareButton: React.FC<ShareButtonProps> = ({ snapshotId, existingToken }) => {
  const { t } = useTranslation();
  const { isPro, openUpgradeModal } = usePlanGate();
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    existingToken ? `${window.location.origin}/shared/${existingToken}` : null
  );
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!isPro) {
      openUpgradeModal(t('share.proOnly'));
      return;
    }

    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast('success', t('share.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    setSharing(true);
    try {
      const { shareSnapshot } = await import('../lib/supabaseData');
      const token = await shareSnapshot(snapshotId);
      const url = `${window.location.origin}/shared/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast('success', t('share.linkCreated'), t('share.copiedToClipboard'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast('error', t('share.failed'), err instanceof Error ? err.message : t('unknown'));
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleShare(); }}
      disabled={sharing}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
    >
      {sharing ? (
        <Loader2 size={14} className="animate-spin" />
      ) : copied ? (
        <Check size={14} className="text-accent" />
      ) : shareUrl ? (
        <Copy size={14} />
      ) : (
        <Share2 size={14} />
      )}
      {sharing ? t('share.creating') : copied ? t('share.copied') : shareUrl ? t('share.copyLink') : t('share.button')}
      {!isPro && <span className="text-xs bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded-full">Pro</span>}
    </button>
  );
};
