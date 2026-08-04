'use client';

import React, { useState, useEffect } from 'react';

interface RecoveryNotificationProps {
  playerName?: string;
  isRecovered?: boolean;
  message?: string;
  onClose?: () => void;
}

const PlayerRecoveryNotification: React.FC<RecoveryNotificationProps> = ({
  playerName,
  isRecovered,
  message,
  onClose
}) => {
  const [visible, setVisible] = useState(!!message || !!isRecovered);

  useEffect(() => {
    if (message || isRecovered) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, isRecovered, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 max-w-sm">
      <div className={`p-4 rounded-lg backdrop-blur-sm border ${
        isRecovered
          ? 'bg-green-500/10 border-green-500/30 text-green-300'
          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="text-xl mt-1">
            {isRecovered ? '✅' : 'ℹ️'}
          </div>
          <div>
            <p className="font-semibold">
              {isRecovered ? 'Player Recovered!' : 'Player Created'}
            </p>
            <p className="text-sm mt-1 opacity-90">
              {message || `${playerName} has been ${isRecovered ? 'restored with all previous match data!' : 'added to the team.'}`}
            </p>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              onClose?.();
            }}
            className="text-lg opacity-60 hover:opacity-100 transition-opacity ml-auto"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerRecoveryNotification;
