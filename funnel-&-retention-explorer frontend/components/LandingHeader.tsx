import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from './Icons';

const Activity: React.FC<{ size: number }> = ({ size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export const LandingHeader: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Activity size={20} />
          </div>
          FRE Analytics
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-lg shadow-primary/30"
          >
            Get Started
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-slate-300"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-white/5 px-6 py-4 space-y-4">
          <a href="#features" className="block text-slate-300 hover:text-white" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#pricing" className="block text-slate-300 hover:text-white" onClick={() => setMobileOpen(false)}>Pricing</a>
          <a href="#faq" className="block text-slate-300 hover:text-white" onClick={() => setMobileOpen(false)}>FAQ</a>
          <div className="flex gap-3 pt-2">
            <Link to="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white">Log in</Link>
            <Link to="/signup" className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-lg">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
};
