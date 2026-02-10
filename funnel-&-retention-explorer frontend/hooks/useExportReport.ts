import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { useNotifications } from '../context/NotificationContext';
import { usePlanGate } from './usePlanGate';

type ExportFormat = 'png' | 'pdf';

export function useExportReport() {
  const { state } = useAppContext();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { isPro, openUpgradeModal } = usePlanGate();
  const [exporting, setExporting] = useState(false);

  const exportReport = useCallback(async (format: ExportFormat = 'png') => {
    if (state.processedData.length === 0) {
      toast('warning', '데이터 없음', '리포트를 생성하려면 먼저 데이터를 업로드하세요.');
      return;
    }

    if (format === 'pdf' && !isPro) {
      openUpgradeModal('PDF 리포트 내보내기는 Pro 요금제에서 사용할 수 있습니다.');
      return;
    }

    setExporting(true);
    const label = format === 'pdf' ? 'PDF' : 'PNG';
    toast('info', '리포트 생성 중...', `${label} 파일을 다운로드합니다.`);

    try {
      if (format === 'pdf') {
        const { exportReportAsPDF } = await import('../lib/reportEngine');
        await exportReportAsPDF(state, isPro);
      } else {
        const { exportReportAsPNG } = await import('../lib/reportEngine');
        await exportReportAsPNG(state, isPro);
      }
      toast('success', '리포트 내보내기 완료');
      addNotification('export', '리포트 내보내기 완료', `${label} 파일이 다운로드되었습니다.`);
    } catch (err) {
      toast('error', '리포트 생성 실패', err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setExporting(false);
    }
  }, [state, toast, addNotification, isPro, openUpgradeModal]);

  return { exportReport, exporting, isPro };
}
