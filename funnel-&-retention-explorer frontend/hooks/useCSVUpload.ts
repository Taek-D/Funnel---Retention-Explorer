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
import { trackEvent } from '../lib/analytics';
import type { ColumnMapping } from '../types';
import type { SampleDataType } from '../lib/sampleData';
import i18n from '../lib/i18n';

export function useCSVUpload() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const planGate = usePlanGate();

  const handleFileUpload = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'json') {
      toast('warning', i18n.t('pages:connector.supportedFormats'));
      return;
    }

    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 10, message: i18n.t('insights:processing.readingFile') } });

    try {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 30, message: i18n.t('insights:processing.parsingCSV') } });

      let result: { data: import('../types').RawRow[]; headers: string[] };

      if (ext === 'json') {
        const text = await file.text();
        const { parseJSON } = await import('../lib/connectors/jsonConnector');
        result = parseJSON(text);
      } else {
        result = await parseCSV(file);
      }

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

      // Detect export format and apply preset mapping if recognized
      const { detectExportFormat, getPresetMapping, normalizeTimestamps } = await import('../lib/connectors/presetTransformers');
      const format = detectExportFormat(result.headers);
      let autoMapping;
      if (format !== 'unknown') {
        const normalized = normalizeTimestamps(result.data, format);
        dispatch({ type: 'SET_RAW_DATA', payload: { rawData: normalized, headers: result.headers, fileName: file.name } });
        autoMapping = getPresetMapping(format)!;
        toast('info', i18n.t('pages:connector.detectedFormat', { format: format.toUpperCase() }));
      } else {
        autoMapping = autoDetectColumns(result.headers, result.data);
      }
      dispatch({ type: 'SET_COLUMN_MAPPING', payload: autoMapping });

      // Save metadata only (no CSV data in localStorage)
      saveRecentFile({
        fileName: file.name,
        lastOpened: new Date().toISOString(),
        rowCount: result.data.length,
        columnCount: result.headers.length
      });
      dispatch({ type: 'SET_RECENT_FILES', payload: loadRecentFiles() });

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 50, message: i18n.t('insights:processing.autoDetectComplete') } });
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 100, message: i18n.t('insights:processing.done') } });
      trackEvent('csv_upload', { file_name: file.name, row_count: result.data.length });
    } catch (error) {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 0, message: '' } });
      toast('error', i18n.t('insights:toast.csvParseError'), error instanceof Error ? error.message : i18n.t('insights:toast.unknownError'));
    }
  }, [dispatch, toast]);

  const confirmMapping = useCallback(async (mapping: ColumnMapping) => {
    if (!mapping.timestamp || !mapping.userid || !mapping.eventname) {
      toast('warning', i18n.t('insights:toast.requiredColumns'), i18n.t('insights:toast.requiredColumnsDesc'));
      return;
    }

    dispatch({ type: 'SET_COLUMN_MAPPING', payload: mapping });
    dispatch({ type: 'RESET_ANALYSIS' });
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 30, message: i18n.t('insights:processing.processingData') } });

    const processed = processData(state.rawData, mapping);
    dispatch({ type: 'SET_PROCESSED_DATA', payload: processed });

    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 50, message: i18n.t('insights:processing.detectingEvents') } });

    const events = getUniqueEvents(processed);
    dispatch({ type: 'SET_UNIQUE_EVENTS', payload: events });

    const qualityReport = generateDataQualityReport(state.rawData, processed);
    dispatch({ type: 'SET_DATA_QUALITY', payload: qualityReport });

    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 70, message: i18n.t('insights:processing.detectingType') } });

    const detectedType = detectDatasetType(processed);
    dispatch({ type: 'SET_DETECTED_TYPE', payload: detectedType });

    if (detectedType === 'subscription') {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 80, message: i18n.t('insights:processing.analyzingSubscription') } });

      const kpis = calculateSubscriptionKPIs(state.rawData, mapping, state.headers);
      dispatch({ type: 'SET_SUBSCRIPTION_KPIS', payload: kpis });

      const trialAnalysis = analyzeTrialConversion(state.rawData, mapping, state.headers);
      dispatch({ type: 'SET_TRIAL_ANALYSIS', payload: trialAnalysis });

      const churnAnalysis = analyzeChurn(state.rawData, mapping);
      dispatch({ type: 'SET_CHURN_ANALYSIS', payload: churnAnalysis });

      const paidRetention = calculatePaidRetention(state.rawData, mapping);
      dispatch({ type: 'SET_PAID_RETENTION', payload: paidRetention });

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 90, message: i18n.t('insights:processing.generatingInsights') } });

      const insights = generateInsights(processed, detectedType, kpis, trialAnalysis, churnAnalysis, paidRetention);
      dispatch({ type: 'SET_INSIGHTS', payload: insights });
    } else {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 90, message: i18n.t('insights:processing.generatingInsights') } });

      const insights = generateInsights(processed, detectedType, null, null, null, null);
      dispatch({ type: 'SET_INSIGHTS', payload: insights });
    }

    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 100, message: i18n.t('insights:processing.done') } });

    const typeName = detectedType === 'ecommerce' ? i18n.t('insights:dataType.ecommerce') : detectedType === 'subscription' ? i18n.t('insights:dataType.subscription') : null;
    if (typeName) {
      toast('success', i18n.t('insights:toast.processComplete'), i18n.t('insights:toast.detectedType', { type: typeName }));
    } else {
      toast('success', i18n.t('insights:toast.processComplete'), i18n.t('insights:toast.processCompleteDesc'));
    }
    addNotification('import', i18n.t('insights:toast.importComplete'), i18n.t('insights:toast.importStats', { events: processed.length, users: qualityReport.uniqueUsers }));
  }, [state.rawData, state.headers, dispatch, toast, addNotification]);

  const loadSampleData = useCallback(async (type: SampleDataType) => {
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 10, message: i18n.t('insights:processing.generatingSample') } });

    try {
      const { generateSampleData } = await import('../lib/sampleData');
      const sample = generateSampleData(type);

      dispatch({
        type: 'SET_RAW_DATA',
        payload: { rawData: sample.data, headers: sample.headers, fileName: sample.fileName }
      });
      dispatch({ type: 'SET_COLUMN_MAPPING', payload: sample.mapping });
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 40, message: i18n.t('insights:processing.autoMappingComplete') } });

      // Auto-process (same logic as confirmMapping)
      dispatch({ type: 'RESET_ANALYSIS' });
      const processed = processData(sample.data, sample.mapping);
      dispatch({ type: 'SET_PROCESSED_DATA', payload: processed });

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 60, message: i18n.t('insights:processing.detectingEvents') } });
      const events = getUniqueEvents(processed);
      dispatch({ type: 'SET_UNIQUE_EVENTS', payload: events });

      const qualityReport = generateDataQualityReport(sample.data, processed);
      dispatch({ type: 'SET_DATA_QUALITY', payload: qualityReport });

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 75, message: i18n.t('insights:processing.detectingType') } });
      const detectedType = detectDatasetType(processed);
      dispatch({ type: 'SET_DETECTED_TYPE', payload: detectedType });

      if (detectedType === 'subscription') {
        dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 85, message: i18n.t('insights:processing.analyzingSubscription') } });
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
        dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 90, message: i18n.t('insights:processing.generatingInsights') } });
        const insights = generateInsights(processed, detectedType, null, null, null, null);
        dispatch({ type: 'SET_INSIGHTS', payload: insights });
      }

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 100, message: i18n.t('insights:processing.done') } });
      trackEvent('sample_data_load', { sample_type: type });

      const typeName = type === 'ecommerce' ? i18n.t('insights:dataType.ecommerce') : i18n.t('insights:dataType.saas');
      toast('success', i18n.t('insights:toast.sampleLoadComplete'), i18n.t('insights:toast.sampleLoadDesc', { type: typeName }));
      addNotification('import', i18n.t('insights:toast.sampleLoadComplete'), i18n.t('insights:toast.importStats', { events: processed.length, users: qualityReport.uniqueUsers }));
    } catch (error) {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 0, message: '' } });
      toast('error', i18n.t('insights:toast.sampleLoadFailed'), error instanceof Error ? error.message : i18n.t('insights:toast.unknownError'));
    }
  }, [dispatch, toast, addNotification]);

  const handleURLImport = useCallback(async (url: string) => {
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 10, message: i18n.t('pages:connector.fetchingSheet') } });

    try {
      const { extractSheetId, fetchGoogleSheet } = await import('../lib/connectors/googleSheetsConnector');
      const sheetId = extractSheetId(url);
      if (!sheetId) {
        dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 0, message: '' } });
        toast('warning', i18n.t('pages:connector.invalidSheetsUrl'));
        return;
      }

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 40, message: i18n.t('pages:connector.fetchingSheet') } });
      const result = await fetchGoogleSheet(sheetId);

      if (result.data.length > planGate.csvRowLimit) {
        dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 0, message: '' } });
        planGate.openUpgradeModal('csv_limit');
        return;
      }

      dispatch({
        type: 'SET_RAW_DATA',
        payload: { rawData: result.data, headers: result.headers, fileName: `Google Sheets (${sheetId.slice(0, 8)}...)` }
      });

      const autoMapping = autoDetectColumns(result.headers, result.data);
      dispatch({ type: 'SET_COLUMN_MAPPING', payload: autoMapping });

      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, progress: 70, message: i18n.t('insights:processing.autoDetectComplete') } });
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 100, message: i18n.t('insights:processing.done') } });
      trackEvent('csv_upload', { file_name: 'google-sheets', row_count: result.data.length });
    } catch (error) {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false, progress: 0, message: '' } });
      toast('error', i18n.t('insights:toast.csvParseError'), error instanceof Error ? error.message : i18n.t('insights:toast.unknownError'));
    }
  }, [dispatch, toast]);

  return {
    handleFileUpload,
    handleURLImport,
    confirmMapping,
    loadSampleData,
    isProcessing: state.isProcessing,
    processingProgress: state.processingProgress,
    processingMessage: state.processingMessage,
    planGate,
  };
}
