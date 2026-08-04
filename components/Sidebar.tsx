'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getDashboardView, setDashboardView } from '@/services/stateManager';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const pathname = usePathname();
  const [dashboardView, setDashboardViewUI] = useState('dashboard');
  useEffect(() => {
    setDashboardViewUI(getDashboardView());
    const handleUpdate = () => {
      setDashboardViewUI(getDashboardView());
    };
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const navItems = [
    {
      id: 'dashboard',
      label: 'OVERVIEW',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      type: 'view'
    },
    {
      id: 'teams',
      label: 'TEAMS',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      type: 'view'
    },
    {
      id: 'tournamentHistory',
      label: 'HISTORY',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      type: 'view'
    }
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-[60] bg-zinc-950/40 backdrop-blur-2xl border-r border-zinc-800/50 transition-all duration-500 ease-out flex flex-col ${isCollapsed ? 'w-20' : 'w-64'
        } hidden lg:flex`}
    >
      {/* Sidebar Header */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 animate-slide-up">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-700">
              <img src="https://files.catbox.moe/d6nc0b.jpg" alt="TEAM ELITE" className="w-full h-full object-cover" />
            </div>
            <span className="font-blanka text-sm tracking-widest text-white">TE</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-zinc-900/50 rounded-lg text-zinc-500 hover:text-white transition-colors"
        >
          <svg className={`w-5 h-5 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = item.type === 'view' ? (dashboardView === item.id && pathname === '/') : (pathname === (item as any).href);
          
          const content = (
            <div className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group relative ${isActive
                ? 'bg-blue-600/10 text-blue-400'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
              }`}>
              {/* Active Indicator Bar */}
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
              
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-900 text-white text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap z-50 border border-zinc-800">
                  {item.label}
                </div>
              )}
            </div>
          );

          if (item.type === 'view') {
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (pathname !== '/') {
                    window.location.href = '/';
                    setTimeout(() => setDashboardView(item.id), 100);
                  } else {
                    setDashboardView(item.id);
                  }
                }}
                className="w-full text-left"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.id} href={(item as any).href || '/'} className="w-full">
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer - Admin Entry */}
      <div className="p-4 border-t border-zinc-900/50">
        <Link 
          href="/admin"
          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group bg-zinc-900/30 border border-zinc-800/30 hover:border-zinc-700 hover:bg-zinc-900/50 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 overflow-hidden relative">
            <img src="https://files.catbox.moe/d6nc0b.jpg" alt="User" className="w-full h-full object-cover" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-white truncate uppercase tracking-widest">ADMIN ACCESS</p>
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">TEAM ELITE</p>
            </div>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-900 text-white text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap z-50 border border-zinc-800">
              ADMIN PANEL
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
