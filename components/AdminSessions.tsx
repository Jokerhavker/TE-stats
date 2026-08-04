'use client';

import React, { useState, useEffect } from 'react';
import type { AdminSession } from '@/types/index';
import {
  getActiveSessions,
  updateSessionName,
  terminateSession,
  detectDeviceType,
} from '@/services/sessionManager';

const AdminSessions: React.FC = () => {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const currentSessionId = typeof window !== 'undefined' ? sessionStorage.getItem('s8ul_session_id') : null;

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    const data = await getActiveSessions();
    setSessions(data);
    setIsLoading(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRenameSesssion = async (sessionId: string) => {
    if (!editingName.trim()) {
      showToast('Session name cannot be empty', 'error');
      return;
    }

    try {
      await updateSessionName(sessionId, editingName);
      showToast('Session renamed successfully');
      setEditingSessionId(null);
      await loadSessions();
    } catch (error) {
      showToast('Failed to rename session', 'error');
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to terminate this session?')) {
      try {
        await terminateSession(sessionId);
        showToast('Session terminated');
        await loadSessions();
      } catch (error) {
        showToast('Failed to terminate session', 'error');
      }
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt: number) => {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return 'Expired';

    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-2xl font-blanka text-[10px] tracking-widest shadow-2xl z-50 animate-slide-up ${
          toast.type === 'success' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-blanka text-white uppercase tracking-widest">
            🔐 Active Sessions
          </h2>
          <button
            onClick={loadSessions}
            className="px-4 py-2 bg-blue-600/20 border border-blue-500/20 rounded-lg text-blue-400 text-[9px] font-bold uppercase tracking-widest hover:bg-blue-600/30 transition-all"
          >
            ↻ Refresh
          </button>
        </div>

        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
          Manage your active admin sessions across devices
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="inline-block">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-4">Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
          <svg className="w-12 h-12 text-zinc-800 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">No Active Sessions</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-6 rounded-2xl border transition-all ${
                currentSessionId === session.id
                  ? 'bg-blue-950/30 border-blue-500/40 shadow-lg shadow-blue-500/10'
                  : 'bg-zinc-950/40 border-zinc-800/50 hover:border-zinc-700/50'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Session Info */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="Session name"
                            className="flex-1 px-3 py-2 bg-zinc-900 border border-blue-500/30 rounded-lg text-white text-[10px] font-blanka uppercase tracking-widest focus:outline-none focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameSesssion(session.id)}
                            className="px-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-400 text-[8px] font-bold uppercase hover:bg-green-600/30 transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSessionId(null)}
                            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 text-[8px] font-bold uppercase hover:bg-zinc-700 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg md:text-xl font-blanka text-white uppercase tracking-tight break-words">
                            {session.sessionName}
                          </h3>
                          {currentSessionId === session.id && (
                            <span className="px-3 py-1 bg-blue-600 text-[7px] font-black text-white rounded-full uppercase tracking-widest whitespace-nowrap">
                              (current)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-[9px]">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase tracking-widest">Device:</span>
                      <span className="text-zinc-200 font-bold">{session.deviceType || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase tracking-widest">Role:</span>
                      <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded text-purple-300 font-bold uppercase tracking-wider">
                        {session.userRole}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase tracking-widest">Login Time:</span>
                      <span className="text-zinc-300 font-mono text-[8px]">{formatTime(session.loginTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 uppercase tracking-widest">Last Activity:</span>
                      <span className="text-zinc-300 font-mono text-[8px]">{formatTime(session.lastActivityTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Time & Actions */}
                <div className="flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                      <p className="text-[7px] text-zinc-500 uppercase tracking-widest mb-2">Expires In</p>
                      <p className="text-2xl font-blanka text-blue-400">
                        {getTimeRemaining(session.expiresAt)}
                      </p>
                      <p className="text-[7px] text-zinc-600 uppercase tracking-widest mt-2">
                        Expires: {formatTime(session.expiresAt)}
                      </p>
                    </div>

                    {session.ipAddress && session.ipAddress !== 'N/A' && (
                      <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-800/30">
                        <p className="text-[7px] text-zinc-500 uppercase tracking-widest mb-1">IP Address:</p>
                        <p className="text-[9px] text-zinc-300 font-mono">{session.ipAddress}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    {editingSessionId !== session.id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingSessionId(session.id);
                            setEditingName(session.sessionName);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 text-[8px] font-bold uppercase tracking-widest hover:bg-blue-600/30 transition-all"
                        >
                          ✎ Rename
                        </button>
                        {currentSessionId !== session.id && (
                          <button
                            onClick={() => handleTerminateSession(session.id)}
                            className="flex-1 px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-400 text-[8px] font-bold uppercase tracking-widest hover:bg-red-600/30 transition-all"
                          >
                            ✕ Terminate
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-xl">
        <p className="text-[8px] text-blue-300 leading-relaxed">
          ⓘ Sessions automatically extend to <span className="font-bold">2 days</span> from last activity. Your current session is marked with <span className="font-bold">(current)</span>. Renaming helps identify sessions across devices.
        </p>
      </div>
    </div>
  );
};

export default AdminSessions;
