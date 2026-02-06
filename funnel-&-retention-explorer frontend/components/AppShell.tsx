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
    <div className="flex min-h-screen bg-background text-white font-sans selection:bg-primary selection:text-white">
      {/* Background Ambient Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] opacity-40"></div>
      </div>

      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <main className="flex-1 flex flex-col md:pl-20 relative">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Menu size={22} />
            </button>
            <span className="font-bold text-white capitalize">{pageTitle}</span>
          </div>

          <div className="hidden md:flex flex-col">
            <h1 className="text-xl font-bold text-white tracking-tight capitalize">{pageTitle}</h1>
            <p className="text-xs text-slate-400">FRE Analytics Dashboard</p>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
              <Search size={18} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors relative"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
            </button>
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
            <label className="text-sm font-medium text-gray-300">n8n Webhook URL</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="https://primary.n8n.cloud/webhook/..."
            />
            <p className="text-xs text-gray-500">Enter the n8n webhook address to call when an event occurs.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">
              Recipient Emails <span className="text-gray-500 font-normal">(comma separated)</span>
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[100px] resize-none"
              placeholder="user@example.com, admin@company.com"
            />
          </div>

          <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-primary/20 text-primary p-2 shrink-0">
                <Mail size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">Auto Send on Analysis</span>
                <span className="text-xs text-gray-500">Send report immediately after data aggregation.</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
            <button
              onClick={handleSaveEmailSettings}
              className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-lg shadow-primary/30"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 animate-fade-up">
          <div className="bg-surface flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 border-l-green-500 shadow-xl pr-6 border border-white/5">
            <div className="bg-green-500/20 text-green-500 rounded-full p-1">
              <CheckCircle size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Success</span>
              <span className="text-xs text-gray-400">Configuration saved successfully</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
