import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { Filter, Users, BarChart2, Zap, CheckCircle, ArrowRight, ChevronDown } from '../components/Icons';

const features = [
  {
    icon: Filter,
    title: '퍼널 분석',
    desc: 'CSV 데이터로 다단계 전환 퍼널을 구축하세요. 이탈 지점을 파악하고 사용자 여정을 최적화할 수 있습니다.',
    gradient: 'from-accent to-teal-500',
  },
  {
    icon: Users,
    title: '리텐션 코호트',
    desc: '코호트 테이블로 사용자 리텐션을 시각화하세요. 사용자가 언제, 왜 이탈하는지 파악할 수 있습니다.',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    icon: BarChart2,
    title: '세그먼트 비교',
    desc: '플랫폼, 채널 등 다양한 차원에서 세그먼트를 비교하고 통계적 유의성을 검증합니다.',
    gradient: 'from-amber to-orange-500',
  },
  {
    icon: Zap,
    title: 'AI 인사이트',
    desc: 'Gemini AI 기반의 즉각적이고 실행 가능한 인사이트를 받아보세요. 수동으로 데이터를 분석할 필요가 없습니다.',
    gradient: 'from-coral to-pink-500',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '₩0',
    period: '영구 무료',
    features: ['프로젝트 1개', 'CSV 업로드 5만 행까지', '퍼널 & 리텐션 분석', '기본 인사이트'],
    cta: '시작하기',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₩39,000',
    period: '/월',
    features: ['프로젝트 무제한', 'CSV 업로드 100만 행까지', 'AI 기반 인사이트', '세그먼트 비교', 'PDF 내보내기', '우선 지원'],
    cta: '출시 예정',
    highlight: true,
  },
  {
    name: 'Team',
    price: '₩99,000',
    period: '/월',
    features: ['Pro의 모든 기능', '팀 협업', '공유 대시보드', 'API 접근', '커스텀 연동', '전담 지원'],
    cta: '출시 예정',
    highlight: false,
  },
];

const faqs = [
  { q: '데이터베이스 설정이 필요한가요?', a: '아닙니다. FRE는 CSV 파일로 작동합니다. 데이터를 업로드하고 바로 분석을 시작하세요. 계정을 만들면 데이터가 안전하게 클라우드에 저장됩니다.' },
  { q: '어떤 데이터 형식을 지원하나요?', a: '현재 타임스탬프, 사용자 ID, 이벤트명 컬럼이 있는 CSV 파일을 지원합니다. 이커머스 및 구독 데이터의 컬럼 매핑을 자동으로 감지합니다.' },
  { q: '데이터는 안전한가요?', a: '네. 데이터는 브라우저에서 처리됩니다. 클라우드에 저장할 경우 암호화되며 행 수준 보안(RLS)으로 본인만 접근할 수 있습니다.' },
  { q: '회원가입 없이 사용할 수 있나요?', a: '물론입니다. 앱에 접속해서 CSV를 업로드하면 됩니다. 기본 분석에는 계정이 필요하지 않습니다.' },
];

const stats = [
  { label: '분석된 데이터 포인트', value: '1,000만+' },
  { label: '활성 사용자', value: '500+' },
  { label: '평균 설정 시간', value: '<2분' },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const featuresView = useInView();
  const pricingView = useInView();
  const faqView = useInView();

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Background blurs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-accent/20 rounded-full blur-[200px] opacity-40 pointer-events-none animate-glow-pulse" />
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-sky-400/15 rounded-full blur-[150px] opacity-30 pointer-events-none animate-float" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 mb-6 text-[11px] font-mono font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 rounded-full animate-fade-up">
            오픈 분석 플랫폼
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tightest mb-6 animate-fade-up delay-100">
            퍼널 & 리텐션
            <br />
            <span className="text-accent">
              탐색기
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
            CSV를 업로드하세요. 퍼널 구축, 리텐션 코호트 분석, 세그먼트 비교, AI 인사이트까지 — 하나의 강력한 대시보드에서 모두 가능합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
            <Link
              to="/app/dashboard"
              className="group px-8 py-3.5 text-base font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              가입 없이 체험하기
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3.5 text-base font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-white/20 rounded-lg transition-all hover:-translate-y-0.5"
            >
              무료 계정 만들기
            </Link>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 animate-fade-up delay-400">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-mono font-bold text-white">{s.value}</div>
                <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" ref={featuresView.ref}>
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 ${featuresView.visible ? 'animate-fade-up' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">사용자 행동 분석에 필요한 모든 것</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">CSV에서 실행 가능한 인사이트까지 몇 분이면 충분합니다. SQL도, ETL도, 엔지니어링 팀도 필요 없습니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className={`bg-surface border border-white/[0.06] p-8 rounded-lg hover:bg-white/[0.03] transition-all duration-300 group hover:-translate-y-1 ${
                  featuresView.visible ? `animate-fade-up delay-${(i + 1) * 100}` : 'opacity-0'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300`}>
                  <f.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6" ref={pricingView.ref}>
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 ${pricingView.visible ? 'animate-fade-up' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">간단하고 투명한 요금제</h2>
            <p className="text-slate-400 text-sm">무료로 시작하세요. 더 강력한 기능이 필요할 때 업그레이드하세요.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-lg p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? 'bg-surface border-2 border-accent/30 relative'
                    : 'bg-surface border border-white/[0.06] hover:border-white/10'
                } ${pricingView.visible ? `animate-fade-up delay-${(i + 1) * 100}` : 'opacity-0'}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider bg-accent text-background rounded-full">
                    가장 인기
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-mono font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <CheckCircle size={16} className="text-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.cta === '출시 예정' ? (
                  <button
                    disabled
                    className="w-full py-3 text-sm font-medium text-slate-600 bg-white/[0.03] border border-white/[0.06] rounded-lg cursor-not-allowed"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    to="/signup"
                    className={`w-full py-3 text-sm font-semibold text-center rounded-lg transition-colors ${
                      plan.highlight
                        ? 'bg-accent text-background hover:bg-accent/90'
                        : 'bg-white/[0.05] text-white hover:bg-white/10'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6" ref={faqView.ref}>
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-3xl md:text-4xl font-extrabold text-white text-center tracking-tightest mb-12 ${faqView.visible ? 'animate-fade-up' : 'opacity-0'}`}>
            자주 묻는 질문
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`bg-surface border border-white/[0.06] rounded-lg overflow-hidden ${faqView.visible ? `animate-fade-up delay-${(i + 1) * 100}` : 'opacity-0'}`}
              >
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
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: openFaq === i ? '200px' : '0px',
                    opacity: openFaq === i ? 1 : 0,
                  }}
                >
                  <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-surface border border-white/[0.06] rounded-lg p-12 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tightest mb-4">데이터를 탐색할 준비가 되셨나요?</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">FRE Analytics로 사용자를 더 잘 이해하는 수백 개의 프로덕트 팀에 합류하세요.</p>
            <Link
              to="/app/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all hover:-translate-y-0.5"
            >
              무료로 시작하기
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
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
            <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-white transition-colors">이용약관</a>
            <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
