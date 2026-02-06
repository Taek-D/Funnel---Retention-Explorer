import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LandingHeader } from '../components/LandingHeader';
import { Eye, EyeOff } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await signIn(email, password);
      if (authError) {
        setError(authError.message);
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setError(err.message || '로그인 실패');
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
              사용자를<br />이해하세요.
            </h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">CSV에서 인사이트까지 몇 분이면 충분합니다. 설정도, SQL도, 엔지니어링 팀도 필요 없습니다.</p>
            <div className="flex items-center justify-center gap-6 mt-12">
              {['퍼널', '리텐션', '세그먼트', 'AI'].map((t, i) => (
                <React.Fragment key={t}>
                  {i > 0 && <span className="w-px h-4 bg-white/[0.06]" />}
                  <span className="text-[11px] font-mono text-slate-600 uppercase tracking-wider">{t}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1 flex items-center justify-center px-6 pt-16 lg:border-l lg:border-white/[0.06]">
          <div className="w-full max-w-sm animate-fade-up">
            <h1 className="text-2xl font-extrabold text-white tracking-tightest mb-1">다시 오신 것을 환영합니다</h1>
            <p className="text-slate-500 text-sm mb-8">계정에 로그인하세요</p>

            {error && (
              <div className="mb-4 p-3 bg-coral/5 border border-coral/20 rounded-md text-coral text-sm animate-fade-in">
                {error}
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
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                    로그인 중...
                  </span>
                ) : '로그인'}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-slate-600 font-mono">또는</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <Link
              to="/app/dashboard"
              className="mt-4 block w-full py-2.5 text-sm font-medium text-slate-400 text-center bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:text-white rounded-md transition-all"
            >
              게스트로 계속하기
            </Link>

            <p className="mt-8 text-center text-[13px] text-slate-600">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-accent hover:text-accent/80 font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
