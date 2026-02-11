import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { useNotifications } from '../context/NotificationContext';
import { usePlanGate } from './usePlanGate';
import { trackEvent } from '../lib/analytics';
import i18n from '../lib/i18n';

type ExportFormat = 'png' | 'pdf';

export function useExportReport() {
  const { state } = useAppContext();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { isPro, openUpgradeModal } = usePlanGate();
  const [exporting, setExporting] = useState(false);

  const exportReport = useCallback(async (format: ExportFormat = 'png') => {
    if (state.processedData.length === 0) {
      toast('warning', i18n.t('export.noData'), i18n.t('export.noDataDesc'));
      return;
    }

    if (format === 'pdf' && !isPro) {
      openUpgradeModal(i18n.t('export.pdfProOnly'));
      return;
    }

    setExporting(true);
    const label = format === 'pdf' ? 'PDF' : 'PNG';
    toast('info', i18n.t('export.generating'), i18n.t('export.generatingDesc', { format: label }));

    try {
      if (format === 'pdf') {
        const { exportReportAsPDF } = await import('../lib/reportEngine');
        await exportReportAsPDF(state, isPro);
      } else {
        const { exportReportAsPNG } = await import('../lib/reportEngine');
        await exportReportAsPNG(state, isPro);
      }
      toast('success', i18n.t('export.complete'));
      trackEvent('report_export', { format });
      addNotification('export', i18n.t('export.complete'), i18n.t('export.completeDesc', { format: label }));
    } catch (err) {
      toast('error', i18n.t('export.failed'), err instanceof Error ? err.message : i18n.t('unknown'));
    } finally {
      setExporting(false);
    }
  }, [state, toast, addNotification, isPro, openUpgradeModal]);

  return { exportReport, exporting, isPro };
}
