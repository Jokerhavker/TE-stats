'use client';

import React, { useState, useEffect } from 'react';
import { Player } from '@/types';
import { getDeletedPlayers, restoreDeletedPlayer } from '@/services/stateManager';

interface RecoveryManagerProps {
  onClose?: () => void;
}

const PlayerRecoveryManager: React.FC<RecoveryManagerProps> = ({ onClose }) => {
  const [deletedPlayers, setDeletedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'info' | 'error'>('info');

  useEffect(() => {
    loadDeletedPlayers();
  }, []);

  const loadDeletedPlayers = async () => {
    setLoading(true);
    const players = await getDeletedPlayers();
    setDeletedPlayers(players);
    setLoading(false);
  };

  const handleRestore = async (playerId: string, playerName: string) => {
    setRestoring(playerId);
    try {
      await restoreDeletedPlayer(playerId);
      setDeletedPlayers(deletedPlayers.filter(p => p.id !== playerId));
      setMessage(`✅ "${playerName}" has been restored with all previous match stats!`);
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Failed to restore ${playerName}. Try again.`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-zinc-400 animate-pulse">Loading deleted players...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Deleted Players</h3>
        <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm font-mono">
          {deletedPlayers.length} deleted
        </span>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          messageType === 'success' ? 'bg-green-500/10 text-green-300 border border-green-500/30' :
          messageType === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/30' :
          'bg-blue-500/10 text-blue-300 border border-blue-500/30'
        }`}>
          {message}
        </div>
      )}

      {deletedPlayers.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <p>No deleted players to recover</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deletedPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div>
                <p className="text-white font-medium">{player.name}</p>
                <p className="text-sm text-zinc-400">{player.role}</p>
                {player.deletedAt && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Deleted: {new Date(player.deletedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleRestore(player.id, player.name)}
                disabled={restoring === player.id}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {restoring === player.id ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">↻</span> Restoring...
                  </span>
                ) : (
                  'Restore'
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
        >
          Close
        </button>
      )}
    </div>
  );
};

export default PlayerRecoveryManager;
