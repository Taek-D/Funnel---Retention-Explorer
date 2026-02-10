import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageLoader } from '../components/PageLoader';

export const SharedReport: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const { getSharedSnapshot } = await import('../lib/supabaseData');
        const data = await getSharedSnapshot(token);
        if (!data) {
          setError('공유된 리포트를 찾을 수 없습니다.');
        } else {
          setSnapshot(data.results);
        }
      } catch {
        setError('리포트를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <PageLoader />;

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">리포트를 찾을 수 없습니다</h1>
          <p className="text-slate-400">{error || '잘못된 링크이거나 공유가 해제되었습니다.'}</p>
          <a
            href="/"
            className="inline-block mt-6 px-6 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all"
          >
            홈으로 이동
          </a>
        </div>
      </div>
    );
  }

  const results = snapshot as Record<string, unknown>;
  const funnelResults = results.funnelResults as { step: string; users: number; conversionRate: number }[] | undefined;
  const retentionResults = results.retentionResults as { cohort: string; users: number; days: Record<string, number> }[] | undefined;
  const insightsList = results.insights as { type: string; title: string; body: string }[] | undefined;

  const typeColors: Record<string, string> = {
    success: 'bg-accent/10 text-accent',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-coral/10 text-coral',
    info: 'bg-sky-400/10 text-sky-400',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-accent font-bold text-lg hover:opacity-80 transition-opacity">FRE Analytics</a>
          <span className="text-xs text-slate-500">공유 리포트 (읽기 전용)</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Funnel */}
        {funnelResults && funnelResults.length > 0 && (
          <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">퍼널 분석</h2>
            {funnelResults.length > 1 && (
              <p className="text-sm text-slate-400 mb-4">
                전체 전환율: <span className="text-accent font-bold">
                  {((funnelResults[funnelResults.length - 1].users / funnelResults[0].users) * 100).toFixed(1)}%
                </span>
              </p>
            )}
            <div className="space-y-3">
              {funnelResults.map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm text-slate-300 w-40 truncate">{step.step}</span>
                  <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full bg-accent/60 rounded"
                      style={{ width: `${step.conversionRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-28 text-right font-mono">
                    {step.users.toLocaleString()} ({step.conversionRate.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retention */}
        {retentionResults && retentionResults.length > 0 && (
          <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">리텐션</h2>
            <p className="text-sm text-slate-400">{retentionResults.length}개 코호트 분석</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-slate-400 pb-2 pr-4">코호트</th>
                    <th className="text-right text-slate-400 pb-2 pr-4">사용자</th>
                    {Object.keys(retentionResults[0]?.days || {}).sort((a, b) =>
                      parseInt(a.replace('D', '')) - parseInt(b.replace('D', ''))
                    ).slice(0, 8).map(day => (
                      <th key={day} className="text-right text-slate-400 pb-2 px-2">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {retentionResults.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      <td className="text-slate-300 py-2 pr-4">{row.cohort}</td>
                      <td className="text-right text-white font-mono py-2 pr-4">{row.users}</td>
                      {Object.keys(row.days).sort((a, b) =>
                        parseInt(a.replace('D', '')) - parseInt(b.replace('D', ''))
                      ).slice(0, 8).map(day => (
                        <td key={day} className="text-right text-slate-400 font-mono py-2 px-2">
                          {row.days[day]?.toFixed(1)}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights */}
        {insightsList && insightsList.length > 0 && (
          <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">인사이트</h2>
            <div className="space-y-3">
              {insightsList.map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeColors[item.type] || typeColors.info}`}>
                      {item.type.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-white">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 ml-0.5">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-white/[0.06] bg-surface mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <p className="text-slate-400 text-sm mb-3">나도 퍼널·리텐션 분석이 필요하다면?</p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all"
          >
            FRE Analytics 시작하기
          </a>
        </div>
      </div>
    </div>
  );
};
