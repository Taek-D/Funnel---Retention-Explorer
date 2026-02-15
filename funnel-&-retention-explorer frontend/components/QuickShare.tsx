import React from 'react';
import { useTranslation } from 'react-i18next';
import { Copy } from './Icons';
import { useToast } from './Toast';
import { formatNum, formatPct } from '../lib/formatters';

interface QuickShareProps {
  uniqueUsers: number;
  totalEvents: number;
  overallConversion: number | null;
  dataType: string | null;
  funnelStepCount: number;
}

export const QuickShare: React.FC<QuickShareProps> = ({
  uniqueUsers,
  totalEvents,
  overallConversion,
  dataType,
  funnelStepCount,
}) => {
  const { t } = useTranslation('pages');
  const { toast } = useToast();

  const handleCopy = async () => {
    const lines: string[] = [
      `## FRE Analytics Summary`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| ${t('dashboard.uniqueUsers')} | ${formatNum(uniqueUsers)} |`,
      `| ${t('dashboard.totalEvents')} | ${formatNum(totalEvents)} |`,
    ];

    if (overallConversion !== null) {
      lines.push(`| ${t('dashboard.conversionRate')} | ${formatPct(overallConversion)} |`);
      lines.push(`| ${t('funnel.stepCount')} | ${funnelStepCount} |`);
    }

    if (dataType) {
      lines.push(`| ${t('dashboard.dataType')} | ${dataType} |`);
    }

    lines.push('', `> ${t('quickShare.generated')} · ${new Date().toLocaleDateString()}`);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast('success', t('quickShare.copied'));
    } catch {
      toast('error', t('quickShare.copyFailed'));
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
      title={t('quickShare.tooltip')}
    >
      <Copy size={16} />
      {t('quickShare.button')}
    </button>
  );
};
