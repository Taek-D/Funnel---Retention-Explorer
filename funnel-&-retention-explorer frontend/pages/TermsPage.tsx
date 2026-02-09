import React from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tightest mb-2">이용약관</h1>
          <p className="text-slate-500 text-sm mb-12">시행일: 2026년 2월 9일</p>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. 목적</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                본 약관은 FRE Analytics(이하 "서비스")의 이용과 관련하여 서비스 제공자와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. 용어 정의</h2>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1.5 ml-2">
                <li><span className="text-slate-300">"서비스"</span>란 FRE Analytics가 제공하는 CSV 기반 퍼널/리텐션/세그먼트 분석 웹 애플리케이션을 말합니다.</li>
                <li><span className="text-slate-300">"이용자"</span>란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
                <li><span className="text-slate-300">"게스트"</span>란 회원가입 없이 서비스의 기본 기능을 이용하는 자를 말합니다.</li>
                <li><span className="text-slate-300">"회원"</span>이란 서비스에 가입하여 계정을 보유한 이용자를 말합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. 서비스 이용</h2>
              <h3 className="text-base font-semibold text-slate-200 mb-2">3-1. 계정 생성</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                서비스의 일부 기능(데이터 저장, AI 인사이트 등)은 회원가입 후 이용할 수 있습니다.
                이용자는 정확한 정보를 제공하여야 하며, 타인의 정보를 도용하여서는 안 됩니다.
              </p>
              <h3 className="text-base font-semibold text-slate-200 mb-2">3-2. 게스트 이용</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                회원가입 없이도 CSV 업로드, 퍼널 분석, 리텐션 분석 등 기본 기능을 이용할 수 있습니다.
                게스트 모드에서는 데이터가 브라우저에서만 처리되며 서버에 저장되지 않습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. 요금 및 결제</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                서비스는 무료(Free) 플랜과 유료(Pro) 플랜으로 운영됩니다.
                유료 플랜의 요금, 결제 방법, 환불 정책은 서비스 내 요금 안내 페이지에서 확인할 수 있습니다.
                유료 플랜은 추후 제공될 예정입니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. 데이터 소유권</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                이용자가 업로드한 CSV 데이터 및 분석 결과의 소유권은 이용자에게 있습니다.
                서비스는 이용자의 데이터를 서비스 제공 목적 외에 사용하지 않습니다.
                이용자는 언제든지 자신의 데이터를 삭제할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. 서비스 제한 사항</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                이용자는 다음 행위를 하여서는 안 됩니다.
              </p>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1.5 ml-2">
                <li>서비스의 안정적 운영을 방해하는 행위</li>
                <li>타인의 개인정보를 무단으로 수집, 이용하는 행위</li>
                <li>서비스를 이용하여 불법적인 활동을 하는 행위</li>
                <li>API를 무단으로 호출하거나 서비스를 자동화하여 과도한 트래픽을 발생시키는 행위</li>
                <li>서비스의 버그나 취약점을 악의적으로 이용하는 행위</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. 면책 조항</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                서비스는 이용자가 업로드한 데이터의 정확성을 보증하지 않으며, 분석 결과는 참고 목적으로만 제공됩니다.
                AI 인사이트는 자동 생성된 것으로, 비즈니스 의사결정에 대한 최종 책임은 이용자에게 있습니다.
                천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해서는 책임을 지지 않습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. 서비스 변경 및 중단</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                서비스는 운영상 필요한 경우 사전 공지 후 서비스 내용을 변경하거나 중단할 수 있습니다.
                서비스 변경 시 변경 내용과 시행일을 서비스 내 공지사항 또는 이메일로 안내합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. 분쟁 해결</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                본 약관과 관련된 분쟁은 대한민국 법률에 따라 해결하며,
                소송이 필요한 경우 서비스 제공자의 소재지 관할 법원을 전속 관할 법원으로 합니다.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.06]">
            <Link to="/" className="text-accent text-sm hover:underline">&larr; 홈으로 돌아가기</Link>
          </div>
        </div>
      </main>
    </div>
  );
};
