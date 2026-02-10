import React, { useState } from 'react';
import { Share2, Check, Copy, Loader2 } from './Icons';
import { usePlanGate } from '../hooks/usePlanGate';
import { useToast } from './Toast';

type ShareButtonProps = {
  snapshotId: string;
  existingToken?: string | null;
};

export const ShareButton: React.FC<ShareButtonProps> = ({ snapshotId, existingToken }) => {
  const { isPro, openUpgradeModal } = usePlanGate();
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    existingToken ? `${window.location.origin}/shared/${existingToken}` : null
  );
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!isPro) {
      openUpgradeModal('공유 리포트 URL은 Pro 요금제에서 사용할 수 있습니다.');
      return;
    }

    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast('success', '링크 복사됨');
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
      toast('success', '공유 링크 생성됨', '클립보드에 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast('error', '공유 실패', err instanceof Error ? err.message : '알 수 없는 오류');
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
      {sharing ? '생성 중...' : copied ? '복사됨' : shareUrl ? '링크 복사' : '공유'}
      {!isPro && <span className="text-xs bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded-full">Pro</span>}
    </button>
  );
};
