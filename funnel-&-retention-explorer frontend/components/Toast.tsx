import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from './Icons';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: 'border-l-accent', icon: 'text-accent', bg: 'bg-accent/5' },
  error: { border: 'border-l-coral', icon: 'text-coral', bg: 'bg-coral/5' },
  warning: { border: 'border-l-amber', icon: 'text-amber', bg: 'bg-amber/5' },
  info: { border: 'border-l-sky-400', icon: 'text-sky-400', bg: 'bg-sky-400/5' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const Icon = icons[t.type];
          const c = colors[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto animate-fade-up ${c.bg} flex items-start gap-3 px-4 py-3 rounded-lg border-l-2 ${c.border} border border-white/[0.06] shadow-xl backdrop-blur-sm min-w-[280px] max-w-[400px]`}
            >
              <Icon size={18} className={`${c.icon} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-white block">{t.title}</span>
                {t.message && <span className="text-[11px] text-slate-400 block mt-0.5">{t.message}</span>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-500 hover:text-white transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
