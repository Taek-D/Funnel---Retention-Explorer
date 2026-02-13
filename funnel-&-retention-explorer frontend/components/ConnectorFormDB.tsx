import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from './Icons';

interface DBConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  query: string;
}

interface ConnectorFormDBProps {
  dbType: 'postgresql' | 'mysql';
  config: DBConfig;
  onChange: (config: DBConfig) => void;
}

export const ConnectorFormDB: React.FC<ConnectorFormDBProps> = ({ dbType, config, onChange }) => {
  const { t } = useTranslation('pages');
  const [showPassword, setShowPassword] = React.useState(false);
  const defaultPort = dbType === 'postgresql' ? 5432 : 3306;

  const update = (field: keyof DBConfig, value: string | number | boolean) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[11px] text-slate-400 mb-1">{t('connector.db.host')}</label>
          <input
            type="text"
            value={config.host}
            onChange={e => update('host', e.target.value)}
            placeholder="db.example.com"
            className="w-full px-3 py-2 bg-elevated border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-600 focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[11px] text-slate-400 mb-1">{t('connector.db.port')}</label>
          <input
            type="number"
            value={config.port || defaultPort}
            onChange={e => update('port', parseInt(e.target.value) || defaultPort)}
            className="w-full px-3 py-2 bg-elevated border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-600 focus:border-accent/50 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 mb-1">{t('connector.db.database')}</label>
        <input
          type="text"
          value={config.database}
          onChange={e => update('database', e.target.value)}
          placeholder="analytics"
          className="w-full px-3 py-2 bg-elevated border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-600 focus:border-accent/50 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">{t('connector.db.username')}</label>
          <input
            type="text"
            value={config.username}
            onChange={e => update('username', e.target.value)}
            placeholder="readonly_user"
            className="w-full px-3 py-2 bg-elevated border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-600 focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">{t('connector.db.password')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={config.password}
              onChange={e => update('password', e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 pr-10 bg-elevated border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-600 focus:border-accent/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      {dbType === 'postgresql' && (
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={config.ssl ?? true}
            onChange={e => update('ssl', e.target.checked)}
            className="rounded border-white/[0.1] bg-elevated text-accent focus:ring-accent/50"
          />
          {t('connector.db.ssl')}
        </label>
      )}

      <div>
        <label className="block text-[11px] text-slate-400 mb-1">{t('connector.db.query')}</label>
        <textarea
          value={config.query}
          onChange={e => update('query', e.target.value)}
          rows={4}
          placeholder={`SELECT user_id, event_name, timestamp, platform\nFROM events\nWHERE timestamp > '2026-01-01'`}
          className="w-full px-3 py-2 bg-elevated border border-white/[0.06] rounded-md text-sm text-white placeholder-slate-600 focus:border-accent/50 focus:outline-none font-mono text-[12px]"
        />
      </div>
    </div>
  );
};
