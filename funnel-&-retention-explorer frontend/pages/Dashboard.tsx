import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Info, TrendingUp, Users, Zap, CreditCard, Download, UploadCloud, Sparkles, Filter, ArrowRight } from '../components/Icons';
import { useAppContext } from '../context/AppContext';
import { useExportReport } from '../hooks/useExportReport';
import { formatNum, formatPct, formatCurrency } from '../lib/formatters';

export const Dashboard: React.FC = () => {
  const { state } = useAppContext();
  const { exportReport, exporting } = useExportReport();
  const { processedData, funnelResults, retentionResults, insights, subscriptionKPIs, detectedType, dataQualityReport } = state;

  const hasData = processedData.length > 0;

  // KPIs
  const uniqueUsers = dataQualityReport?.uniqueUsers || 0;
  const totalEvents = processedData.length;

  // Build funnel chart data
  const funnelChartData = funnelResults
    ? funnelResults.map(s => ({ name: s.step, value: s.users }))
    : [];

  const overallConversion = funnelResults && funnelResults.length > 1
    ? ((funnelResults[funnelResults.length - 1].users / funnelResults[0].users) * 100)
    : null;

  // Build retention curve data
  const retentionCurveData = retentionResults && retentionResults.length > 0
    ? (() => {
        const dayKeys = Object.keys(retentionResults[0].days).sort((a, b) => {
          const numA = parseInt(a.replace('D', ''));
          const numB = parseInt(b.replace('D', ''));
          return numA - numB;
        });
        return dayKeys.map(day => {
          const avg = retentionResults.reduce((sum, r) => sum + (r.days[day] || 0), 0) / retentionResults.length;
          return { name: day, value: parseFloat(avg.toFixed(1)) };
        });
      })()
    : [];

  // KPI cards
  const kpiCards = subscriptionKPIs
    ? [
        { label: '전체 사용자', value: formatNum(subscriptionKPIs.users_total), change: detectedType === 'subscription' ? '구독' : '이커머스', positive: true },
        { label: '유료 사용자', value: formatNum(subscriptionKPIs.paid_user_count), change: formatPct(subscriptionKPIs.users_total > 0 ? (subscriptionKPIs.paid_user_count / subscriptionKPIs.users_total) * 100 : 0), positive: true },
        { label: '이탈률', value: formatPct(subscriptionKPIs.cancel_rate_paid), change: `${subscriptionKPIs.cancel_events} events`, positive: subscriptionKPIs.cancel_rate_paid < 10 },
        { label: '매출', value: formatCurrency(subscriptionKPIs.gross_revenue), change: `ARPPU: ${formatCurrency(subscriptionKPIs.arppu)}`, positive: true },
      ]
    : [
        { label: '고유 사용자', value: formatNum(uniqueUsers), change: hasData ? '활성' : '데이터 없음', positive: hasData },
        { label: '전체 이벤트', value: formatNum(totalEvents), change: hasData ? `${state.uniqueEvents.length} 유형` : '데이터 없음', positive: hasData },
        { label: '전환율', value: overallConversion != null ? overallConversion.toFixed(1) + '%' : 'N/A', change: funnelResults ? `${funnelResults.length} 단계` : '미계산', positive: overallConversion != null && overallConversion > 20 },
        { label: '데이터 유형', value: detectedType === 'ecommerce' ? '이커머스' : detectedType === 'subscription' ? '구독' : 'N/A', change: hasData ? '감지됨' : '데이터 업로드', positive: detectedType !== null },
      ];

  const navigate = useNavigate();

  // Empty state — show CTA instead of empty charts
  if (!hasData) {
    const featureCards = [
      { icon: Filter, title: '퍼널 분석', desc: '다단계 전환 퍼널로 이탈 지점을 발견하세요', gradient: 'from-accent to-teal-500' },
      { icon: Users, title: '리텐션 코호트', desc: '코호트별 사용자 리텐션을 시각화합니다', gradient: 'from-sky-400 to-blue-500' },
      { icon: Zap, title: 'AI 인사이트', desc: 'Gemini AI가 실행 가능한 인사이트를 생성합니다', gradient: 'from-coral to-pink-500' },
    ];

    return (
      <div className="space-y-6">
        {/* Hero CTA */}
        <div className="bg-surface border border-white/[0.06] rounded-lg p-10 md:p-14 relative overflow-hidden text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/15 rounded-full blur-[150px] pointer-events-none" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
              CSV 데이터를 분석해보세요
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto mb-8">
              퍼널, 리텐션, 세그먼트, AI 인사이트까지 — 하나의 대시보드에서 모두 가능합니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/app/upload?sample=ecommerce')}
                className="group px-6 py-3 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                샘플 데이터로 체험
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/app/upload')}
                className="px-6 py-3 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-white/20 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <UploadCloud size={16} />
                CSV 파일 업로드
              </button>
            </div>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featureCards.map((f, i) => (
            <div
              key={i}
              className={`bg-surface border border-white/[0.06] rounded-lg p-6 hover:bg-white/[0.03] transition-all duration-300 group animate-fade-up delay-${(i + 1) * 100}`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon size={20} className="text-white" />
              </div>
              <h3 className="text-white font-bold mb-1">{f.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={exportReport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
        >
          <Download size={16} />
          {exporting ? '내보내는 중...' : '리포트 내보내기'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className={`bg-surface border border-white/[0.06] rounded-lg p-6 hover:bg-white/5 hover:-translate-y-0.5 transition-all duration-200 animate-fade-up delay-${(i + 1) * 100}`}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-slate-400 text-sm font-medium">{kpi.label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${kpi.positive ? 'bg-accent/10 text-accent' : 'bg-coral/10 text-coral'}`}>
                {kpi.change}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Funnel Section */}
      {funnelChartData.length > 0 ? (
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                퍼널 이탈 분석
                <Info size={16} className="text-slate-500 cursor-help" />
              </h3>
              <p className="text-slate-400 text-sm">{funnelResults?.length || 0}단계 퍼널 분석</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono text-white">{overallConversion?.toFixed(1)}%</div>
              <div className="text-accent text-sm font-medium">전체 전환율</div>
            </div>
          </div>

          <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelChartData} barSize={60}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1f28', borderColor: 'rgba(255,255,255,0.06)', color: '#fff' }}
                  formatter={(value: number) => [value.toLocaleString(), '사용자']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {funnelChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`rgba(0, 212, 170, ${1 - (index * 0.15)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
        </div>
      ) : (
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
          <Zap size={32} className="text-slate-600 mb-2" />
          <p className="text-slate-400 text-sm">퍼널 분석 탭에서 퍼널을 계산하면 여기에 결과가 표시됩니다.</p>
        </div>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Insights */}
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">최근 인사이트</h3>
            <span className="text-xs text-slate-500">{insights.length} 전체</span>
          </div>
          <div className="space-y-4">
            {insights.length === 0 ? (
              <p className="text-slate-500 text-sm">아직 인사이트가 없습니다. 데이터를 처리하면 인사이트가 생성됩니다.</p>
            ) : (
              insights.slice(0, 4).map((insight, i) => {
                const colors: Record<string, { text: string; bg: string }> = {
                  danger: { text: 'text-coral', bg: 'bg-coral/10' },
                  warning: { text: 'text-amber', bg: 'bg-amber/10' },
                  success: { text: 'text-accent', bg: 'bg-accent/10' },
                  info: { text: 'text-sky-400', bg: 'bg-sky-400/10' },
                };
                const c = colors[insight.type] || colors.info;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>
                      <span className="text-sm">{insight.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{insight.title}</h4>
                      <p className="text-xs text-slate-400 truncate">{insight.body}</p>
                    </div>
                    {insight.metric && (
                      <span className="text-xs text-accent font-bold font-mono shrink-0">{insight.metric}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* User Retention Chart */}
        <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white">리텐션 곡선</h3>
          </div>
          {retentionCurveData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={retentionCurveData}>
                  <defs>
                    <linearGradient id="colorValueDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f28', borderColor: 'rgba(255,255,255,0.06)', color: '#fff' }}
                    formatter={(value: number) => [`${value}%`, '리텐션']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00d4aa" strokeWidth={3} fillOpacity={1} fill="url(#colorValueDash)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-slate-500 text-sm">리텐션을 계산하면 곡선이 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
