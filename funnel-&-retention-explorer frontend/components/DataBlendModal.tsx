import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Trash2, Layers } from './Icons';
import { useDataBlend } from '../hooks/useDataBlend';
import { useToast } from './Toast';
import type { BlendStrategy, JoinKey } from '../lib/dataBlender';
import Papa from 'papaparse';
import type { RawRow } from '../types';

const MAX_BLEND_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface DataBlendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: RawRow[], headers: string[]) => void;
}

export const DataBlendModal: React.FC<DataBlendModalProps> = ({ isOpen, onClose, onApply }) => {
  const { t } = useTranslation('pages');
  const { sources, result, strategy, joinKey, addSource, removeSource, blend, reset, setStrategy, setJoinKey } = useDataBlend();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BLEND_FILE_SIZE) {
      toast('error', t('blend.fileTooLarge', 'File too large (max 50MB)'));
      e.target.value = '';
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        addSource({
          name: file.name,
          data: res.data as RawRow[],
          headers: res.meta.fields || [],
        });
      },
      error: (err) => {
        toast('error', err.message);
      },
    });

    e.target.value = '';
  };

  const handleBlend = () => {
    const blended = blend();
    if (!blended) return;
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result.data, result.headers);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface border border-white/[0.06] rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-accent" />
            <h3 className="text-sm font-bold text-white">{t('blend.title')}</h3>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-slate-400">{t('blend.desc')}</p>

          {/* Sources */}
          <div className="space-y-2">
            {sources.map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-md">
                <span className="text-xs text-white flex-1 truncate">{s.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{s.data.length} rows</span>
                <button onClick={() => removeSource(i)} className="text-slate-500 hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-slate-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-dashed border-white/[0.08] rounded-md transition-colors"
            >
              <Plus size={13} />
              {t('blend.addFile')}
            </button>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>

          {/* Strategy */}
          {sources.length >= 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{t('blend.mergeBy')}:</span>
                <div className="flex rounded-md overflow-hidden border border-white/[0.06]">
                  {(['union', 'join'] as BlendStrategy[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setStrategy(s)}
                      className={`px-3 py-1.5 text-xs transition-colors ${
                        strategy === s ? 'bg-accent/20 text-accent font-medium' : 'bg-white/[0.02] text-slate-500 hover:text-white'
                      }`}
                    >
                      {t(`blend.${s}`)}
                    </button>
                  ))}
                </div>
              </div>

              {strategy === 'join' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Key:</span>
                  <div className="flex rounded-md overflow-hidden border border-white/[0.06]">
                    {(['userid', 'date'] as JoinKey[]).map(k => (
                      <button
                        key={k}
                        onClick={() => setJoinKey(k)}
                        className={`px-3 py-1.5 text-xs transition-colors ${
                          joinKey === k ? 'bg-accent/20 text-accent font-medium' : 'bg-white/[0.02] text-slate-500 hover:text-white'
                        }`}
                      >
                        {t(`blend.${k}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleBlend}
                className="w-full px-4 py-2 text-xs font-medium text-white bg-accent/20 hover:bg-accent/30 border border-accent/20 rounded-md transition-colors"
              >
                {t('blend.preview')}
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">{t('blend.preview')}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {t('blend.totalRows', { count: result.totalRows })}
                </span>
              </div>
              <div className="space-y-1">
                {result.sourceCounts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate">{s.name}</span>
                    <span className="text-slate-500 font-mono">{s.rows}</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-slate-500">
                {t('blend.filesLoaded', { count: result.sourceCounts.length })} · {result.headers.length} columns
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-white/[0.06]">
          <button
            onClick={() => { reset(); onClose(); }}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            {t('blend.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleApply}
            disabled={!result}
            className="px-4 py-2 text-xs font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-40"
          >
            {t('blend.apply')}
          </button>
        </div>
      </div>
    </div>
  );
};
