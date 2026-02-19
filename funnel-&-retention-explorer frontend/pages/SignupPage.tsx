import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LandingHeader } from '../components/LandingHeader';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Eye, EyeOff } from '../components/Icons';
import { trackEvent } from '../lib/analytics';

export const SignupPage: React.FC = () => {
  const { t } = useTranslation('pages');
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
    if (password.length < 6) return { level: 1, label: t('signup.strengthTooShort'), color: 'bg-coral' };
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [password.length >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score <= 1) return { level: 2, label: t('signup.strengthWeak'), color: 'bg-coral' };
    if (score <= 2) return { level: 3, label: t('signup.strengthMedium'), color: 'bg-amber' };
    return { level: 4, label: t('signup.strengthStrong'), color: 'bg-accent' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError(t('signup.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('signup.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await signUp(email, password);
      if (authError) {
        setError(t('signup.genericError'));
      } else {
        setSuccess(t('signup.success'));
        trackEvent('signup_success');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('signup.failed'));
    } finally {
      setLoading(false);
    }
  };

  const brandFeatures = [
    t('signup.brandFeature1'),
    t('signup.brandFeature2'),
    t('signup.brandFeature3'),
  ];

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
              {t('signup.brandTitle').split('\n').map((line, i, arr) => (
                <React.Fragment key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">{t('signup.brandDesc')}</p>
            <div className="mt-12 space-y-3 text-left max-w-xs mx-auto">
              {brandFeatures.map((text, i) => (
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
            <h1 className="text-2xl font-extrabold text-white tracking-tightest mb-1">{t('signup.title')}</h1>
            <p className="text-slate-500 text-sm mb-8">{t('signup.subtitle')}</p>

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
                      {t('signup.goToLogin')}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">{t('signup.email')}</label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  maxLength={254}
                  className="w-full bg-transparent border-b border-white/10 px-0 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">{t('signup.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    maxLength={128}
                    className="w-full bg-transparent border-b border-white/10 px-0 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent transition-colors"
                    placeholder={t('signup.passwordPlaceholder')}
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
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">{t('signup.confirmPassword')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    maxLength={128}
                    className={`w-full bg-transparent border-b px-0 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-coral/50 focus:border-coral'
                        : confirmPassword && confirmPassword === password
                        ? 'border-accent/50 focus:border-accent'
                        : 'border-white/10 focus:border-accent'
                    }`}
                    placeholder={t('signup.confirmPlaceholder')}
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
                    {t('signup.submitting')}
                  </span>
                ) : t('signup.submit')}
              </button>
            </form>

            <p className="mt-8 text-center text-[13px] text-slate-600">
              {t('signup.hasAccount')}{' '}
              <Link to="/login" className="text-accent hover:text-accent/80 font-medium">
                {t('signup.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
