import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BillingRecord } from '../lib/planManager';

interface BillingHistoryProps {
  records: BillingRecord[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

function formatAmount(amount: number): string {
  return `₩${amount.toLocaleString()}`;
}

export const BillingHistory: React.FC<BillingHistoryProps> = ({ records }) => {
  const { t } = useTranslation();

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    success: { label: t('billing.success'), color: 'bg-emerald-500/10 text-emerald-400' },
    failed: { label: t('billing.failed'), color: 'bg-red-500/10 text-red-400' },
    refunded: { label: t('billing.refunded'), color: 'bg-slate-500/10 text-slate-400' },
  };

  return (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{t('billing.history')}</h3>

      {records.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">{t('billing.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left py-3 pr-4 font-medium">{t('billing.date')}</th>
                <th className="text-right py-3 px-4 font-medium">{t('billing.amount')}</th>
                <th className="text-center py-3 px-4 font-medium">{t('billing.status')}</th>
                <th className="text-left py-3 pl-4 font-medium">{t('billing.orderId')}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const statusConfig = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.failed;
                return (
                  <tr key={record.id} className="border-b border-white/[0.03] last:border-0">
                    <td className="py-3 pr-4 text-slate-300">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right text-white font-medium">
                      {formatAmount(record.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-slate-500 font-mono text-xs truncate max-w-[180px]" title={record.order_id}>
                      {record.order_id}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
