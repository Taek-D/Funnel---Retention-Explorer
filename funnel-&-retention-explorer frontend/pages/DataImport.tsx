import React, { useCallback, useEffect, useRef, useState } from 'react';
import { UploadCloud, CheckCircle, FileText, ChevronDown, Zap, ArrowRight, X } from '../components/Icons';
import { useCSVUpload } from '../hooks/useCSVUpload';
import { useColumnMapping } from '../hooks/useColumnMapping';
import { useAppContext } from '../context/AppContext';
import { loadRecentFiles, removeRecentFile } from '../lib/recentFiles';
import { formatDateTime } from '../lib/formatters';
import type { ColumnMapping } from '../types';

const MAPPING_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: 'timestamp', label: '타임스탬프', required: true },
  { key: 'userid', label: '사용자 ID', required: true },
  { key: 'eventname', label: '이벤트명', required: true },
  { key: 'sessionid', label: '세션 ID', required: false },
  { key: 'platform', label: '플랫폼', required: false },
  { key: 'channel', label: '채널', required: false },
];

export const DataImport: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { handleFileUpload, loadRecentFileByIndex, confirmMapping, isProcessing, processingProgress, processingMessage } = useCSVUpload();
  const { mapping, updateMapping, headers } = useColumnMapping();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recentFiles, setRecentFiles] = useState(loadRecentFiles());

  useEffect(() => {
    setRecentFiles(loadRecentFiles());
  }, [state.recentFiles]);

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
  const autoMappedCount = Object.values(mapping).filter(Boolean).length;
  const totalFields = MAPPING_FIELDS.length;
  const autoMappedPct = totalFields > 0 ? Math.round((autoMappedCount / totalFields) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between pb-2 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-white text-3xl font-bold tracking-tight mb-2">데이터 업로드</h1>
          <p className="text-slate-400 text-sm">리텐션 분석을 위해 데이터를 업로드하고 매핑하세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Upload Area */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-surface border border-white/[0.06] rounded-lg p-8 flex flex-col gap-8 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">파일 업로드</h2>
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20 tracking-wide uppercase">
                Step {hasData ? '2/3' : '1/3'}
              </span>
            </div>

            <div
              className="relative w-full rounded-md border-2 border-dashed border-accent/30 bg-accent/5 p-10 flex flex-col items-center justify-center gap-4 transition-all hover:bg-accent/10 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={onDrop}
            >
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onFileSelect} />

              {hasData && (
                <div className="absolute top-4 left-4 text-accent flex items-center gap-1.5 bg-accent/10 px-2 py-1 rounded border border-accent/20">
                  <CheckCircle size={14} /> <span className="text-xs font-bold">로드 완료</span>
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
                    <p className="text-white font-semibold text-lg">CSV 파일을 여기에 드롭하거나 클릭하여 업로드</p>
                    <p className="text-slate-400 text-sm mt-1">.csv 파일 (헤더 행 포함) 지원</p>
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

          {/* Column Mapping */}
          {hasData && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-8 flex flex-col gap-6">
              <div className="flex items-center gap-2 text-white mb-2">
                <h3 className="font-bold text-lg">컬럼 매핑</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MAPPING_FIELDS.map(({ key, label, required }) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="text-slate-400 text-xs uppercase font-bold tracking-wider pl-1">
                      {label} {required && <span className="text-red-400">*</span>}
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none bg-background border border-white/[0.06] text-white text-sm rounded-lg block p-3 pr-10 hover:border-white/20 focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                        value={mapping[key] || ''}
                        onChange={(e) => updateMapping(key, e.target.value)}
                      >
                        <option value="">컬럼 선택...</option>
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
                  AI가 일반적인 명명 패턴을 기반으로 컬럼의 <span className="text-white font-bold font-mono">{autoMappedPct}%</span>를 자동 매핑했습니다.
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
                    { label: '전체 행', value: state.dataQualityReport.totalRows.toLocaleString() },
                    { label: '유효 행', value: `${state.dataQualityReport.validRows.toLocaleString()} (${state.dataQualityReport.failedRows} 실패)` },
                    { label: '고유 사용자', value: state.dataQualityReport.uniqueUsers.toLocaleString() },
                    { label: '날짜 범위', value: state.dataQualityReport.minDate && state.dataQualityReport.maxDate
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
                  매핑 확인 <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Files Sidebar */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface border border-white/[0.06] rounded-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">최근 파일</h3>
            </div>
            <div className="flex flex-col gap-3">
              {recentFiles.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">아직 열어본 파일이 없습니다.</p>
              ) : (
                recentFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background border border-white/5 hover:border-accent/30 transition-all cursor-pointer"
                    onClick={() => loadRecentFileByIndex(i)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-slate-400">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{file.fileName}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(file.lastOpened)}</p>
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
              <h3 className="text-white font-bold text-lg">상위 이벤트</h3>
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
              <p className="text-slate-400 text-xs uppercase font-bold">감지된 데이터 유형</p>
              <span className="px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-bold border border-accent/20">
                {state.detectedType === 'ecommerce' ? '이커머스 (E-commerce)' : '구독 서비스 (Subscription)'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
