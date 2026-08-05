'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthSession } from '@/lib/clientAuth';

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [loginShake, setLoginShake] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Invalid Authorization Token');
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // If already logged in, redirect to admin dashboard.
  // Otherwise run the block countdown.
  useEffect(() => {
    const role = sessionStorage.getItem('s8ul_user_role');
    if (role === 'admin' || role === 'ledger') {
      router.push('/admin');
      return;
    }

    const interval = setInterval(() => {
      setRemainingTime(prev => (prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  // Lift the block once the server-side countdown reaches zero.
  useEffect(() => {
    if (isBlocked && remainingTime === 0) {
      setIsBlocked(false);
      setError(false);
    }
  }, [isBlocked, remainingTime]);

  const formatRemainingTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Client-side block guard (authoritative block is enforced server-side)
    if (isBlocked) {
      setError(true);
      setErrorMessage(`Access Blocked - Try again in ${formatRemainingTime(remainingTime)}`);
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.token && (data.role === 'admin' || data.role === 'ledger')) {
        setAuthSession(data.token, data.role, data.sessionId);
        window.dispatchEvent(new CustomEvent('admin_login_success'));
        router.push('/admin');
        return;
      }

      if (res.status === 429) {
        setIsBlocked(true);
        setRemainingTime(data.retryAfterSeconds || 86400);
        setError(true);
        setErrorMessage('Access Blocked - Try again later');
        setIsLoading(false);
        setPassword('');
        return;
      }

      setLoginShake(true);
      setError(true);
      if (res.status === 401 && data.attemptsRemaining != null) {
        setErrorMessage(`Invalid Authorization Token - ${data.attemptsRemaining} attempt(s) remaining`);
      } else {
        setErrorMessage('Invalid Authorization Token');
      }

      setTimeout(() => {
        setLoginShake(false);
        setError(false);
        setIsLoading(false);
        setPassword('');
      }, 600);
    } catch {
      setLoginShake(true);
      setError(true);
      setErrorMessage('Network error - please try again');
      setTimeout(() => {
        setLoginShake(false);
        setError(false);
        setIsLoading(false);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-3 sm:p-4 selection:bg-blue-500/30">
      <form 
        onSubmit={handleLogin} 
        className={`w-full max-w-md glass-card p-5 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border-zinc-800/50 space-y-6 sm:space-y-8 transition-all ${loginShake ? 'shake' : ''}`}
      >
        <div className="text-center">
          <div className="w-14 sm:w-16 h-14 sm:h-16 bg-blue-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-blue-500/20">
            <svg className="w-7 sm:w-8 h-7 sm:h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="font-blanka text-xl sm:text-2xl md:text-3xl text-white uppercase tracking-wider">RESTRICTED</h2>
          <p className="text-[8px] sm:text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] mt-1 sm:mt-2">Elevated Credentials Required</p>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <input
              type="password"
              placeholder="ACCESS KEY"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isBlocked}
              className={`w-full bg-zinc-900/50 border ${error ? 'border-red-500' : 'border-zinc-800'} rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 text-white text-center text-lg sm:text-xl tracking-wider focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed`}
              autoFocus
            />
            {error && (
              <p className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-center mt-2 sm:mt-3 animate-pulse ${isBlocked ? 'text-orange-500' : 'text-red-500'}`}>
                {errorMessage}
              </p>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || isBlocked}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-blanka py-4 sm:py-5 rounded-xl sm:rounded-2xl transition-all tracking-widest text-[9px] sm:text-xs shadow-lg shadow-blue-600/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>AUTHORIZING...</span>
              </>
            ) : isBlocked ? (
              `BLOCKED - ${formatRemainingTime(remainingTime)}`
            ) : (
              'AUTHORIZE'
            )}
          </button>
        </div>

        <div className="pt-3 sm:pt-4 border-t border-zinc-900/50 flex items-center justify-center gap-2 sm:gap-4">
          <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse ${isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className="text-[7px] sm:text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
            {isBlocked ? 'Account Temporarily Locked' : 'Encrypted Session'}
          </span>
        </div>
      </form>
    </div>
  );
};

export default AdminLoginPage;
