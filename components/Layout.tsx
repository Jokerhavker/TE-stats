'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getDashboardView, setDashboardView } from '@/services/stateManager';
import Sidebar from './Sidebar';
import FloatingInstagram from './FloatingInstagram';
import FloatingHearts from './FloatingHearts';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [dashboardView, setDashboardViewUI] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


  useEffect(() => {
    // Initial hydration
    setDashboardViewUI(getDashboardView());

    const handleUpdate = () => {
      setDashboardViewUI(getDashboardView());
    };
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  return (
    <div className="min-h-screen flex selection:bg-green-500/30">
      {/* Floating Hearts Background */}
      <FloatingHearts />

      {/* Sidebar - Desktop Only */}
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500">
        <div className={`flex-1 flex flex-col transition-all duration-500 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>

          
          {/* Navbar with animated gradient border */}
          <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl px-3 sm:px-4 md:px-8 py-2 sm:py-3 lg:px-8 border-b border-zinc-800/50">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
              <Link href="/" className="flex lg:hidden items-center gap-2 sm:gap-4 group shrink-0">
                <div className="relative">
                  <div className="absolute -inset-1.5 bg-neon-gradient rounded-full blur-md opacity-40 group-hover:opacity-100 transition duration-500 animate-breathe"></div>
                  <img
                    src="https://files.catbox.moe/d6nc0b.jpg"
                    alt="TEAM ELITE Logo"
                    className="relative w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 border-zinc-800 object-cover"
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-blanka text-sm sm:text-base tracking-tighter text-white">TEAM ELITE</h1>
                </div>
              </Link>

              {/* Page Title / Context Indicator (Desktop) */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full">
                  <span className="text-[9px] sm:text-[10px] font-black text-blue-400 tracking-widest uppercase">
                    {dashboardView.toUpperCase()}
                  </span>
                </div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              </div>

              {/* Action Buttons (Desktop) */}
              <div className="hidden md:flex items-center gap-2 md:gap-4 shrink-0">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:block">Live Updates</span>
                </div>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-zinc-400 hover:text-white bg-zinc-900/50 rounded-lg border border-zinc-800/50"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/50 p-3 sm:p-4 shadow-2xl flex flex-col gap-2 z-50">
                {[
                  { id: 'dashboard', label: 'OVERVIEW' },
                  { id: 'teams', label: 'TEAMS' },
                  { id: 'tournamentHistory', label: 'HISTORY' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (pathname !== '/') {
                        window.location.href = '/';
                        setTimeout(() => setDashboardView(item.id), 100);
                      } else {
                        setDashboardView(item.id);
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black tracking-widest transition-all duration-300 ${
                      dashboardView === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="h-px bg-zinc-800/50 my-1" />
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black tracking-widest transition-all duration-300 text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded-xl"
                >
                  ADMIN ACCESS
                </Link>
              </div>
            )}
          </nav>

          <main className="flex-1 w-full p-3 sm:p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>

          {/* Enhanced Footer */}
          <footer className="relative border-t border-zinc-800/50 p-4 sm:p-6 md:p-8 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="text-zinc-600 text-[7px] sm:text-[8px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase text-center md:text-left">
                  &copy; 2024 TEAM ELITE ESPORTS • POWERED BY NEON FLOW
                </p>
              </div>

              <div className="flex flex-col items-center md:items-end gap-2">
                <a
                  href="https://Alokgupta.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-900/30 border border-zinc-800/50 rounded-lg sm:rounded-xl hover:border-blue-500/30 transition-all active:scale-95"
                >
                  <span className="text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400 hidden sm:block">By</span>
                  <span className="font-blanka text-zinc-400 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Alok</span>
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Floating Instagram Button */}
      <FloatingInstagram />
    </div>
  );
};

export default Layout;
