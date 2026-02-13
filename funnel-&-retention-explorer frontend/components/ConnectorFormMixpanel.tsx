import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from './Icons';

interface ConnectorFormMixpanelProps {
  config: { projectId: string; apiSecret: string };
  onChange: (config: { projectId: string; apiSecret: string }) => void;
}

export const ConnectorFormMixpanel: React.FC<ConnectorFormMixpanelProps> = ({ config, onChange }) => {
  const { t } = useTranslation('pages');
  const [showSecret, setShowSecret] = React.useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] text-slate-400 mb-1">{t('connector.mixpanel.projectId')}</label>
        <input
          type="text"
          value={config.projectId}
          onChange={e => onChange({ ...config, projectId: e.target.value })}
          placeholder="12345678"
          className="w-full px-3 py-2 bg-elevated border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-600 focus:border-accent/50 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 mb-1">{t('connector.mixpanel.apiSecret')}</label>
        <div className="relative">
          <input
            type={showSecret ? 'text' : 'password'}
            value={config.apiSecret}
            onChange={e => onChange({ ...config, apiSecret: e.target.value })}
            placeholder="••••••••••"
            className="w-full px-3 py-2 pr-10 bg-elevated border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-600 focus:border-accent/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">{t('connector.mixpanel.secretHint')}</p>
      </div>
    </div>
  );
};
