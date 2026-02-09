import React from 'react';
import type { BillingRecord } from '../lib/planManager';

interface BillingHistoryProps {
  records: BillingRecord[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  success: { label: '성공', color: 'bg-emerald-500/10 text-emerald-400' },
  failed: { label: '실패', color: 'bg-red-500/10 text-red-400' },
  refunded: { label: '환불', color: 'bg-slate-500/10 text-slate-400' },
};

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
  return (
    <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">결제 내역</h3>

      {records.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">결제 내역이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left py-3 pr-4 font-medium">날짜</th>
                <th className="text-right py-3 px-4 font-medium">금액</th>
                <th className="text-center py-3 px-4 font-medium">상태</th>
                <th className="text-left py-3 pl-4 font-medium">주문번호</th>
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
