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
    if (password.length < 6) return { level: 1, label: 'Too short', color: 'bg-red-500' };
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [password.length >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score <= 1) return { level: 2, label: 'Weak', color: 'bg-orange-500' };
    if (score <= 2) return { level: 3, label: 'Fair', color: 'bg-yellow-500' };
    return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await signUp(email, password);
      if (authError) {
        setError(authError.message);
      } else {
        setSuccess('Account created! Check your email for a confirmation link, then sign in.');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <LandingHeader />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-secondary/15 rounded-full blur-[180px] opacity-40 pointer-events-none" />

      <div className="flex items-center justify-center min-h-screen px-6 pt-16 relative">
        <div className="w-full max-w-md animate-fade-up">
          <div className="glass rounded-2xl p-8">
            <h1 className="text-2xl font-black text-white mb-2">Create your account</h1>
            <p className="text-slate-400 text-sm mb-8">Start analyzing your data for free</p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-400 text-sm font-medium">{success}</p>
                    <Link to="/login" className="text-primary hover:text-primary/80 text-sm font-medium mt-2 inline-block">
                      Go to Sign in
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map(n => (
                        <div
                          key={n}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            n <= passwordStrength.level ? passwordStrength.color : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">{passwordStrength.label}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                        : confirmPassword && confirmPassword === password
                        ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500'
                        : 'border-white/10 focus:border-primary focus:ring-primary'
                    }`}
                    placeholder="Confirm your password"
                  />
                  {confirmPassword && confirmPassword === password && (
                    <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
