'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  userRole: 'admin' | 'ledger' | null;
  onLogout: () => void;
  isMobile?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  isCollapsed, 
  setIsCollapsed, 
  activeTab, 
  setActiveTab,
  userRole,
  onLogout,
  isMobile = false
}) => {
  const pathname = usePathname();
  const [activeTournamentName, setActiveTournamentName] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: any) => { if (e.detail?.name) setActiveTournamentName(e.detail.name); };
    window.addEventListener('active_tournament_update', handler);
    return () => window.removeEventListener('active_tournament_update', handler);
  }, []);

  const navItems = [
    {
      id: 'scoring',
      label: 'SCORING',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'ledger',
      label: 'LEDGER',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'tournaments',
      label: 'TOURNAMENTS',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'players',
      label: 'PLAYERS',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    }
  ];

  const filteredNavItems = navItems.filter(item => {
    if (userRole === 'ledger') return item.id === 'ledger';
    return true;
  });

  return (
    <aside
      className={`${isMobile ? 'w-full h-full' : 'fixed left-0 top-0 h-full hidden lg:flex'} z-[60] bg-zinc-950/40 backdrop-blur-2xl border-r border-zinc-800/50 transition-all duration-500 ease-out flex flex-col ${isCollapsed && !isMobile ? 'w-20' : 'w-64'
        }`}
    >
      {/* Sidebar Header */}
      <div className="p-6 flex items-center justify-between">
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-lg bg-neon-gradient p-0.5">
              <div className="w-full h-full bg-zinc-950 rounded-md flex items-center justify-center">
                <span className="text-neon-blue font-black text-xs">AD</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-blanka text-sm tracking-widest text-white">PORTAL</span>
              {activeTournamentName && (
                <span className="text-[7px] font-black text-blue-400 uppercase tracking-wider truncate max-w-[120px]">{activeTournamentName}</span>
              )}
            </div>
          </div>
        )}
        
        {isMobile ? (
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 hover:bg-zinc-900/50 rounded-lg text-zinc-500 hover:text-white transition-colors lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-zinc-900/50 rounded-lg text-zinc-500 hover:text-white transition-colors hidden lg:block"
          >
            <svg className={`w-5 h-5 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-2">
        <div className="mb-4 px-3">
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2">Administrative tools</p>
        </div>
        {filteredNavItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full text-left"
            >
              <div className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group relative ${isActive
                  ? 'bg-blue-600/10 text-blue-400'
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
                }`}>
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                )}
                
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                
                {!isCollapsed && (
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
                
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-900 text-white text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap z-50 border border-zinc-800">
                    {item.label}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer - Logout */}
      <div className="p-4 border-t border-zinc-900/50 space-y-2">
        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="text-red-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left">
              <p className="text-[9px] font-black text-red-500 truncate uppercase tracking-widest">Logout</p>
              <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Terminate Session</p>
            </div>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-2 bg-red-950 text-red-400 text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap z-50 border border-red-900/50">
              LOGOUT
            </div>
          )}
        </button>

        <Link 
          href="/"
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group bg-zinc-900/30 border border-zinc-800/30 hover:bg-zinc-900/50 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="text-zinc-500 group-hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left">
              <p className="text-[9px] font-black text-zinc-400 truncate uppercase tracking-widest group-hover:text-white">Back to Dashboard</p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
