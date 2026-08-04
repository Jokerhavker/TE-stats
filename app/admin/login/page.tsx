'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RateLimitData {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [loginShake, setLoginShake] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Invalid Authorization Token');
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const router = useRouter();

  const RATE_LIMIT_KEY = 's8ul_rate_limit';
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Check rate limit status on component mount and set up interval
  useEffect(() => {
    const checkRateLimit = () => {
      const storedData = localStorage.getItem(RATE_LIMIT_KEY);
      const now = Date.now();

      if (storedData) {
        const rateLimitData: RateLimitData = JSON.parse(storedData);

        // Check if user is currently blocked
        if (rateLimitData.blockedUntil && rateLimitData.blockedUntil > now) {
          setIsBlocked(true);
          const remaining = Math.ceil((rateLimitData.blockedUntil - now) / 1000);
          setRemainingTime(remaining);
        } else if (rateLimitData.blockedUntil && rateLimitData.blockedUntil <= now) {
          // Block period has expired, reset the data
          localStorage.removeItem(RATE_LIMIT_KEY);
          setIsBlocked(false);
        }
      }
    };

    checkRateLimit();

    // If already logged in, redirect to admin dashboard
    const role = sessionStorage.getItem('s8ul_user_role');
    if (role === 'admin' || role === 'ledger') {
      router.push('/admin');
    }

    // Set up interval to update remaining time
    const interval = setInterval(() => {
      checkRateLimit();
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const getRateLimitData = (): RateLimitData => {
    const storedData = localStorage.getItem(RATE_LIMIT_KEY);
    return storedData ? JSON.parse(storedData) : { attempts: 0, lastAttempt: 0 };
  };

  const updateRateLimit = (isFailure: boolean) => {
    const now = Date.now();
    const rateLimitData = getRateLimitData();

    if (isFailure) {
      rateLimitData.attempts += 1;
      rateLimitData.lastAttempt = now;

      if (rateLimitData.attempts >= MAX_ATTEMPTS) {
        rateLimitData.blockedUntil = now + BLOCK_DURATION;
      }

      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateLimitData));

      if (rateLimitData.attempts >= MAX_ATTEMPTS) {
        setIsBlocked(true);
        setRemainingTime(Math.ceil(BLOCK_DURATION / 1000));
      }
    } else {
      // Reset on successful login
      localStorage.removeItem(RATE_LIMIT_KEY);
    }
  };

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

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check if user is blocked
    if (isBlocked) {
      setError(true);
      setErrorMessage(`Access Blocked - Try again in ${formatRemainingTime(remainingTime)}`);
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
      return;
    }

    if (password === 'tstp@8thg9@22k0' || password === 's8ulledger') {
      const role = password === 'tstp@8thg9@22k0' ? 'admin' : 'ledger';
      sessionStorage.setItem('s8ul_user_role', role);
      updateRateLimit(false); // Reset rate limit on success
      window.dispatchEvent(new CustomEvent('admin_login_success'));
      router.push('/admin');
    } else {
      setLoginShake(true);
      setError(true);
      setErrorMessage('Invalid Authorization Token');
      updateRateLimit(true); // Increment failed attempts

      const rateLimitData = getRateLimitData();
      const attemptsRemaining = MAX_ATTEMPTS - rateLimitData.attempts;

      if (attemptsRemaining > 0 && attemptsRemaining < MAX_ATTEMPTS) {
        setErrorMessage(`Invalid Authorization Token - ${attemptsRemaining} attempt(s) remaining`);
      } else if (attemptsRemaining <= 0) {
        setIsBlocked(true);
        setErrorMessage(`Access Blocked for 24 hours - Too many failed attempts`);
        setRemainingTime(Math.ceil(BLOCK_DURATION / 1000));
      }

      setTimeout(() => {
        setLoginShake(false);
        setError(false);
        setIsLoading(false);
        setPassword('');
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