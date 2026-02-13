import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ExternalLink, Loader2 } from './Icons';

interface ConnectorFormGA4Props {
  config: { propertyId: string; isConnected: boolean };
  onChange: (config: { propertyId: string; isConnected: boolean }) => void;
  onStartOAuth: () => void;
  oauthLoading?: boolean;
}

export const ConnectorFormGA4: React.FC<ConnectorFormGA4Props> = ({ config, onChange, onStartOAuth, oauthLoading }) => {
  const { t } = useTranslation('pages');

  return (
    <div className="space-y-4">
      {config.isConnected ? (
        <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle size={16} className="text-emerald-400" />
          <span className="text-sm text-emerald-400">{t('connector.ga4.connected')}</span>
        </div>
      ) : (
        <button
          onClick={onStartOAuth}
          disabled={oauthLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-white text-black font-medium text-sm hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {oauthLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ExternalLink size={16} />
          )}
          {t('connector.ga4.connectGoogle')}
        </button>
      )}

      <div>
        <label className="block text-[11px] text-slate-400 mb-1">{t('connector.ga4.propertyId')}</label>
        <input
          type="text"
          value={config.propertyId}
          onChange={e => onChange({ ...config, propertyId: e.target.value })}
          placeholder="123456789"
          className="w-full px-3 py-2 bg-elevated border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-600 focus:border-accent/50 focus:outline-none"
        />
        <p className="text-[10px] text-slate-600 mt-1">{t('connector.ga4.propertyIdHint')}</p>
      </div>
    </div>
  );
};
