'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'ledger' | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('s8ul_user_role') as 'admin' | 'ledger' | null;
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState('scoring');
  const [activeTournamentName, setActiveTournamentName] = useState<string | null>(null);

  useEffect(() => {
    const handleRoleUpdate = () => {
        setUserRole(sessionStorage.getItem('s8ul_user_role') as 'admin' | 'ledger' | null);
    };

    window.addEventListener('admin_login_success', handleRoleUpdate);

    const handleActiveTournamentUpdate = (e: any) => {
      if (e.detail?.name) setActiveTournamentName(e.detail.name);
    };
    window.addEventListener('active_tournament_update', handleActiveTournamentUpdate);

    return () => {
      window.removeEventListener('admin_login_success', handleRoleUpdate);
      window.removeEventListener('active_tournament_update', handleActiveTournamentUpdate);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('s8ul_user_role');
    setUserRole(null);
    window.location.href = '/admin/login'; 
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.dispatchEvent(new CustomEvent('admin_tab_change', { detail: tab }));
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex selection:bg-blue-500/30 bg-zinc-950 text-white overflow-x-hidden">
      {userRole && (
        <>
          {/* Desktop Sidebar */}
          <AdminSidebar 
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            userRole={userRole}
            onLogout={handleLogout}
          />

          {/* Mobile Sidebar Overlay */}
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-[70]">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
              <div className="absolute left-0 top-0 h-full w-72 bg-zinc-950 border-r border-zinc-800 animate-slide-right">
                  <AdminSidebar 
                    isCollapsed={false} 
                    setIsCollapsed={() => setIsMobileMenuOpen(false)}
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                    userRole={userRole}
                    onLogout={handleLogout}
                    isMobile={true}
                 />
              </div>
            </div>
          )}
        </>
      )}

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${userRole ? (isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64') : ''}`}>
        {/* Simple Top Bar for Admin */}
        {userRole && (
          <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 p-2 sm:p-3 md:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden p-2 text-zinc-400 hover:text-white bg-zinc-900/50 rounded-lg border border-zinc-800/50 transition-all active:scale-95 shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isMobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 min-w-0 flex-1">
                    <div className="px-2 md:px-3 py-0.5 md:py-1 bg-blue-600/10 border border-blue-500/20 rounded-full w-fit shrink-0">
                      <span className="text-[7px] md:text-[10px] font-black text-blue-400 tracking-widest uppercase">
                        ADMIN
                      </span>
                    </div>
                    <svg className="w-3 h-3 text-zinc-700 hidden md:block shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    <span className="text-[9px] md:text-xs font-blanka text-zinc-300 tracking-widest uppercase truncate">
                      {activeTab}
                    </span>
                    {activeTournamentName && (
                      <>
                        <svg className="w-3 h-3 text-zinc-700 hidden md:block shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="hidden md:block text-[9px] font-black text-zinc-500 tracking-wider uppercase max-w-[180px] truncate">{activeTournamentName}</span>
                      </>
                    )}
                  </div>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                   <div className="hidden sm:flex items-center gap-2 text-[7px] md:text-[8px]">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-bold text-zinc-400 uppercase tracking-widest">Secure</span>
                   </div>
                   
                   <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 bg-zinc-900/50 rounded-lg md:rounded-xl border border-zinc-800/50 text-[8px] md:text-[9px]">
                      <div className="w-5 h-5 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                        <span className="text-[7px] md:text-[8px] font-black text-blue-400">A</span>
                      </div>
                      <span className="font-black text-zinc-400 uppercase tracking-widest hidden sm:block">Session Active</span>
                   </div>
              </div>
          </div>
        )}

        <main className="flex-1 w-full p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
