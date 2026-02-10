import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { parseCSV } from '../lib/csvParser';
import { processData, detectDatasetType, autoDetectColumns, getUniqueEvents, generateDataQualityReport } from '../lib/dataProcessor';
import { saveRecentFile, loadRecentFiles } from '../lib/recentFiles';
import { calculateSubscriptionKPIs, analyzeTrialConversion, analyzeChurn } from '../lib/subscriptionEngine';
import { calculatePaidRetention } from '../lib/retentionEngine';
import { generateInsights } from '../lib/insightsEngine';
import { useToast } from '../components/Toast';
import { useNotifications } from '../context/NotificationContext';
import { usePlanGate } from './usePlanGate';
import type { ColumnMapping } from '../types';
import type { SampleDataType } from '../lib/sampleData';

export function useCSVUpload() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const planGate = usePlanGate();

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast('warning', 'CSV 파일을 업로드해주세요');
      return;
    }

    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 10, message: '파일 읽는 중...' } });

    try {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 30, message: 'CSV 파싱 중...' } });

      const result = await parseCSV(file);

      // PI-9: CSV row limit enforcement
      if (result.data.length > planGate.csvRowLimit) {
        dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 0, message: '' } });
        planGate.openUpgradeModal('csv_limit');
        return;
      }

      dispatch({
        type: 'SET_RAW_DATA',
        payload: { rawData: result.data, headers: result.headers, fileName: file.name }
      });

      // Auto-detect column mapping (Phase 1: name-based, Phase 2: value-based fallback)
      const autoMapping = autoDetectColumns(result.headers, result.data);
      dispatch({ type: 'SET_COLUMN_MAPPING', payload: autoMapping });

      // Save metadata only (no CSV data in localStorage)
      saveRecentFile({
        fileName: file.name,
        lastOpened: new Date().toISOString(),
        rowCount: result.data.length,
        columnCount: result.headers.length
      });
      dispatch({ type: 'SET_RECENT_FILES', payload: loadRecentFiles() });

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 50, message: '컬럼 자동 감지 완료' } });
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 100, message: '완료!' } });
    } catch (error) {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 0, message: '' } });
      toast('error', 'CSV 파싱 오류', error instanceof Error ? error.message : '알 수 없는 오류');
    }
  }, [dispatch, toast]);

  const confirmMapping = useCallback(async (mapping: ColumnMapping) => {
    if (!mapping.timestamp || !mapping.userid || !mapping.eventname) {
      toast('warning', '필수 컬럼 미지정', 'Timestamp, User ID, Event Name 컬럼은 필수입니다.');
      return;
    }

    dispatch({ type: 'SET_COLUMN_MAPPING', payload: mapping });
    dispatch({ type: 'RESET_ANALYSIS' });
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 30, message: '데이터 처리 중...' } });

    const processed = processData(state.rawData, mapping);
    dispatch({ type: 'SET_PROCESSED_DATA', payload: processed });

    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 50, message: '이벤트 감지 중...' } });

    const events = getUniqueEvents(processed);
    dispatch({ type: 'SET_UNIQUE_EVENTS', payload: events });

    const qualityReport = generateDataQualityReport(state.rawData, processed);
    dispatch({ type: 'SET_DATA_QUALITY', payload: qualityReport });

    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 70, message: '데이터 유형 감지 중...' } });

    const detectedType = detectDatasetType(processed);
    dispatch({ type: 'SET_DETECTED_TYPE', payload: detectedType });

    if (detectedType === 'subscription') {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 80, message: '구독 분석 수행 중...' } });

      const kpis = calculateSubscriptionKPIs(state.rawData, mapping, state.headers);
      dispatch({ type: 'SET_SUBSCRIPTION_KPIS', payload: kpis });

      const trialAnalysis = analyzeTrialConversion(state.rawData, mapping, state.headers);
      dispatch({ type: 'SET_TRIAL_ANALYSIS', payload: trialAnalysis });

      const churnAnalysis = analyzeChurn(state.rawData, mapping);
      dispatch({ type: 'SET_CHURN_ANALYSIS', payload: churnAnalysis });

      const paidRetention = calculatePaidRetention(state.rawData, mapping);
      dispatch({ type: 'SET_PAID_RETENTION', payload: paidRetention });

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 90, message: '인사이트 생성 중...' } });

      const insights = generateInsights(processed, detectedType, kpis, trialAnalysis, churnAnalysis, paidRetention);
      dispatch({ type: 'SET_INSIGHTS', payload: insights });
    } else {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 90, message: '인사이트 생성 중...' } });

      const insights = generateInsights(processed, detectedType, null, null, null, null);
      dispatch({ type: 'SET_INSIGHTS', payload: insights });
    }

    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 100, message: '완료!' } });

    const typeName = detectedType === 'ecommerce' ? '이커머스' : detectedType === 'subscription' ? '구독 서비스' : null;
    if (typeName) {
      toast('success', '데이터 처리 완료', `감지된 데이터 유형: ${typeName}`);
    } else {
      toast('success', '데이터 처리 완료', '다른 화면으로 이동하여 분석하세요.');
    }
    addNotification('import', '데이터 가져오기 완료', `${processed.length}개 이벤트, ${qualityReport.uniqueUsers}명 사용자`);
  }, [state.rawData, state.headers, dispatch, toast, addNotification]);

  const loadSampleData = useCallback(async (type: SampleDataType) => {
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 10, message: '샘플 데이터 생성 중...' } });

    try {
      const { generateSampleData } = await import('../lib/sampleData');
      const sample = generateSampleData(type);

      dispatch({
        type: 'SET_RAW_DATA',
        payload: { rawData: sample.data, headers: sample.headers, fileName: sample.fileName }
      });
      dispatch({ type: 'SET_COLUMN_MAPPING', payload: sample.mapping });
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 40, message: '컬럼 자동 매핑 완료' } });

      // Auto-process (same logic as confirmMapping)
      dispatch({ type: 'RESET_ANALYSIS' });
      const processed = processData(sample.data, sample.mapping);
      dispatch({ type: 'SET_PROCESSED_DATA', payload: processed });

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 60, message: '이벤트 감지 중...' } });
      const events = getUniqueEvents(processed);
      dispatch({ type: 'SET_UNIQUE_EVENTS', payload: events });

      const qualityReport = generateDataQualityReport(sample.data, processed);
      dispatch({ type: 'SET_DATA_QUALITY', payload: qualityReport });

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 75, message: '데이터 유형 감지 중...' } });
      const detectedType = detectDatasetType(processed);
      dispatch({ type: 'SET_DETECTED_TYPE', payload: detectedType });

      if (detectedType === 'subscription') {
        dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 85, message: '구독 분석 수행 중...' } });
        const kpis = calculateSubscriptionKPIs(sample.data, sample.mapping, sample.headers);
        dispatch({ type: 'SET_SUBSCRIPTION_KPIS', payload: kpis });
        const trialAnalysis = analyzeTrialConversion(sample.data, sample.mapping, sample.headers);
        dispatch({ type: 'SET_TRIAL_ANALYSIS', payload: trialAnalysis });
        const churnAnalysis = analyzeChurn(sample.data, sample.mapping);
        dispatch({ type: 'SET_CHURN_ANALYSIS', payload: churnAnalysis });
        const paidRetention = calculatePaidRetention(sample.data, sample.mapping);
        dispatch({ type: 'SET_PAID_RETENTION', payload: paidRetention });
        const insights = generateInsights(processed, detectedType, kpis, trialAnalysis, churnAnalysis, paidRetention);
        dispatch({ type: 'SET_INSIGHTS', payload: insights });
      } else {
        dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 90, message: '인사이트 생성 중...' } });
        const insights = generateInsights(processed, detectedType, null, null, null, null);
        dispatch({ type: 'SET_INSIGHTS', payload: insights });
      }

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 100, message: '완료!' } });

      const typeName = type === 'ecommerce' ? '이커머스' : 'SaaS';
      toast('success', '샘플 데이터 로드 완료', `${typeName} 샘플 데이터가 로드되었습니다.`);
      addNotification('import', '샘플 데이터 로드 완료', `${processed.length}개 이벤트, ${qualityReport.uniqueUsers}명 사용자`);
    } catch (error) {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 0, message: '' } });
      toast('error', '샘플 데이터 로드 실패', error instanceof Error ? error.message : '알 수 없는 오류');
    }
  }, [dispatch, toast, addNotification]);

  return {
    handleFileUpload,
    confirmMapping,
    loadSampleData,
    isProcessing: state.isProcessing,
    processingProgress: state.processingProgress,
    processingMessage: state.processingMessage,
    planGate,
  };
}
