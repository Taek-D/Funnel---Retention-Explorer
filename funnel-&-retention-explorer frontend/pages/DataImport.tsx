import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UploadCloud, CheckCircle, FileText, ChevronDown, Zap, ArrowRight, X, ShoppingBag, Briefcase, Sparkles, Braces, Table, BarChart2, Activity, TrendingUp, Link } from '../components/Icons';
import { useCSVUpload } from '../hooks/useCSVUpload';
import { useColumnMapping } from '../hooks/useColumnMapping';
import { useAppContext } from '../context/AppContext';
import { loadRecentFiles, removeRecentFile } from '../lib/recentFiles';
import { formatDateTime } from '../lib/formatters';
import type { ColumnMapping, ConnectorType } from '../types';
import type { SampleDataType } from '../lib/sampleData';

const CONNECTOR_ICONS: Record<string, React.ElementType> = {
  FileText, Braces, Table, BarChart2, Activity, TrendingUp,
};

const MAPPING_FIELDS: { key: keyof ColumnMapping; labelKey: string; required: boolean }[] = [
  { key: 'timestamp', labelKey: 'dataImport.colTimestamp', required: true },
  { key: 'userid', labelKey: 'dataImport.colUserId', required: true },
  { key: 'eventname', labelKey: 'dataImport.colEventName', required: true },
  { key: 'sessionid', labelKey: 'dataImport.colSessionId', required: false },
  { key: 'platform', labelKey: 'dataImport.colPlatform', required: false },
  { key: 'channel', labelKey: 'dataImport.colChannel', required: false },
];

const SAMPLE_OPTIONS: { type: SampleDataType; icon: React.ElementType; labelKey: string; descKey: string; rowsKey: string; usersKey: string }[] = [
  { type: 'ecommerce', icon: ShoppingBag, labelKey: 'dataImport.ecommerce', descKey: 'dataImport.sampleEcomDesc', rowsKey: 'dataImport.sampleEcomRows', usersKey: 'dataImport.sampleEcomUsers' },
  { type: 'saas', icon: Briefcase, labelKey: 'dataImport.saas', descKey: 'dataImport.sampleSaasDesc', rowsKey: 'dataImport.sampleSaasRows', usersKey: 'dataImport.sampleSaasUsers' },
];

