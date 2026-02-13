import React, { useState, useCallback } from 'react';
import { Camera, LoaderCircle } from '../components/Icons';
import { useTranslation } from 'react-i18next';

type ChartDownloadButtonProps = {
  targetRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
};

export const ChartDownloadButton: React.FC<ChartDownloadButtonProps> = ({ targetRef, filename }) => {
  const { t } = useTranslation('pages');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!targetRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#0f1117',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch { /* silently fail */ }
    finally { setDownloading(false); }
  }, [targetRef, filename, downloading]);

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
      title={t('chart.downloadPng')}
      aria-label={t('chart.downloadPng')}
    >
      {downloading ? <LoaderCircle size={14} className="animate-spin" /> : <Camera size={14} />}
    </button>
  );
};
