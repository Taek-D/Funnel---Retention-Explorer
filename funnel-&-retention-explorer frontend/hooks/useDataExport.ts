import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { usePlanGate } from './usePlanGate';
import { exportFunnelCSV, exportRetentionCSV, exportSegmentCSV } from '../lib/exportUtils';
import { useToast } from '../components/Toast';
import { useNotifications } from '../context/NotificationContext';

type ExportType = 'funnel' | 'retention' | 'segment';

export function useDataExport() {
  const { t } = useTranslation();
  const { state } = useAppContext();
  const { isPro, openUpgradeModal } = usePlanGate();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [exporting, setExporting] = useState(false);

  const exportCSV = (type: ExportType) => {
    try {
      if (type === 'funnel') {
        const data = state.funnelResults;
        if (!data || data.length === 0) { toast('warning', t('dataExport.noData')); return; }
        exportFunnelCSV(data);
      } else if (type === 'retention') {
        const data = state.retentionResults;
        if (!data || data.length === 0) { toast('warning', t('dataExport.noData')); return; }
        exportRetentionCSV(data);
      } else if (type === 'segment') {
        const data = state.segmentResults;
        if (!data || data.length === 0) { toast('warning', t('dataExport.noData')); return; }
        exportSegmentCSV(data);
      }
      toast('success', t('dataExport.complete'));
      addNotification('export', t('dataExport.complete'), t('dataExport.csvExported'));
    } catch {
      toast('error', t('dataExport.error'));
    }
  };

  const exportExcel = async (type: ExportType | 'all') => {
    if (!isPro) {
      openUpgradeModal(t('dataExport.excelProOnly'));
      return;
    }
    setExporting(true);
    try {
      if (type === 'funnel') {
        const data = state.funnelResults;
        if (!data || data.length === 0) { toast('warning', t('dataExport.noData')); return; }
        const { exportFunnelExcel } = await import('../lib/excelExport');
        await exportFunnelExcel(data);
      } else if (type === 'retention') {
        const data = state.retentionResults;
        if (!data || data.length === 0) { toast('warning', t('dataExport.noData')); return; }
        const { exportRetentionExcel } = await import('../lib/excelExport');
        await exportRetentionExcel(data);
      } else if (type === 'segment') {
        const data = state.segmentResults;
        if (!data || data.length === 0) { toast('warning', t('dataExport.noData')); return; }
        const { exportSegmentExcel } = await import('../lib/excelExport');
        await exportSegmentExcel(data);
      } else {
        const { exportAllAsExcel } = await import('../lib/excelExport');
        await exportAllAsExcel(
          state.funnelResults ?? null,
          state.retentionResults ?? null,
          state.segmentResults ?? null
        );
      }
      toast('success', t('dataExport.complete'));
      addNotification('export', t('dataExport.complete'), t('dataExport.excelExported'));
    } catch {
      toast('error', t('dataExport.error'));
    } finally {
      setExporting(false);
    }
  };

  return { exportCSV, exportExcel, exporting, isPro };
}
