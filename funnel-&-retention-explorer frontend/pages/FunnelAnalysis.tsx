import React from 'react';
import { Users, Zap, ArrowRight, TrendingUp, TrendingDown } from '../components/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFunnelAnalysis } from '../hooks/useFunnelAnalysis';
import { formatTime } from '../lib/formatters';

export const FunnelAnalysis: React.FC = () => {
  const { funnelResults, hasData, detectedType } = useFunnelAnalysis();

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">데이터 없음</h2>
        <p className="text-slate-400">퍼널 분석을 시작하려면 데이터 가져오기 탭에서 CSV 파일을 업로드하세요.</p>
      </div>
    );
  }

  if (!funnelResults || funnelResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Zap size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">퍼널 단계 설정</h2>
        <p className="text-slate-400">퍼널 에디터 탭에서 퍼널을 설정하고 계산하세요.</p>
      </div>
    );
  }

  const overallConversion = funnelResults.length > 1
    ? ((funnelResults[funnelResults.length - 1].users / funnelResults[0].users) * 100)
    : 100;

  const chartData = funnelResults.map(s => ({
    name: s.step,
    value: s.users,
    rate: s.conversionRate
  }));

  const totalUsers = funnelResults[0]?.users || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">퍼널 분석</h1>
          <p className="text-slate-400 text-sm mt-1">
            {detectedType === 'ecommerce' ? '이커머스' : detectedType === 'subscription' ? '구독' : '커스텀'} 퍼널 시각화 및 이탈 분석
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '총 유입', value: totalUsers.toLocaleString(), icon: Users },
          { label: '전체 전환율', value: overallConversion.toFixed(1) + '%', icon: TrendingUp },
          { label: '최종 단계 사용자', value: funnelResults[funnelResults.length - 1].users.toLocaleString(), icon: Users },
          { label: '단계 수', value: String(funnelResults.length), icon: Zap },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-white/[0.06] rounded-lg p-5 flex flex-col gap-1 hover:border-accent/20 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              <div className="p-1.5 rounded bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                <stat.icon size={18} />
              </div>
            </div>
            <h3 className="text-2xl font-bold font-mono text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Funnel Chart */}
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">전환 퍼널</h3>
              <p className="text-sm text-slate-400">단계별 사용자 여정</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono text-white">{overallConversion.toFixed(1)}%</div>
              <div className="text-accent text-sm font-medium">전체 전환율</div>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={60}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1f28', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '6px' }}
                  formatter={(value: number) => [value.toLocaleString(), '사용자']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`rgba(0, 212, 170, ${1 - (index * 0.15)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Step Details Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-white/[0.06] rounded-lg flex-1 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-base font-semibold text-white">단계 상세</h3>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-white/5 text-xs uppercase font-semibold text-slate-300">
                  <tr>
                    <th className="px-4 py-3">단계</th>
                    <th className="px-4 py-3 text-right">사용자</th>
                    <th className="px-4 py-3 text-right">전환율</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {funnelResults.map((step, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center">{step.stepNumber}</span>
                          <span className="font-medium text-white text-xs">{step.step}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium font-mono">{step.users.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono ${step.conversionRate >= 50 ? 'text-accent' : step.conversionRate >= 25 ? 'text-amber-400' : 'text-coral'}`}>
                          {step.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Median Time */}
          {funnelResults.some(s => s.medianTime) && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-5">
              <h3 className="text-sm font-semibold text-white mb-3">단계 간 중간 시간</h3>
              <div className="space-y-2">
                {funnelResults.slice(1).map((step, i) => (
                  step.medianTime ? (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{funnelResults[i].step} <ArrowRight size={10} className="inline" /> {step.step}</span>
                      <span className="text-white font-medium font-mono">{formatTime(step.medianTime)}</span>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
