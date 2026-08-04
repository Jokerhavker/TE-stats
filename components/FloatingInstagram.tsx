'use client';

import React, { useState } from 'react';

const FloatingInstagram: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Instagram Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-transform"
        aria-label="Instagram Links"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <rect x="2.16" y="2.16" width="19.68" height="19.68" rx="4.41" ry="4.41" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="12" cy="12" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="17.22" cy="6.78" r="0.88" fill="currentColor"/>
        </svg>
      </button>

      {/* Popup Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed bottom-24 right-6 z-[95] animate-slide-up">
            <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[280px]">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="2.16" y="2.16" width="19.68" height="19.68" rx="4.41" ry="4.41" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="17.22" cy="6.78" r="0.88" fill="currentColor"/>
                    </svg>
                  </div>
                  <span className="text-white font-bold text-sm uppercase tracking-wider">Instagram</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Links */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="2.16" y="2.16" width="19.68" height="19.68" rx="4.41" ry="4.41" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="17.22" cy="6.78" r="0.88" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">Instagram Page</p>
                    <p className="text-gray-400 text-xs">@ig.teamelite</p>
                  </div>
                  <a
                    href="https://www.instagram.com/ig.teamelite"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold text-xs whitespace-nowrap hover:shadow-lg hover:scale-105 transition-transform"
                  >
                    Follow us
                  </a>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="2.16" y="2.16" width="19.68" height="19.68" rx="4.41" ry="4.41" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="17.22" cy="6.78" r="0.88" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">Broadcast Channel</p>
                    <p className="text-gray-400 text-xs">DIL SE ELITE💙</p>
                  </div>
                  <a
                    href="https://www.instagram.com/channel/AbYrPZh2_CxoHCLr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold text-xs whitespace-nowrap hover:shadow-lg hover:scale-105 transition-transform"
                  >
                    Join Broadcast
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 text-center">
                <p className="text-gray-500 text-[10px] uppercase tracking-widest">Follow us on Instagram</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default FloatingInstagram;