export const DataImport: React.FC = () => {
  const { t } = useTranslation('pages');
  const { state, dispatch } = useAppContext();
  const { handleFileUpload, handleURLImport, confirmMapping, loadSampleData, isProcessing, processingProgress, processingMessage } = useCSVUpload();
  const { mapping, updateMapping, headers } = useColumnMapping();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recentFiles, setRecentFiles] = useState(loadRecentFiles());
  const [searchParams, setSearchParams] = useSearchParams();
  const sampleLoadedRef = useRef(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorType>('csv');
  const [sheetsUrl, setSheetsUrl] = useState('');

  useEffect(() => {
    setRecentFiles(loadRecentFiles());
  }, [state.recentFiles]);

  // Auto-load sample data from query param (?sample=ecommerce|saas)
  useEffect(() => {
    const sampleType = searchParams.get('sample') as SampleDataType | null;
    if (sampleType && !sampleLoadedRef.current && state.processedData.length === 0 && !isProcessing) {
      sampleLoadedRef.current = true;
      setSearchParams({}, { replace: true });
      loadSampleData(sampleType);
    }
  }, [searchParams, state.processedData.length, isProcessing, loadSampleData, setSearchParams]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleRemoveRecent = (index: number) => {
    const updated = removeRecentFile(index);
    setRecentFiles(updated);
    dispatch({ type: 'SET_RECENT_FILES', payload: updated });
  };

  const hasData = headers.length > 0;
  const isProcessed = state.processedData.length > 0;
  const currentStep = isProcessed ? 3 : hasData ? 2 : 1;
  const autoMappedCount = Object.values(mapping).filter(Boolean).length;
  const totalFields = MAPPING_FIELDS.length;
  const autoMappedPct = totalFields > 0 ? Math.round((autoMappedCount / totalFields) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between pb-2 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-white text-3xl font-bold tracking-tight mb-2">{t('dataImport.title')}</h1>
          <p className="text-slate-400 text-sm">{t('dataImport.desc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Upload Area */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-surface border border-white/[0.06] rounded-lg p-8 flex flex-col gap-8 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">{t('dataImport.fileUpload')}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${
                currentStep === 3 ? 'bg-accent/20 text-accent border-accent/30' : 'bg-accent/10 text-accent border-accent/20'
              }`}>
                Step {currentStep}/3
              </span>
            </div>

            <div
              data-tour="upload"
              className="relative w-full rounded-md border-2 border-dashed border-accent/30 bg-accent/5 p-10 flex flex-col items-center justify-center gap-4 transition-all hover:bg-accent/10 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={onDrop}
            >
              <input ref={fileInputRef} type="file" accept={selectedConnector === 'json' ? '.json' : selectedConnector === 'ga4-export' || selectedConnector === 'mixpanel-export' || selectedConnector === 'amplitude-export' ? '.csv,.json' : '.csv'} className="hidden" onChange={onFileSelect} />

              {hasData && (
                <div className="absolute top-4 left-4 text-accent flex items-center gap-1.5 bg-accent/10 px-2 py-1 rounded border border-accent/20">
                  <CheckCircle size={14} /> <span className="text-xs font-bold">{t('dataImport.loaded')}</span>
                </div>
              )}

              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-2">
                <UploadCloud size={36} />
              </div>
              <div className="text-center">
                {hasData ? (
                  <>
                    <p className="text-white font-semibold text-lg">{state.currentDataset}</p>
                    <p className="text-slate-400 text-sm mt-1"><span className="font-mono">{state.rawData.length.toLocaleString()}</span> rows • <span className="font-mono">{headers.length}</span> columns</p>
                  </>
                ) : (
                  <>
                    <p className="text-white font-semibold text-lg">{t('dataImport.dropzone')}</p>
                    <p className="text-slate-400 text-sm mt-1">{t('dataImport.csvHint')}</p>
                  </>
                )}
              </div>
            </div>

            {/* Processing Progress */}
            {(isProcessing || processingProgress > 0) && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-end">
                  <span className="text-white font-medium text-sm">{processingMessage}</span>
                  <span className="text-accent font-bold font-mono">{processingProgress}%</span>
                </div>
                <div className="h-2 w-full bg-surface rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Data Source Selector — visible only at Step 1 */}
          {currentStep === 1 && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Link size={18} className="text-accent" />
                <h3 className="text-white font-bold">{t('connector.selectSource')}</h3>
              </div>
              <p className="text-slate-400 text-sm">{t('connector.selectSourceDesc')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {([
                  { type: 'csv' as ConnectorType, icon: 'FileText', label: t('connector.csv') },
                  { type: 'json' as ConnectorType, icon: 'Braces', label: t('connector.json') },
                  { type: 'google-sheets' as ConnectorType, icon: 'Table', label: t('connector.googleSheets') },
                  { type: 'ga4-export' as ConnectorType, icon: 'BarChart2', label: t('connector.ga4') },
                  { type: 'mixpanel-export' as ConnectorType, icon: 'Activity', label: t('connector.mixpanel') },
                  { type: 'amplitude-export' as ConnectorType, icon: 'TrendingUp', label: t('connector.amplitude') },
                ]).map(({ type, icon, label }) => {
                  const Icon = CONNECTOR_ICONS[icon];
                  const isSelected = selectedConnector === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedConnector(type)}
                      className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all border ${
                        isSelected
                          ? 'bg-accent/10 border-accent/30 text-accent'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {Icon && <Icon size={16} />}
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Google Sheets URL Input */}
              {selectedConnector === 'google-sheets' && (
                <div className="flex flex-col gap-2 mt-2">
                  <input
                    type="url"
                    value={sheetsUrl}
                    onChange={e => setSheetsUrl(e.target.value)}
                    placeholder={t('connector.sheetsUrlPlaceholder')}
                    className="w-full bg-background border border-white/10 text-white text-sm rounded-lg p-3 placeholder:text-slate-500 focus:border-accent/50 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500">{t('connector.sheetsUrlHint')}</p>
                  <button
                    onClick={() => {
                      if (!sheetsUrl.trim()) return;
                      handleURLImport(sheetsUrl);
                    }}
                    disabled={isProcessing || !sheetsUrl.trim()}
                    className="self-start px-5 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {isProcessing ? t('connector.fetchingSheet') : t('connector.fetchSheet')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sample Data Section — visible only at Step 1 */}
          {currentStep === 1 && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-6 flex flex-col gap-4" data-tour="upload-sample">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-accent" />
                <h3 className="text-white font-bold">{t('dataImport.sampleTitle')}</h3>
              </div>
              <p className="text-slate-400 text-sm">{t('dataImport.sampleDesc')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_OPTIONS.map(({ type, icon: Icon, labelKey, descKey, rowsKey, usersKey }) => (
                  <button
                    key={type}
                    onClick={() => loadSampleData(type)}
                    disabled={isProcessing}
                    className="flex items-start gap-4 p-4 rounded-lg bg-background border border-white/[0.06] hover:border-accent/30 hover:bg-accent/5 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm">{t(labelKey)}</h4>
                      <p className="text-slate-500 text-xs mt-0.5">{t(descKey)}</p>
                      <p className="text-slate-600 text-[10px] font-mono mt-1">{t(rowsKey)} · {t(usersKey)} {t('dataImport.users')}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Column Mapping */}
          {hasData && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-8 flex flex-col gap-6">
              <div className="flex items-center gap-2 text-white mb-2">
                <h3 className="font-bold text-lg">{t('dataImport.columnMapping')}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MAPPING_FIELDS.map(({ key, labelKey, required }) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="text-slate-400 text-xs uppercase font-bold tracking-wider pl-1">
                      {t(labelKey)} {required && <span className="text-red-400">*</span>}
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-background border border-white/[0.06] text-white text-sm rounded-lg block p-3 pr-10 hover:border-white/20 focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                        value={mapping[key] || ''}
                        onChange={(e) => updateMapping(key, e.target.value)}
                      >
                        <option value="">{t('dataImport.selectColumn')}</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
                <Zap size={16} className="text-accent mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {t('dataImport.autoDetectHint')} <span className="text-white font-bold font-mono">{autoMappedPct}%</span> {t('dataImport.autoDetected')}
                </p>
              </div>

              {/* Data Preview */}
              {state.rawData.length > 0 && (
                <div className="overflow-x-auto max-h-[200px] rounded-lg border border-white/[0.06]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-white/5 text-slate-400 font-semibold sticky top-0">
                      <tr>
                        {headers.map(h => <th key={h} className="px-3 py-2 whitespace-nowrap">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {state.rawData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          {headers.map(h => (
                            <td key={h} className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-[150px] truncate">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Data Quality Report */}
              {state.dataQualityReport && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: t('dataImport.totalRows'), value: state.dataQualityReport.totalRows.toLocaleString() },
                    { label: t('dataImport.validRows'), value: `${state.dataQualityReport.validRows.toLocaleString()} (${state.dataQualityReport.failedRows} ${t('dataImport.failed')})` },
                    { label: t('dataImport.uniqueUsers'), value: state.dataQualityReport.uniqueUsers.toLocaleString() },
                    { label: t('dataImport.dateRange'), value: state.dataQualityReport.minDate && state.dataQualityReport.maxDate
                      ? `${state.dataQualityReport.minDate.toLocaleDateString()} ~ ${state.dataQualityReport.maxDate.toLocaleDateString()}`
                      : 'N/A' },
                  ].map((item, i) => (
                    <div key={i} className="bg-background border border-white/5 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{item.label}</p>
                      <p className="text-sm text-white font-medium font-mono mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => confirmMapping(mapping)}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {t('dataImport.confirmMapping')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Processing Complete */}
          {isProcessed && (
            <div className="bg-surface border border-accent/20 rounded-lg p-8 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{t('dataImport.processComplete')}</h3>
                    <p className="text-slate-400 text-sm">
                      {t('dataImport.eventsProcessed', { count: state.processedData.length.toLocaleString() })}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold border border-accent/30 tracking-wide uppercase">
                  Step 3/3
                </span>
              </div>
              <p className="text-slate-400 text-sm">{t('dataImport.analyzeHint')}</p>
            </div>
          )}
        </div>

        {/* Recent Files Sidebar */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface border border-white/[0.06] rounded-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">{t('dataImport.recentFiles')}</h3>
            </div>
            <div className="flex flex-col gap-3">
              {recentFiles.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <FileText size={32} className="text-slate-700 mb-2" />
                  <p className="text-slate-500 text-sm">{t('dataImport.noRecentFiles')}</p>
                  <p className="text-slate-600 text-xs mt-1">{t('dataImport.recentFilesHint')}</p>
                </div>
              ) : (
                recentFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background border border-white/5 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-slate-400">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{file.fileName}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(file.lastOpened)}{file.rowCount ? ` · ${file.rowCount.toLocaleString()} ${t('dataImport.rows')}` : ''}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveRecent(i); }}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Events (after data quality report) */}
          {state.dataQualityReport && state.dataQualityReport.topEvents.length > 0 && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-6 flex flex-col gap-4">
              <h3 className="text-white font-bold text-lg">{t('dataImport.topEvents')}</h3>
              <div className="space-y-2">
                {state.dataQualityReport.topEvents.slice(0, 8).map((evt, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 truncate flex-1">{evt.name}</span>
                    <span className="text-slate-400 font-mono ml-2">{evt.count.toLocaleString()}</span>
                    <span className="text-accent font-medium font-mono ml-2 w-14 text-right">{evt.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected Type Badge */}
          {state.detectedType && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-6 flex flex-col items-center gap-3">
              <p className="text-slate-400 text-xs uppercase font-bold">{t('dataImport.detectedType')}</p>
              <span className="px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold border border-accent/20">
                {state.detectedType === 'ecommerce' ? t('dataImport.ecommerceType') : t('dataImport.subscriptionType')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
