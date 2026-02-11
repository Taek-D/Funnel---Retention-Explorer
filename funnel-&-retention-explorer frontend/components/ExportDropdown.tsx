import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText } from './Icons';

type Props = {
  onCSV: () => void;
  onExcel: () => void;
  disabled?: boolean;
  exporting?: boolean;
  isPro?: boolean;
};

export const ExportDropdown: React.FC<Props> = ({ onCSV, onExcel, disabled, exporting, isPro }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled || exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Download size={14} />
        {exporting ? t('dataExport.exporting') : t('dataExport.export')}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-white/10 rounded-lg shadow-xl z-20 py-1">
          <button
            onClick={() => { onCSV(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors text-left"
          >
            <FileText size={14} className="text-slate-500" />
            {t('dataExport.csv')}
          </button>
          <button
            onClick={() => { onExcel(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors text-left"
          >
            <FileText size={14} className="text-accent" />
            {t('dataExport.excel')}
            {!isPro && <span className="ml-auto text-[10px] text-accent font-semibold">PRO</span>}
          </button>
        </div>
      )}
    </div>
  );
};
