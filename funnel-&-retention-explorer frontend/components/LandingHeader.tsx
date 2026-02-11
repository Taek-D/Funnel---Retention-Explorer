import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Activity, Globe } from './Icons';

export const LandingHeader: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('ko') ? 'ko' : 'en';
  const toggleLang = () => i18n.changeLanguage(currentLang === 'ko' ? 'en' : 'ko');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-background/90 backdrop-blur-sm border-b border-white/[0.06]' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-semibold text-sm group">
          <div className="w-7 h-7 flex items-center justify-center rounded-md bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
            <Activity size={16} />
          </div>
          <span className="tracking-tight">FRE Analytics</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-[13px] text-slate-500">
          <a href="#features" className="hover:text-white transition-colors">{t('header.features')}</a>
          <a href="#pricing" className="hover:text-white transition-colors">{t('header.pricing')}</a>
          <a href="#faq" className="hover:text-white transition-colors">{t('header.faq')}</a>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="px-2 py-1.5 text-[13px] text-slate-500 hover:text-white transition-colors flex items-center gap-1"
            aria-label={t(`language.${currentLang}`)}
          >
            <Globe size={14} />
            <span className="uppercase text-[11px] font-mono">{currentLang}</span>
          </button>
          <Link
            to="/login"
            className="px-3 py-1.5 text-[13px] font-medium text-slate-400 hover:text-white transition-colors"
          >
            {t('header.login')}
          </Link>
          <Link
            to="/signup"
            className="px-4 py-1.5 text-[13px] font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors"
          >
            {t('header.getStarted')}
          </Link>
        </div>

        <button
          className="md:hidden p-1.5 text-slate-400 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-250 ${
          mobileOpen ? 'max-h-[280px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-surface border-t border-white/[0.06] px-6 py-4 space-y-2">
          <a href="#features" className="block py-2 text-sm text-slate-400 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>{t('header.features')}</a>
          <a href="#pricing" className="block py-2 text-sm text-slate-400 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>{t('header.pricing')}</a>
          <a href="#faq" className="block py-2 text-sm text-slate-400 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>{t('header.faq')}</a>
          <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
            <button onClick={toggleLang} className="px-2 py-1.5 text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <Globe size={14} />
              <span className="uppercase text-[11px] font-mono">{currentLang}</span>
            </button>
            <Link to="/login" className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors">{t('header.login')}</Link>
            <Link to="/signup" className="px-4 py-1.5 text-sm font-semibold text-background bg-accent rounded-md">{t('header.getStarted')}</Link>
          </div>
        </div>
      </div>
    </header>
  );
};
