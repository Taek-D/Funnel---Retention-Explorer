import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Modal } from './Modal';
import { UserMenu } from './UserMenu';
import { Search, Bell, Menu, Mail, CheckCircle } from './Icons';

export const AppShell: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentSegment = location.pathname.split('/').pop() || 'dashboard';
  const pageTitle = currentSegment.replace(/-/g, ' ');

  const handleSaveEmailSettings = () => {
    setIsModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-background text-white font-sans selection:bg-accent/30 selection:text-white">
      {/* Dot grid background */}
      <div className="fixed inset-0 dot-grid pointer-events-none -z-10" />

      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <main className="flex-1 flex flex-col md:pl-16 relative">
        {/* Top Header — minimal */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/[0.06] bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="font-semibold text-sm text-white capitalize tracking-tight">{pageTitle}</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white tracking-tight capitalize">{pageTitle}</h1>
            <span className="text-[10px] text-slate-500 font-mono uppercase">FRE</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
              <Search size={16} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors relative"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-coral rounded-full"></span>
            </button>
            <div className="w-px h-5 bg-white/[0.06] mx-1" />
            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Email Settings Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Email Settings">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">n8n Webhook URL</label>
            <input
              type="text"
              className="w-full bg-white/[0.03] border-b border-white/10 px-0 py-3 text-sm text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="https://primary.n8n.cloud/webhook/..."
            />
            <p className="text-[11px] text-slate-600">Enter the n8n webhook address to call when an event occurs.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Recipient Emails <span className="text-slate-600 font-normal normal-case">(comma separated)</span>
            </label>
            <textarea
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-md px-3 py-3 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors min-h-[100px] resize-none"
              placeholder="user@example.com, admin@company.com"
            />
          </div>

          <div className="flex items-center justify-between bg-surface p-4 rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-md bg-accent/10 text-accent p-2 shrink-0">
                <Mail size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">Auto Send on Analysis</span>
                <span className="text-[11px] text-slate-500">Send report immediately after data aggregation.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
            <button
              onClick={handleSaveEmailSettings}
              className="px-5 py-2 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-md transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 animate-fade-up">
          <div className="bg-surface flex items-center gap-3 px-4 py-3 rounded-md border-l-2 border-l-accent border border-white/[0.06]">
            <CheckCircle size={18} className="text-accent" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Saved</span>
              <span className="text-[11px] text-slate-500">Configuration saved successfully</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
