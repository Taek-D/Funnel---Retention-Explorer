import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from '../components/Icons';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation('pages');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-[120px] md:text-[160px] font-extrabold leading-none tracking-tightest text-white/[0.04] select-none">
          404
        </div>

        <h1 className="text-2xl font-bold text-white -mt-8 mb-3">
          {t('notFound.title')}
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          {t('notFound.description')}
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-colors"
          >
            <Home size={16} />
            {t('notFound.goHome')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-400 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:text-white rounded-lg transition-all"
          >
            <ArrowLeft size={16} />
            {t('notFound.goBack')}
          </button>
        </div>
      </div>
    </div>
  );
};
