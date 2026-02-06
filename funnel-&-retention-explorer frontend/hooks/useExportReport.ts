import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { useNotifications } from '../context/NotificationContext';
import { exportReportAsPNG } from '../lib/reportEngine';

export function useExportReport() {
  const { state } = useAppContext();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [exporting, setExporting] = useState(false);

  const exportReport = useCallback(async () => {
    if (state.processedData.length === 0) {
      toast('warning', '데이터 없음', '리포트를 생성하려면 먼저 데이터를 업로드하세요.');
      return;
    }

    setExporting(true);
    toast('info', '리포트 생성 중...', 'PNG 파일을 다운로드합니다.');

    try {
      await exportReportAsPNG(state);
      toast('success', '리포트 내보내기 완료');
      addNotification('export', '리포트 내보내기 완료', 'PNG 파일이 다운로드되었습니다.');
    } catch (err) {
      toast('error', '리포트 생성 실패', err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setExporting(false);
    }
  }, [state, toast, addNotification]);

  return { exportReport, exporting };
}
