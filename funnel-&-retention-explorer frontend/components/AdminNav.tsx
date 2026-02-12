import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const adminTabs = [
  { path: '/app/admin', labelKey: 'admin.dashboard' },
  { path: '/app/admin/users', labelKey: 'admin.users' },
  { path: '/app/admin/billing', labelKey: 'admin.billing' },
];

export const AdminNav: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex gap-1 border-b border-white/[0.06] mb-6">
      {adminTabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
};
