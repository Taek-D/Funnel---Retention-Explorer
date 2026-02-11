import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from './Icons';

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language?.startsWith('ko') ? 'ko' : 'en';
  const nextLang = currentLang === 'ko' ? 'en' : 'ko';

  const toggle = () => {
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggle}
      className="group relative w-10 h-10 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] transition-colors"
      aria-label={t(`language.${nextLang}`)}
      title={t(`language.${currentLang}`)}
    >
      <Globe size={16} />
      <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-mono font-bold text-accent leading-none uppercase">
        {currentLang}
      </span>
      <span className="absolute left-full ml-3 px-2 py-1 text-[11px] font-medium text-white bg-elevated border border-white/[0.06] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 hidden md:block">
        {t(`language.${currentLang}`)}
      </span>
    </button>
  );
};
