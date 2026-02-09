import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { CheckCircle, X, ArrowRight, ChevronDown } from '../components/Icons';
import { PLAN_LIMITS, BILLING_PRICES } from '../lib/planManager';
import { useAuth } from '../context/AuthContext';
import type { BillingCycle } from '../types';

const comparisonFeatures = [
  { name: 'CSV 업로드 행 수', free: `${PLAN_LIMITS.free.csvRows.toLocaleString()}행`, pro: `${PLAN_LIMITS.pro.csvRows.toLocaleString()}행` },
  { name: 'AI 인사이트 (일일)', free: `${PLAN_LIMITS.free.aiCallsPerDay}회`, pro: `${PLAN_LIMITS.pro.aiCallsPerDay}회` },
  { name: '프로젝트 수', free: `${PLAN_LIMITS.free.projects}개`, pro: '무제한' },
  { name: '저장된 분석', free: `${PLAN_LIMITS.free.savedAnalyses}개`, pro: '무제한' },
  { name: '퍼널 분석', free: true, pro: true },
  { name: '리텐션 코호트', free: true, pro: true },
  { name: '세그먼트 비교', free: true, pro: true },
  { name: 'PDF 내보내기', free: false, pro: true },
  { name: '우선 지원', free: false, pro: true },
];

const faqs = [
  { q: '구독은 어떻게 결제되나요?', a: 'TossPayments를 통한 카드 결제로 월간(₩29,000/월) 또는 연간(₩278,400/년, 20% 할인) 중 선택할 수 있습니다.' },
  { q: '언제든 해지할 수 있나요?', a: '네, 언제든 해지할 수 있습니다. 해지 후에도 결제 기간이 끝날 때까지 Pro 기능을 사용할 수 있습니다.' },
  { q: '월간↔연간 전환이 가능한가요?', a: '네. 월간→연간 전환 시 남은 기간의 일할 계산(크레딧)이 적용되어 차액만 결제됩니다. 연간→월간 전환은 다음 갱신일부터 적용됩니다.' },
  { q: '무료 플랜의 제한은 무엇인가요?', a: `무료 플랜은 CSV ${PLAN_LIMITS.free.csvRows.toLocaleString()}행, AI 일 ${PLAN_LIMITS.free.aiCallsPerDay}회, 프로젝트 ${PLAN_LIMITS.free.projects}개로 제한됩니다.` },
  { q: '기존 데이터는 어떻게 되나요?', a: '플랜을 변경해도 기존 데이터는 유지됩니다. 다운그레이드 시 제한을 초과하는 신규 업로드만 제한됩니다.' },
];

const monthlyPerMonth = BILLING_PRICES.monthly;
const annualPerMonth = Math.round(BILLING_PRICES.annual / 12);
const annualSavings = monthlyPerMonth * 12 - BILLING_PRICES.annual;

export const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const isAnnual = billingCycle === 'annual';

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />

      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tightest mb-4">요금제</h1>
        <p className="text-slate-400 max-w-xl mx-auto">무료로 시작하고, 필요할 때 업그레이드하세요.</p>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>월간</span>
          <button
            onClick={() => setBillingCycle(isAnnual ? 'monthly' : 'annual')}
            className={`relative w-12 h-6 rounded-full transition-colors ${isAnnual ? 'bg-accent' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isAnnual ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>연간</span>
          {isAnnual && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-accent/10 text-accent rounded-full">20% OFF</span>
          )}
        </div>
      </section>

      {/* Plan Cards */}
      <section className="pb-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="bg-surface border border-white/[0.06] rounded-lg p-8 flex flex-col">
            <h3 className="text-2xl font-bold text-white">Free</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-mono font-bold text-white">₩0</span>
              <span className="text-slate-400 text-sm ml-1">영구 무료</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {comparisonFeatures.filter(f => f.free).map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle size={16} className="text-accent shrink-0" />
                  {f.name}{typeof f.free === 'string' ? `: ${f.free}` : ''}
                </li>
              ))}
            </ul>
            <Link
              to={user ? '/app/dashboard' : '/signup'}
              className="w-full py-3 text-sm font-semibold text-center bg-white/[0.05] text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {user ? '대시보드로 이동' : '무료로 시작하기'}
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-surface border-2 border-accent/30 rounded-lg p-8 flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider bg-accent text-background rounded-full">
              추천
            </span>
            <h3 className="text-2xl font-bold text-white">Pro</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-mono font-bold text-white">
                ₩{(isAnnual ? annualPerMonth : monthlyPerMonth).toLocaleString()}
              </span>
              <span className="text-slate-400 text-sm ml-1">/월</span>
              {isAnnual && (
                <div className="text-slate-500 text-xs mt-1">₩{BILLING_PRICES.annual.toLocaleString()} 연간 결제</div>
              )}
            </div>
            {isAnnual && (
              <div className="mb-4 px-3 py-1.5 bg-accent/5 border border-accent/10 rounded-md text-xs text-accent font-medium text-center">
                연 ₩{annualSavings.toLocaleString()} 절약
              </div>
            )}
            <ul className="space-y-3 mb-8 flex-1">
              {comparisonFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                  {f.pro ? (
                    <CheckCircle size={16} className="text-accent shrink-0" />
                  ) : (
                    <X size={16} className="text-slate-600 shrink-0" />
                  )}
                  {f.name}{typeof f.pro === 'string' ? `: ${f.pro}` : ''}
                </li>
              ))}
            </ul>
            <Link
              to={user ? `/app/dashboard?billingCycle=${billingCycle}` : '/signup'}
              className="w-full py-3 text-sm font-semibold text-center bg-accent text-background hover:bg-accent/90 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Pro 시작하기
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">상세 비교</h2>
          <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">기능</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-slate-400">Free</th>
                  <th className="text-center px-6 py-4 text-sm font-medium text-accent">Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((f, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td className="px-6 py-3 text-sm text-slate-300">{f.name}</td>
                    <td className="px-6 py-3 text-sm text-center">
                      {typeof f.free === 'string' ? (
                        <span className="text-slate-400">{f.free}</span>
                      ) : f.free ? (
                        <CheckCircle size={16} className="text-accent mx-auto" />
                      ) : (
                        <X size={16} className="text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-center">
                      {typeof f.pro === 'string' ? (
                        <span className="text-white font-medium">{f.pro}</span>
                      ) : f.pro ? (
                        <CheckCircle size={16} className="text-accent mx-auto" />
                      ) : (
                        <X size={16} className="text-slate-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">자주 묻는 질문</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.03] transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-white font-medium pr-4">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} FRE Analytics. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
            <Link to="/terms" className="hover:text-white transition-colors">이용약관</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
