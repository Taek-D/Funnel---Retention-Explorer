import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Activity } from '../Icons';

export const FooterSection: React.FC = () => {
  const { t } = useTranslation('pages');

  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 flex items-center justify-center rounded-md bg-accent/10 text-accent">
                <Activity size={16} />
              </div>
              <span className="font-semibold text-white text-sm tracking-tight">FRE Analytics</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{t('landing.footerDesc')}</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              {t('landing.footerProduct')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-slate-500 hover:text-white transition-colors">{t('landing.footerFeatures')}</a></li>
              <li><a href="#pricing" className="text-slate-500 hover:text-white transition-colors">{t('landing.footerPricing')}</a></li>
              <li><a href="#faq" className="text-slate-500 hover:text-white transition-colors">{t('landing.footerFaq')}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              {t('landing.footerLegal')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="text-slate-500 hover:text-white transition-colors">{t('landing.privacy')}</Link></li>
              <li><Link to="/terms" className="text-slate-500 hover:text-white transition-colors">{t('landing.terms')}</Link></li>
              <li><a href="https://github.com/castletaek/Funnel---Retention-Explorer" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              {t('landing.footerSupport')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-slate-600">{t('landing.footerDocs')}</span></li>
              <li><span className="text-slate-600">{t('landing.footerContact')}</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 text-center">
          <span className="text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} {t('landing.footerCopyright')}
          </span>
        </div>
      </div>
    </footer>
  );
};
