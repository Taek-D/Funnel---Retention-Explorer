import React from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tightest mb-2">개인정보처리방침</h1>
          <p className="text-slate-500 text-sm mb-12">시행일: 2026년 2월 9일</p>

          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. 개인정보 수집 항목</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                FRE Analytics(이하 "서비스")는 다음과 같은 개인정보를 수집합니다.
              </p>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1.5 ml-2">
                <li><span className="text-slate-300">회원가입 시:</span> 이메일 주소, 비밀번호(암호화 저장)</li>
                <li><span className="text-slate-300">서비스 이용 시:</span> 업로드된 CSV 데이터(클라우드 저장 선택 시), 분석 결과</li>
                <li><span className="text-slate-300">자동 수집:</span> 접속 IP, 브라우저 종류, 접속 시간</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. 개인정보 수집 및 이용 목적</h2>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1.5 ml-2">
                <li>회원 관리: 본인 확인, 계정 인증</li>
                <li>서비스 제공: 데이터 분석 기능, 분석 결과 저장 및 조회</li>
                <li>서비스 개선: 이용 통계 분석, 오류 모니터링</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. 개인정보 보유 및 이용 기간</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
                게스트 모드로 이용 시 데이터는 브라우저에서만 처리되며 서버에 저장되지 않습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. 개인정보 제3자 제공</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                서비스 운영을 위해 다음 제3자에게 개인정보를 제공합니다.
              </p>
              <div className="bg-surface border border-white/[0.06] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">제공받는 자</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">목적</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">항목</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-white/[0.06]">
                      <td className="px-4 py-3">Supabase (미국)</td>
                      <td className="px-4 py-3">인증, 데이터 저장</td>
                      <td className="px-4 py-3">이메일, 분석 데이터</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Google Gemini AI (미국)</td>
                      <td className="px-4 py-3">AI 인사이트 분석</td>
                      <td className="px-4 py-3">분석 데이터 요약 (AI 요청 시)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. 개인정보 파기 절차</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                회원 탈퇴 요청 시 개인정보는 즉시 파기됩니다. 전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제하며,
                종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. 이용자의 권리</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-3">
                이용자는 언제든지 다음 권리를 행사할 수 있습니다.
              </p>
              <ul className="list-disc list-inside text-slate-400 text-sm space-y-1.5 ml-2">
                <li>개인정보 열람 요구</li>
                <li>개인정보 수정 요구</li>
                <li>개인정보 삭제 요구</li>
                <li>개인정보 처리 정지 요구</li>
              </ul>
              <p className="text-slate-400 text-sm mt-3">
                권리 행사는 앱 내 계정 설정 또는 이메일로 요청할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. 쿠키 사용</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                서비스는 인증 세션 유지를 위해 쿠키를 사용합니다. 브라우저 설정에서 쿠키를 거부할 수 있으나,
                이 경우 로그인이 필요한 일부 기능의 사용이 제한될 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. 개인정보 보호 책임자</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                개인정보 관련 문의사항은 아래로 연락해 주세요.
              </p>
              <p className="text-slate-400 text-sm mt-2">
                이메일: support@fre-analytics.com
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
