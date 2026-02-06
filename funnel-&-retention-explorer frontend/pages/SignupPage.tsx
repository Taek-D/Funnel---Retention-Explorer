import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { useAuth } from '../context/AuthContext';
import { CheckCircle } from '../components/Icons';

const EyeIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, label: '', color: '' };
    if (password.length < 6) return { level: 1, label: '너무 짧음', color: 'bg-coral' };
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [password.length >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score <= 1) return { level: 2, label: '약함', color: 'bg-coral' };
    if (score <= 2) return { level: 3, label: '보통', color: 'bg-amber' };
    return { level: 4, label: '강함', color: 'bg-accent' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await signUp(email, password);
      if (authError) {
        setError(authError.message);
      } else {
        setSuccess('계정이 생성되었습니다! 이메일에서 확인 링크를 클릭한 후 로그인하세요.');
      }
    } catch (err: any) {
      setError(err.message || '회원가입 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />

      <div className="flex min-h-screen">
        {/* Left: Branding panel — desktop only */}
        <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 dot-grid pointer-events-none" />
          <div className="relative text-center px-12">
            <div className="text-accent font-mono text-sm mb-4 tracking-wider">FRE ANALYTICS</div>
            <h2 className="text-4xl font-extrabold tracking-tightest leading-tight mb-4">
              몇 분 안에<br />분석을 시작하세요.
            </h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">기본 분석은 영구 무료입니다. 신용카드가 필요 없습니다.</p>
            <div className="mt-12 space-y-3 text-left max-w-xs mx-auto">
              {['CSV 업로드 및 컬럼 자동 감지', '드래그 앤 드롭으로 퍼널 구축', 'Gemini 기반 AI 인사이트'].map((text, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[13px] text-slate-500">
                  <CheckCircle size={14} className="text-accent shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1 flex items-center justify-center px-6 pt-16 lg:border-l lg:border-white/[0.06]">
          <div className="w-full max-w-sm animate-fade-up">
            <h1 className="text-2xl font-extrabold text-white tracking-tightest mb-1">계정 만들기</h1>
            <p className="text-slate-500 text-sm mb-8">무료로 데이터 분석을 시작하세요</p>

            {error && (
              <div className="mb-4 p-3 bg-coral/5 border border-coral/20 rounded-md text-coral text-sm animate-fade-in">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-accent/5 border border-accent/20 rounded-md animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <CheckCircle size={16} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-accent text-sm font-medium">{success}</p>
                    <Link to="/login" className="text-accent/70 hover:text-accent text-sm mt-1 inline-block">
                      로그인으로 이동
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">이메일</label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent border-b border-white/10 px-0 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent border-b border-white/10 px-0 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent transition-colors"
                    placeholder="6자 이상"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map(n => (
                        <div
                          key={n}
                          className={`h-0.5 flex-1 rounded-full transition-all ${
                            n <= passwordStrength.level ? passwordStrength.color : 'bg-white/[0.06]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-600 font-mono">{passwordStrength.label}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full bg-transparent border-b px-0 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-coral/50 focus:border-coral'
                        : confirmPassword && confirmPassword === password
                        ? 'border-accent/50 focus:border-accent'
                        : 'border-white/10 focus:border-accent'
                    }`}
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  {confirmPassword && confirmPassword === password && (
                    <CheckCircle size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-accent" />
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    계정 생성 중...
                  </span>
                ) : '계정 만들기'}
              </button>
            </form>

            <p className="mt-8 text-center text-[13px] text-slate-600">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-accent hover:text-accent/80 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
