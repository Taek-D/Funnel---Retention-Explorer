import React, { useState } from 'react';
import { Download, TrendingUp, TrendingDown, Users, MoreHorizontal } from '../components/Icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRetentionAnalysis } from '../hooks/useRetentionAnalysis';

export const RetentionAnalysis: React.FC = () => {
  const {
    retentionResults, retentionType, uniqueEvents, detectedType, hasData,
    setRetentionType, runRetentionAnalysis
  } = useRetentionAnalysis();

  const [cohortEvent, setCohortEvent] = useState('');
  const [selectedActiveEvents, setSelectedActiveEvents] = useState<string[]>([]);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Users size={48} className="text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Data Available</h2>
        <p className="text-slate-400">Upload a CSV file in the Data Import tab to begin retention analysis.</p>
      </div>
    );
  }

  const isPaid = retentionType === 'paid';
  const dayColumns = isPaid
    ? ['D0', 'D7', 'D14', 'D30', 'D60', 'D90']
    : Array.from({ length: 15 }, (_, i) => `D${i}`);

  // Calculate averages
  const avgRetention: Record<string, number> = {};
  if (retentionResults && retentionResults.length > 0) {
    dayColumns.forEach(day => {
      avgRetention[day] = retentionResults.reduce((sum, r) => sum + (r.days[day] || 0), 0) / retentionResults.length;
    });
  }

  // Curve data for chart
  const curveData = retentionResults && retentionResults.length > 0
    ? dayColumns.map((day, i) => ({
        day: day.replace('D', 'Day '),
        value: parseFloat(avgRetention[day]?.toFixed(1) || '0')
      }))
    : [];

  const handleCalculate = () => {
    runRetentionAnalysis(cohortEvent, selectedActiveEvents);
  };

  const toggleActiveEvent = (event: string) => {
    setSelectedActiveEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Cohort Analysis
          </div>
          <h1 className="text-3xl font-bold text-white">Retention Analysis</h1>
          <p className="text-slate-400 text-sm max-w-xl mt-1">
            Analyze user engagement over time via cohort heatmaps.
          </p>
        </div>
      </div>

      {/* Retention Type Toggle (for subscription data) */}
      {detectedType === 'subscription' && (
        <div className="flex items-center gap-2 bg-surface/50 border border-white/5 p-1 rounded-xl w-fit">
          <button
            onClick={() => setRetentionType('activity')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!isPaid ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Activity Retention
          </button>
          <button
            onClick={() => setRetentionType('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isPaid ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Paid Retention
          </button>
        </div>
      )}

      {/* Controls for Activity Retention */}
      {!isPaid && (
        <div className="glass rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Cohort Event</label>
              <select
                className="w-full bg-background border border-white/10 text-white text-sm rounded-lg p-3"
                value={cohortEvent}
                onChange={e => setCohortEvent(e.target.value)}
              >
                <option value="">이벤트 선택...</option>
                {uniqueEvents.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Active Events (multi-select)</label>
              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-2 bg-background border border-white/10 rounded-lg">
                {uniqueEvents.map(e => (
                  <button
                    key={e}
                    onClick={() => toggleActiveEvent(e)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      selectedActiveEvents.includes(e) ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleCalculate}
            className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/25 transition-all"
          >
            Calculate Retention
          </button>
        </div>
      )}

      {/* Paid Retention: Just a button */}
      {isPaid && !retentionResults && (
        <button
          onClick={() => runRetentionAnalysis('', [])}
          className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-lg shadow-primary/25 transition-all"
        >
          Calculate Paid Retention
        </button>
      )}

      {/* Stats Cards */}
      {retentionResults && retentionResults.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(isPaid
              ? [
                  { title: 'D7 Retention', value: avgRetention.D7, color: 'text-primary' },
                  { title: 'D14 Retention', value: avgRetention.D14, color: 'text-blue-400' },
                  { title: 'D30 Retention', value: avgRetention.D30, color: 'text-orange-400' },
                ]
              : [
                  { title: 'D1 Retention', value: avgRetention.D1, color: 'text-primary' },
                  { title: 'D7 Retention', value: avgRetention.D7, color: 'text-blue-400' },
                  { title: 'D14 Retention', value: avgRetention.D14, color: 'text-orange-400' },
                ]
            ).map((stat, i) => (
              <div key={i} className="glass rounded-2xl p-6 relative group overflow-hidden">
                <div className={`absolute -right-6 -top-6 w-32 h-32 ${i === 0 ? 'bg-primary/20' : i === 1 ? 'bg-blue-500/20' : 'bg-orange-500/20'} blur-[50px] rounded-full`}></div>
                <div className="relative z-10">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</p>
                  <h3 className="text-4xl font-bold text-white">{stat.value?.toFixed(1) || '0'}%</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Cohort Table */}
          <div className="glass rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/5">
                <tr>
                  <th className="px-6 py-4 min-w-[140px] sticky left-0 bg-[#151a2d]">
                    {isPaid ? 'Subscribe Date' : 'Cohort Date'}
                  </th>
                  <th className="px-4 py-4 text-center">Size</th>
                  {dayColumns.map(day => (
                    <th key={day} className="px-2 py-4 text-center min-w-[60px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {retentionResults.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 font-medium text-white sticky left-0 bg-[#151a2d] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">{row.cohortDate}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.cohortSize.toLocaleString()}</td>
                    {dayColumns.map((day) => {
                      const rate = row.days[day] || 0;
                      const opacity = rate / 100;
                      return (
                        <td key={day} className="px-2 py-2 text-center">
                          <div
                            className="rounded py-1.5 text-xs font-medium w-full border border-white/5"
                            style={{
                              backgroundColor: `rgba(99, 102, 241, ${opacity})`,
                              color: rate > 50 ? 'white' : 'rgba(255,255,255,0.7)'
                            }}
                          >
                            {rate.toFixed(0)}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Curve Chart */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary"><TrendingUp size={20} /></div>
                <div>
                  <h3 className="text-lg font-bold text-white">Average Retention Curve</h3>
                  <p className="text-xs text-slate-400">Aggregated retention rate across all cohorts</p>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curveData}>
                  <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value}%`, 'Retention']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="url(#curveGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
