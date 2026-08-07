'use client';

import React, { useState, useEffect } from 'react';
import { POSITION_POINTS } from '@/constants';
import {
  getTournaments,
  saveMatch,
  getMatches,
  createTournament,
  setActiveTournament,
  updateMatch,
  deleteTournament,
  updateTournament,
  deleteMatch,
  getSchedule,
  saveScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  getWeeks,
  createWeek,
  deleteWeek,
  getPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getSettings,
  updateSettings
} from '@/services/stateManager';
import { Match, PlayerMatchStats, Tournament, ScheduleItem, TournamentWeek, Player, SystemSettings } from '@/types';
import { addAuthHeaders, handleAuthError } from '@/lib/clientAuth';
import AdminSessions from './AdminSessions';

type AdminTab = 'scoring' | 'tournaments' | 'players' | 'ledger' | 'sessions';

const DID_NOT_PLAY_ID = '__DID_NOT_PLAY__';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('scoring');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'ledger' | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = sessionStorage.getItem('s8ul_user_role') as 'admin' | 'ledger' | null;
      setUserRole(role);
      if (role === 'ledger') {
        setActiveTab('ledger');
      }
    }
  }, []);

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({
    matchNumber: 1,
    map: 'Barmuda',
    time: '14:00',
    opponent: '',
    stage: 'Match',
    location: 'Online',
    status: 'scheduled',
    channelLink: '',
    tournamentName: ''
  });

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [matchNumber, setMatchNumber] = useState<number>(1);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [position, setPosition] = useState<number>(1);
  const [kills, setKills] = useState<{ [key: string]: number }>({});
  const [compensationPoints, setCompensationPoints] = useState<number>(0);
  const [mapName, setMapName] = useState<string>('BERMUDA');
  const [didNotPlayPlayer, setDidNotPlayPlayer] = useState<string>('NONE');
  const [newTournament, setNewTournament] = useState<{ name: string, startDate: string, endDate: string, status: Tournament['status'], category: 'scrim' | 'official' }>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'active',
    category: 'scrim'
  });
  const [weeks, setWeeks] = useState<TournamentWeek[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [newWeekName, setNewWeekName] = useState<string>('');
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [editTournamentNameValue, setEditTournamentNameValue] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState<'all' | 'official' | 'scrim' | 'done'>('all');
  const [editRank, setEditRank] = useState<number>(1);
  const [editRankDesc, setEditRankDesc] = useState<string>('Leading by 12 pts');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<'all' | 'official' | 'scrim'>('all');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const [newPlayer, setNewPlayer] = useState<{ name: string; role: string; imageUrl?: string }>({ name: '', role: '' });
  const [newPlayerImageFile, setNewPlayerImageFile] = useState<File | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerRole, setEditPlayerRole] = useState('');
  const [editPlayerImageUrl, setEditPlayerImageUrl] = useState<string | undefined>('');
  const [editPlayerImageFile, setEditPlayerImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ image: reader.result }),
          });
          if (!res.ok) {
            handleAuthError(res.status);
            reject(new Error('Upload failed'));
            return;
          }
          const data = await res.json();
          if (data.url) resolve(data.url);
          else reject(new Error(data.error || 'Upload failed'));
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const displayEventId = selectedEventId || (tournaments.find(t => t.active)?.id) || (tournaments[0]?.id);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [m, t, s, w, p, st] = await Promise.all([getMatches(true), getTournaments(), getSchedule(), getWeeks(), getPlayers(), getSettings()]);

      const todayStr = new Date().toISOString().split('T')[0];
      const itemsToCleanup = (s || []).filter(item => item.date < todayStr);
      if (itemsToCleanup.length > 0) {
        await Promise.all(itemsToCleanup.map(item => deleteScheduleItem(item.id)));
        const updatedSchedule = await getSchedule();
        setSchedule(updatedSchedule || []);
      } else {
        setSchedule(s || []);
      }

      setMatches(m || []);
      setTournaments(t || []);
      setWeeks(w || []);
      setPlayers(p || []);
      setSettings(st);
      if (t && t.length > 0) {
        const active = t.find(curr => curr.active);
        setSelectedEventId(active ? active.id : t[0].id);
        if (active) window.dispatchEvent(new CustomEvent('active_tournament_update', { detail: { name: active.name } }));
      }
    } catch (e) {
      showToast('Data sync failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleTabUpdate = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('admin_tab_change', handleTabUpdate);
    return () => window.removeEventListener('admin_tab_change', handleTabUpdate);
  }, []);

  useEffect(() => {
    const currentT = tournaments.find(t => t.id === displayEventId);
    if (currentT) {
      setEditRank(currentT.currentRank || 1);
      setEditRankDesc(currentT.rankDescription || 'Leading by 12 pts');
    }
  }, [tournaments, displayEventId]);

  const togglePlayer = (id: string) => {
    if (id === DID_NOT_PLAY_ID) {
      setSelectedPlayers([DID_NOT_PLAY_ID]);
      setKills({});
      setPosition(20);
      return;
    }

    if (selectedPlayers.includes(DID_NOT_PLAY_ID)) {
      setSelectedPlayers([id]);
      return;
    }

    if (selectedPlayers.includes(id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== id));
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, id]);
    }
  };

  const didNotPlaySelected = selectedPlayers.includes(DID_NOT_PLAY_ID);

  const calculateTotalPoints = () => {
    if (didNotPlaySelected) {
      return Math.max(0, compensationPoints || 0);
    }
    const killPoints = (Object.values(kills) as number[]).reduce((a, b) => a + (b || 0), 0);
    const posPoints = POSITION_POINTS[position] || 0;
    return killPoints + posPoints + (compensationPoints || 0);
  };

  const startEdit = (match: Match) => {
    setEditingMatchId(match.id);
    const isDidNotPlayMatch = (match as any).didNotPlay === true || (match.playingFour || []).includes(DID_NOT_PLAY_ID);
    const stats = match.playerStats || (match as any).players || [];
    
    const killMap: { [key: string]: number } = {};
    const matchedPlayerIds: string[] = [];

    stats.forEach((s: any) => {
      const rawId = (s.playerId || s.id || s.name || '').toString().trim();
      const pObj = players.find(p =>
        p.id.toLowerCase() === rawId.toLowerCase() ||
        p.name.toLowerCase() === rawId.toLowerCase() ||
        p.name.toUpperCase().replace(/^TE\.\s*/i, '').trim() === rawId.toUpperCase().replace(/^TE\.\s*/i, '').trim()
      );
      const targetId = pObj ? pObj.id : rawId;
      if (targetId) {
        killMap[targetId] = Number(s.kills) || 0;
        matchedPlayerIds.push(targetId);
      }
    });

    const initialPlayingFour = (match.playingFour && match.playingFour.length > 0)
      ? match.playingFour.map(pid => {
          const pObj = players.find(p => p.id.toLowerCase() === pid.toLowerCase() || p.name.toLowerCase() === pid.toLowerCase());
          return pObj ? pObj.id : pid;
        })
      : (matchedPlayerIds.length > 0 ? matchedPlayerIds : []);

    setSelectedPlayers(isDidNotPlayMatch ? [DID_NOT_PLAY_ID] : initialPlayingFour);
    setPosition(match.position);
    setMatchNumber(match.matchNumber);
    setSelectedEventId(match.tournamentId);
    setCompensationPoints((match as any).compensationPoints || 0);
    setMapName((match as any).mapName || 'BERMUDA');
    setDidNotPlayPlayer((match as any).didNotPlayPlayer || (isDidNotPlayMatch ? 'TEAM' : 'NONE'));
    setKills(killMap);
    setSelectedWeekId(match.weekId || '');
    setActiveTab('scoring');
    window.dispatchEvent(new CustomEvent('admin_tab_change', { detail: 'scoring' }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingMatchId(null);
    setSelectedPlayers([]);
    setKills({});
    setPosition(1);
    setCompensationPoints(0);
    setMapName('BERMUDA');
    setDidNotPlayPlayer('NONE');
    setMatchNumber(matches.length + 1);
    setSelectedEventId('');
    setSelectedWeekId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayEventId) {
      showToast('Select a tournament first', 'error');
      return;
    }

    const didNotPlay = didNotPlaySelected;

    if (!didNotPlay && selectedPlayers.length !== 4) {
      showToast('Select 4 players or DID NOT PLAY', 'error');
      return;
    }

    const stats: PlayerMatchStats[] = didNotPlay
      ? []
      : selectedPlayers.map(pid => ({
          playerId: pid,
          kills: kills[pid] || 0
        }));

    if (editingMatchId) {
      const matchToUpdate = matches.find(m => m.id === editingMatchId);
      if (matchToUpdate) {
        const updated: Match = {
          ...matchToUpdate,
          matchNumber,
          tournamentId: selectedEventId || displayEventId,
          weekId: selectedWeekId || undefined,
          position: didNotPlay ? 20 : position,
          playerStats: stats,
          players: stats,
          totalPoints: calculateTotalPoints(),
          playingFour: didNotPlay ? [DID_NOT_PLAY_ID] : selectedPlayers,
          didNotPlay,
          compensationPoints: compensationPoints || 0,
          mapName,
          didNotPlayPlayer
        } as Match;
        await updateMatch(updated);
        cancelEdit();
        showToast('Match updated');
        await loadData();
      }
    } else {
      const newMatch: Match = {
        id: Math.random().toString(36).substr(2, 9),
        tournamentId: selectedEventId || displayEventId,
        weekId: selectedWeekId || undefined,
        matchNumber: matchNumber,
        position: didNotPlay ? 20 : position,
        playerStats: stats,
        players: stats,
        totalPoints: calculateTotalPoints(),
        playingFour: didNotPlay ? [DID_NOT_PLAY_ID] : selectedPlayers,
        timestamp: Date.now(),
        approvalStatus: 'approved',
        didNotPlay,
        compensationPoints: compensationPoints || 0,
        mapName,
        didNotPlayPlayer
      } as Match;
      await saveMatch(newMatch);
      setKills({});
      setSelectedPlayers([]);
      setPosition(1);
      setCompensationPoints(0);
      setMapName('BERMUDA');
      setDidNotPlayPlayer('NONE');
      showToast('Match saved');
      await loadData();
    }
  };

  useEffect(() => {
    if (!editingMatchId && displayEventId) {
      const matching = matches.filter(m => m.tournamentId === displayEventId && (selectedWeekId ? m.weekId === selectedWeekId : true));
      setMatchNumber(matching.length + 1);
    }
  }, [displayEventId, selectedWeekId, matches, editingMatchId]);

  const handleCreateTournament = async (e: React.FormEvent) => { e.preventDefault(); if (!newTournament.name.trim()) return; await createTournament(newTournament); await loadData(); setNewTournament({ name: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], status: 'active', category: 'scrim' }); setShowTournamentForm(false); showToast('Tournament created'); };
  const handleUpdateLiveStandings = async (e: React.FormEvent) => { e.preventDefault(); const currentT = tournaments.find(t => t.id === displayEventId); if (!currentT) return; await updateTournament(currentT.id, { currentRank: editRank, rankDescription: editRankDesc }); await loadData(); };

  const handleCreatePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) return;
    setIsUploading(true);
    try {
      let imgUrl = newPlayer.imageUrl || '';
      if (newPlayerImageFile) {
        imgUrl = await uploadImage(newPlayerImageFile);
      }
      await createPlayer({
        name: newPlayer.name.trim().toUpperCase(),
        role: newPlayer.role.trim().toUpperCase() || 'OPERATIVE',
        imageUrl: imgUrl
      });
      setNewPlayer({ name: '', role: '', imageUrl: '' });
      setNewPlayerImageFile(null);
      showToast('Player created successfully');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create player', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdatePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayerId || !editPlayerName.trim()) return;
    setIsUploading(true);
    try {
      let imgUrl = editPlayerImageUrl || '';
      if (editPlayerImageFile) {
        imgUrl = await uploadImage(editPlayerImageFile);
      }
      await updatePlayer(editingPlayerId, {
        name: editPlayerName.trim().toUpperCase(),
        role: editPlayerRole.trim().toUpperCase(),
        imageUrl: imgUrl
      });
      setEditingPlayerId(null);
      setEditPlayerName('');
      setEditPlayerRole('');
      setEditPlayerImageUrl('');
      setEditPlayerImageFile(null);
      showToast('Player updated');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update player', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleActivateTournament = async (t: Tournament) => {
    await setActiveTournament(t.id, t.category);
    showToast(`${t.name} set as LIVE tournament`);
    await loadData();
  };

  const handleUpdateTournamentSubmit = async (id: string, name: string, category: 'scrim' | 'official') => {
    if (!name.trim()) return;
    await updateTournament(id, { name: name.trim(), category });
    setEditingTournamentId(null);
    showToast('Tournament updated');
    await loadData();
  };

  const handleDeleteTournamentAction = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete tournament "${name}" and all associated matches?`)) {
      await deleteTournament(id);
      showToast('Tournament deleted');
      await loadData();
    }
  };

  const handleDeletePlayerAction = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete player "${name}"?`)) {
      await deletePlayer(id);
      showToast('Player removed from roster');
      await loadData();
    }
  };

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="font-blanka text-blue-500 animate-pulse text-xs tracking-widest">ESTABLISHING UPLINK...</div></div>;

  const activeMatches = matches
    .filter(m => m.tournamentId === displayEventId)
    .filter(m => selectedWeekId ? m.weekId === selectedWeekId : true)
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="min-h-screen pb-20">
      <div className="w-full">
        <main className="min-h-[600px] min-w-0 overflow-hidden w-full">
          {activeTab === 'scoring' && (
            <div className="space-y-8 animate-slide-up">
              {/* Header Bar */}
              <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between border-b border-zinc-800/60 pb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-blanka text-white uppercase tracking-wider">
                    TACTICAL SCORING
                  </h2>
                  <p className="text-zinc-500 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">
                    OPERATIONAL TOURNAMENT DATA ENTRY
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  {/* ACTIVE AREA Dropdown */}
                  <div className="flex items-center gap-2.5 bg-zinc-900/80 px-3.5 py-2 rounded-2xl border border-zinc-800 shadow-inner">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">ACTIVE AREA:</span>
                    <select
                      value={displayEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="bg-transparent border-none text-blue-400 text-[10px] font-black uppercase outline-none cursor-pointer max-w-[220px] truncate"
                    >
                      {tournaments.filter(t => t.status !== 'completed').map(t => (
                        <option key={t.id} value={t.id} className="bg-zinc-950 text-white">
                          {t.name} {t.active ? '(LIVE)' : ''} [{t.category === 'official' ? 'OFFICIAL' : 'SCRIM'}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* WEEK Dropdown */}
                  <div className="flex items-center gap-2 bg-zinc-900/80 px-3.5 py-2 rounded-2xl border border-zinc-800 shadow-inner">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">WEEK:</span>
                    <select
                      value={selectedWeekId}
                      onChange={(e) => setSelectedWeekId(e.target.value)}
                      className="bg-transparent border-none text-zinc-300 text-[10px] font-bold uppercase outline-none cursor-pointer max-w-[160px] truncate"
                    >
                      <option value="" className="bg-zinc-950 text-white">General (No Week)</option>
                      {weeks.filter(w => w.tournamentId === displayEventId).map(w => (
                        <option key={w.id} value={w.id} className="bg-zinc-950 text-white">{w.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!displayEventId) {
                          showToast('Select a tournament first', 'error');
                          return;
                        }
                        const wName = prompt('Enter Week Name (e.g., Week 1, Week 2, Grand Finals):');
                        if (!wName || !wName.trim()) return;
                        const currentWeeks = weeks.filter(w => w.tournamentId === displayEventId);
                        await createWeek({
                          tournamentId: displayEventId,
                          name: wName.trim(),
                          order: currentWeeks.length + 1
                        });
                        await loadData();
                        showToast(`Created ${wName.trim()}`);
                      }}
                      className="ml-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-[8px] font-black tracking-widest transition-all cursor-pointer whitespace-nowrap"
                      title="Add a new week for this tournament"
                    >
                      + WEEK
                    </button>
                  </div>

                  {/* RANK & DESC Form */}
                  <form onSubmit={handleUpdateLiveStandings} className="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-1.5 pl-1">
                      <span className="text-[9px] font-black text-emerald-500 uppercase">RANK:</span>
                      <input
                        type="number"
                        value={editRank}
                        onChange={(e) => setEditRank(Number(e.target.value))}
                        className="w-10 bg-zinc-950 border border-zinc-800 rounded-xl py-1 px-1.5 text-center text-emerald-400 text-[10px] font-blanka outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={editRankDesc}
                      onChange={(e) => setEditRankDesc(e.target.value)}
                      placeholder="Rank description"
                      className="w-24 sm:w-32 bg-zinc-950 border border-zinc-800 rounded-xl py-1 px-2.5 text-zinc-200 text-[9px] font-bold outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-blanka px-3 py-1.5 rounded-xl text-[8px] tracking-widest transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      SAVE
                    </button>
                  </form>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* STRATEGIC ROSTER CARD */}
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                      <h3 className="font-blanka text-lg md:text-xl text-white uppercase tracking-wider">
                        STRATEGIC ROSTER
                      </h3>
                    </div>
                    <span className="px-4 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-full text-[9px] font-black text-zinc-400 tracking-widest uppercase shadow-inner">
                      {didNotPlaySelected ? '0/4 OPERATIVES (DID NOT PLAY)' : `${selectedPlayers.length}/4 OPERATIVES`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                    {players.map((player: Player) => {
                      const isSelected = selectedPlayers.includes(player.id);
                      const cleanName = player.name.replace(/^TE\.\s*/i, '');
                      return (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => togglePlayer(player.id)}
                          disabled={didNotPlaySelected}
                          className={`flex flex-col items-center p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all duration-300 ${
                            isSelected
                              ? 'border-blue-500/80 bg-blue-600/15 shadow-xl shadow-blue-500/10 scale-[1.02]'
                              : 'border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
                          } ${didNotPlaySelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden mb-3 bg-zinc-900 p-1 border transition-all ${
                            isSelected ? 'border-blue-400 shadow-md shadow-blue-500/30' : 'border-zinc-800'
                          }`}>
                            <img
                              src={player.imageUrl || '/placeholder.png'}
                              alt={player.name}
                              className="w-full h-full object-cover rounded-xl"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <p className={`text-xs md:text-sm font-blanka tracking-wider uppercase ${
                            isSelected ? 'text-white' : 'text-zinc-300'
                          }`}>
                            {cleanName}
                          </p>
                          <p className="text-[7px] md:text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5 text-center">
                            {player.role}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* NEURAL FEEDBACK & MISSION PARAMETERS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  {/* NEURAL FEEDBACK */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md flex flex-col justify-between min-h-[320px]">
                    <div>
                      <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        <h3 className="font-blanka text-lg text-white uppercase tracking-wider">
                          NEURAL FEEDBACK
                        </h3>
                      </div>

                      {didNotPlaySelected ? (
                        <div className="py-16 text-center border-2 border-dashed border-red-900/40 rounded-2xl bg-red-950/10">
                          <p className="text-xs font-blanka text-red-400 uppercase tracking-widest">
                            DID NOT PLAY SELECTED
                          </p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider mt-2">
                            No operative kill entry required
                          </p>
                        </div>
                      ) : selectedPlayers.length > 0 ? (
                        <div className="space-y-3">
                          {selectedPlayers.map(pid => {
                            const player = players.find((p: Player) => p.id === pid);
                            const cleanName = player?.name.replace(/^TE\.\s*/i, '') || pid;
                            return (
                              <div
                                key={pid}
                                className="flex items-center justify-between p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80"
                              >
                                <div className="flex items-center gap-3">
                                  {player?.imageUrl && (
                                    <img
                                      src={player.imageUrl}
                                      alt={cleanName}
                                      className="w-9 h-9 rounded-xl object-cover border border-zinc-800"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <div>
                                    <p className="text-xs font-blanka text-white uppercase tracking-wider">
                                      {cleanName}
                                    </p>
                                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                                      {player?.role}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">KILLS:</span>
                                  <input
                                    type="number"
                                    value={kills[pid] || 0}
                                    onChange={(e) => setKills({ ...kills, [pid]: parseInt(e.target.value) || 0 })}
                                    className="w-16 bg-zinc-900 border border-zinc-800 rounded-xl py-2 text-center text-white font-blanka text-xs outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-20 text-center border-2 border-dashed border-zinc-800/80 rounded-2xl flex items-center justify-center">
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
                            AWAITING OPERATIVE SELECTION
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MISSION PARAMETERS */}
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center gap-2.5 mb-6">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        <h3 className="font-blanka text-lg text-white uppercase tracking-wider">
                          MISSION PARAMETERS
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">
                            RANK
                          </label>
                          <select
                            value={position}
                            onChange={(e) => setPosition(parseInt(e.target.value))}
                            disabled={didNotPlaySelected}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-3.5 text-white font-blanka text-xs outline-none focus:border-blue-500 disabled:opacity-40"
                          >
                            {Array.from({ length: 20 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>#{i + 1}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">
                            MATCH #
                          </label>
                          <input
                            type="number"
                            value={matchNumber}
                            onChange={(e) => setMatchNumber(parseInt(e.target.value) || 1)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-3.5 text-white font-blanka text-xs outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">
                            COMPENSATION PTS
                          </label>
                          <input
                            type="number"
                            value={compensationPoints}
                            onChange={(e) => setCompensationPoints(parseInt(e.target.value) || 0)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-3.5 text-white font-blanka text-xs outline-none focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">
                            MAP NAME
                          </label>
                          <select
                            value={mapName}
                            onChange={(e) => setMapName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-3.5 text-white font-blanka text-xs outline-none focus:border-blue-500 uppercase"
                          >
                            <option value="BERMUDA">BERMUDA</option>
                            <option value="KALAHARI">KALAHARI</option>
                            <option value="SOLARA">SOLARA</option>
                            <option value="NEXTERRA">NEXTERRA</option>
                            <option value="PURGATORY">PURGATORY</option>
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">
                            DID NOT PLAY
                          </label>
                          <select
                            value={didNotPlayPlayer}
                            onChange={(e) => {
                              setDidNotPlayPlayer(e.target.value);
                              if (e.target.value === 'TEAM') {
                                togglePlayer(DID_NOT_PLAY_ID);
                              } else if (didNotPlaySelected && e.target.value !== 'TEAM') {
                                setSelectedPlayers([]);
                              }
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-3.5 text-white font-blanka text-xs outline-none focus:border-blue-500 uppercase"
                          >
                            <option value="NONE">NONE</option>
                            <option value="TEAM">ENTIRE TEAM</option>
                            {players.map(p => (
                              <option key={p.id} value={p.name}>{p.name.replace(/^TE\.\s*/i, '')}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* TOTAL PTS DISPLAY */}
                      <div className="mt-6 bg-blue-950/20 border border-blue-500/30 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            TOTAL PTS
                          </p>
                          <p className="text-3xl md:text-4xl font-blanka text-blue-400 mt-1">
                            {calculateTotalPoints()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-black text-blue-500/60 uppercase tracking-[0.2em] block">
                            NEURAL PROCESSING
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SAVE TEAM DATA ACTION BUTTON */}
                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-blanka text-xs tracking-[0.2em] transition-all uppercase shadow-lg shadow-blue-600/25 active:scale-[0.99] cursor-pointer"
                >
                  {editingMatchId ? 'UPDATE TEAM DATA' : 'SAVE TEAM DATA'}
                </button>
              </form>

              {/* RECENT ENTRIES LIST */}
              {activeMatches.length > 0 && (
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md mt-8">
                  <div className="flex items-center gap-2 mb-6">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-blanka text-xs text-zinc-400 uppercase tracking-widest">
                      RECENT ENTRIES ({tournaments.find(t => t.id === displayEventId)?.name || 'ACTIVE TOURNAMENT'})
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {activeMatches.slice(0, 10).map(match => (
                      <div key={match.id} className="flex items-center justify-between p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/60 hover:border-zinc-700 transition-all">
                        <div className="flex items-center gap-4 text-xs font-blanka">
                          <span className="text-zinc-400">M{match.matchNumber}</span>
                          {match.weekId && (
                            <span className="text-[8px] font-extrabold px-2 py-0.5 bg-blue-950/60 text-blue-400 rounded border border-blue-500/30 uppercase">
                              {weeks.find(w => w.id === match.weekId)?.name || 'WEEK'}
                            </span>
                          )}
                          {(match as any).didNotPlay ? (
                            <span className="text-[10px] text-red-400">DID NOT PLAY</span>
                          ) : (
                            <>
                              <span className="text-emerald-400">#{match.position}</span>
                              <span className="text-blue-400">{match.playerStats.reduce((s, p) => s + p.kills, 0)} KILLS</span>
                            </>
                          )}
                          {(match as any).compensationPoints ? (
                            <span className="text-[10px] text-amber-400">+{(match as any).compensationPoints} COMP</span>
                          ) : null}
                          <span className="text-white">{match.totalPoints} PTS</span>
                        </div>

                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-wider">
                          <button
                            type="button"
                            onClick={() => startEdit(match)}
                            className="text-zinc-400 hover:text-blue-400 transition-colors"
                          >
                            EDIT
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm('Delete this match entry?')) {
                                await deleteMatch(match.id);
                                loadData();
                              }
                            }}
                            className="text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            DEL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div className="space-y-8 animate-slide-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/60 pb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-blanka text-white uppercase tracking-wider">
                    TOURNAMENTS MANAGER
                  </h2>
                  <p className="text-zinc-500 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">
                    CREATE, ACTIVATE & CONTROL COMPETITIVE HUBS
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTournamentForm(!showTournamentForm)}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-blanka text-xs tracking-wider transition-all uppercase shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  {showTournamentForm ? 'CANCEL' : '+ NEW TOURNAMENT'}
                </button>
              </div>

              {/* CREATE TOURNAMENT FORM */}
              {showTournamentForm && (
                <form onSubmit={handleCreateTournament} className="bg-zinc-900/60 border border-blue-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-6">
                  <h3 className="font-blanka text-sm text-blue-400 uppercase tracking-widest">NEW TOURNAMENT CONFIGURATION</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">TOURNAMENT NAME</label>
                      <input
                        type="text"
                        value={newTournament.name}
                        onChange={e => setNewTournament({ ...newTournament, name: e.target.value })}
                        placeholder="e.g. Free Fire India Championship 2026"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-white font-blanka text-xs outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">CATEGORY</label>
                      <select
                        value={newTournament.category}
                        onChange={e => setNewTournament({ ...newTournament, category: e.target.value as 'scrim' | 'official' })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-white font-blanka text-xs outline-none focus:border-blue-500"
                      >
                        <option value="scrim">SCRIMS / UNOFFICIAL</option>
                        <option value="official">OFFICIAL TOURNAMENT</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">STATUS</label>
                      <select
                        value={newTournament.status}
                        onChange={e => setNewTournament({ ...newTournament, status: e.target.value as any })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-white font-blanka text-xs outline-none focus:border-blue-500"
                      >
                        <option value="active">ACTIVE / UPCOMING</option>
                        <option value="completed">COMPLETED / ARCHIVED</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-blanka text-xs tracking-widest uppercase transition-all shadow-lg shadow-blue-600/20 cursor-pointer">
                    CREATE TOURNAMENT
                  </button>
                </form>
              )}

              {/* FILTER BAR */}
              <div className="flex items-center gap-2 bg-zinc-900/60 p-2 rounded-2xl border border-zinc-800 w-fit">
                {(['all', 'official', 'scrim', 'done'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTournamentFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-blanka tracking-widest uppercase transition-all cursor-pointer ${
                      tournamentFilter === filter
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    {filter === 'done' ? 'ARCHIVED' : filter.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* TOURNAMENTS LIST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournaments
                  .filter(t => {
                    if (tournamentFilter === 'official') return t.category === 'official';
                    if (tournamentFilter === 'scrim') return (t.category || 'scrim') === 'scrim';
                    if (tournamentFilter === 'done') return t.status === 'completed';
                    return true;
                  })
                  .map(t => {
                    const isEditing = editingTournamentId === t.id;
                    const tournamentMatchCount = matches.filter(m => m.tournamentId === t.id).length;
                    const tWeeks = weeks.filter(w => w.tournamentId === t.id);

                    return (
                      <div key={t.id} className={`p-6 md:p-8 rounded-3xl border transition-all ${t.active ? 'bg-zinc-900/80 border-blue-500/50 shadow-xl shadow-blue-500/5' : 'bg-zinc-900/40 border-zinc-800/80'}`}>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${t.category === 'official' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                              {t.category === 'official' ? 'OFFICIAL' : 'SCRIM'}
                            </span>
                            {t.active ? (
                              <span className="px-2.5 py-1 rounded-full text-[8px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[8px] font-black bg-zinc-800 text-zinc-500 uppercase tracking-wider">
                                {t.status === 'completed' ? 'ARCHIVED' : 'INACTIVE'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {!t.active && (
                              <button
                                type="button"
                                onClick={() => handleActivateTournament(t)}
                                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl text-[8px] font-blanka tracking-wider uppercase transition-all cursor-pointer"
                              >
                                SET LIVE
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditing) {
                                  setEditingTournamentId(null);
                                } else {
                                  setEditingTournamentId(t.id);
                                  setEditTournamentNameValue(t.name);
                                }
                              }}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[8px] font-blanka tracking-wider uppercase transition-all cursor-pointer"
                            >
                              {isEditing ? 'CANCEL' : 'EDIT'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTournamentAction(t.id, t.name)}
                              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-[8px] font-blanka tracking-wider uppercase transition-all cursor-pointer"
                            >
                              DEL
                            </button>
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-3 mb-4">
                            <input
                              type="text"
                              value={editTournamentNameValue}
                              onChange={e => setEditTournamentNameValue(e.target.value)}
                              className="w-full bg-zinc-950 border border-blue-500 rounded-xl p-3 text-white font-blanka text-xs outline-none"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateTournamentSubmit(t.id, editTournamentNameValue, t.category || 'scrim')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-blanka uppercase"
                              >
                                SAVE
                              </button>
                            </div>
                          </div>
                        ) : (
                          <h3 className="text-xl font-blanka text-white uppercase tracking-wide mb-2">{t.name}</h3>
                        )}

                        <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500 border-t border-zinc-800/60 pt-4 mt-4">
                          <span>{tournamentMatchCount} MATCHES LOGGED</span>
                          <span>{tWeeks.length} WEEKS</span>
                        </div>

                        {/* WEEKS SECTION FOR OFFICIAL TOURNAMENTS */}
                        {t.category === 'official' && (
                          <div className="mt-4 pt-4 border-t border-zinc-800/60 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-blanka text-purple-400 uppercase tracking-wider">WEEKS / PHASES</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  const name = prompt('Enter Week Name (e.g. Week 1, Week 2, Grand Finals):');
                                  if (!name || !name.trim()) return;
                                  await createWeek({ tournamentId: t.id, name: name.trim(), order: tWeeks.length + 1 });
                                  await loadData();
                                  showToast(`Created ${name.trim()}`);
                                }}
                                className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer"
                              >
                                + ADD WEEK
                              </button>
                            </div>

                            {tWeeks.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {tWeeks.map(w => (
                                  <div key={w.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-[9px] text-zinc-300 font-blanka">
                                    <span>{w.name}</span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (confirm(`Delete ${w.name}?`)) {
                                          await deleteWeek(w.id);
                                          await loadData();
                                          showToast('Week removed');
                                        }
                                      }}
                                      className="text-zinc-600 hover:text-red-400 transition-colors ml-1 font-sans font-bold"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[8px] text-zinc-600 italic uppercase">No weeks added yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'players' && (
            <div className="space-y-8 animate-slide-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/60 pb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-blanka text-white uppercase tracking-wider">
                    ROSTER & OPERATIVES
                  </h2>
                  <p className="text-zinc-500 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">
                    MANAGE TEAM MEMBERS & AVATARS
                  </p>
                </div>
              </div>

              {/* ADD NEW PLAYER FORM */}
              <form onSubmit={handleCreatePlayerSubmit} className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md space-y-6">
                <h3 className="font-blanka text-sm text-blue-400 uppercase tracking-widest">ADD NEW OPERATIVE</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">NAME</label>
                    <input
                      type="text"
                      value={newPlayer.name}
                      onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })}
                      placeholder="e.g. PAHADI"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-white font-blanka text-xs outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">ROLE</label>
                    <input
                      type="text"
                      value={newPlayer.role}
                      onChange={e => setNewPlayer({ ...newPlayer, role: e.target.value })}
                      placeholder="e.g. SNIPER / IGL"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-white font-blanka text-xs outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">AVATAR IMAGE</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setNewPlayerImageFile(e.target.files?.[0] || null)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-2.5 text-zinc-400 text-xs outline-none focus:border-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-blanka file:bg-blue-600 file:text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-blanka text-xs tracking-widest uppercase transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  {isUploading ? 'UPLOADING...' : 'ADD OPERATIVE TO ROSTER'}
                </button>
              </form>

              {/* PLAYERS LIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.map(p => {
                  const isEditingThisPlayer = editingPlayerId === p.id;
                  const playerMatchCount = matches.filter(m => m.playerStats.some(ps => ps.playerId === p.id)).length;
                  const totalKills = matches.reduce((acc, m) => {
                    const stat = m.playerStats.find(ps => ps.playerId === p.id);
                    return acc + (stat?.kills || 0);
                  }, 0);

                  return (
                    <div key={p.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between space-y-4">
                      {isEditingThisPlayer ? (
                        <form onSubmit={handleUpdatePlayerSubmit} className="space-y-4">
                          <input
                            type="text"
                            value={editPlayerName}
                            onChange={e => setEditPlayerName(e.target.value)}
                            className="w-full bg-zinc-950 border border-blue-500 rounded-2xl p-3 text-white font-blanka text-xs outline-none"
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            value={editPlayerRole}
                            onChange={e => setEditPlayerRole(e.target.value)}
                            className="w-full bg-zinc-950 border border-blue-500 rounded-2xl p-3 text-white font-blanka text-xs outline-none"
                            placeholder="Role"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => setEditPlayerImageFile(e.target.files?.[0] || null)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-2 text-zinc-400 text-xs"
                          />
                          <div className="flex gap-2">
                            <button type="submit" disabled={isUploading} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-blanka uppercase">
                              SAVE
                            </button>
                            <button type="button" onClick={() => setEditingPlayerId(null)} className="py-2 px-4 bg-zinc-800 text-zinc-400 rounded-xl text-[9px] font-blanka uppercase">
                              CANCEL
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center font-blanka text-lg text-blue-500 shrink-0">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{p.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-blanka text-white uppercase truncate">{p.name}</h3>
                              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">{p.role}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/60 text-center">
                            <div>
                              <p className="text-[7px] font-black text-zinc-500 uppercase">KILLS</p>
                              <p className="text-lg font-blanka text-emerald-400">{totalKills}</p>
                            </div>
                            <div>
                              <p className="text-[7px] font-black text-zinc-500 uppercase">MATCHES</p>
                              <p className="text-lg font-blanka text-blue-400">{playerMatchCount}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPlayerId(p.id);
                                setEditPlayerName(p.name);
                                setEditPlayerRole(p.role);
                                setEditPlayerImageUrl(p.imageUrl);
                              }}
                              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[9px] font-blanka uppercase transition-all"
                            >
                              EDIT
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePlayerAction(p.id, p.name)}
                              className="py-2 px-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-[9px] font-blanka uppercase transition-all"
                            >
                              DEL
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-8 animate-slide-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/60 pb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-blanka text-white uppercase tracking-wider">
                    OPERATIONAL LEDGER
                  </h2>
                  <p className="text-zinc-500 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">
                    ALL HISTORICAL MATCH RECORDS & AUDIT LOGS
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900/60 p-2 rounded-2xl border border-zinc-800">
                  {(['all', 'official', 'scrim'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setLedgerCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-blanka tracking-widest uppercase transition-all cursor-pointer ${
                        ledgerCategoryFilter === cat
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* MATCHES TABLE / LIST */}
              {matches.filter(m => {
                if (ledgerCategoryFilter === 'all') return true;
                const t = tournaments.find(tour => tour.id === m.tournamentId);
                return (t?.category || 'scrim') === ledgerCategoryFilter;
              }).length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                  <p className="text-xs font-blanka text-zinc-500 uppercase tracking-widest">NO MATCH ENTRIES FOUND IN LEDGER</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches
                    .filter(m => {
                      if (ledgerCategoryFilter === 'all') return true;
                      const t = tournaments.find(tour => tour.id === m.tournamentId);
                      return (t?.category || 'scrim') === ledgerCategoryFilter;
                    })
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map(match => {
                      const t = tournaments.find(tour => tour.id === match.tournamentId);
                      const week = weeks.find(w => w.id === match.weekId);
                      const isExpanded = expandedMatchId === match.id;
                      const totalKills = match.playerStats.reduce((acc, p) => acc + p.kills, 0);

                      return (
                        <div key={match.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 md:p-6 backdrop-blur-md space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-blanka text-blue-400">M{match.matchNumber}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-blanka text-white uppercase">{t?.name || 'UNASSIGNED TOURNAMENT'}</span>
                                  <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${t?.category === 'official' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {t?.category === 'official' ? 'OFFICIAL' : 'SCRIM'}
                                  </span>
                                  {week && (
                                    <span className="px-2 py-0.5 rounded text-[7px] font-black bg-zinc-800 text-zinc-300 uppercase">
                                      {week.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                                  MAP: {(match as any).map || 'BERMUDA'} • {new Date(match.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-blanka">
                              {(match as any).didNotPlay ? (
                                <span className="text-red-400 text-[10px]">DID NOT PLAY</span>
                              ) : (
                                <>
                                  <div className="text-center">
                                    <p className="text-[7px] text-zinc-500 font-bold">RANK</p>
                                    <p className="text-emerald-400">#{match.position}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[7px] text-zinc-500 font-bold">KILLS</p>
                                    <p className="text-blue-400">{totalKills}</p>
                                  </div>
                                </>
                              )}
                              <div className="text-center">
                                <p className="text-[7px] text-zinc-500 font-bold">TOTAL PTS</p>
                                <p className="text-white">{match.totalPoints}</p>
                              </div>

                              <div className="flex items-center gap-2 ml-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[8px] font-blanka uppercase"
                                >
                                  {isExpanded ? 'HIDE' : 'DETAILS'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEdit(match)}
                                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-[8px] font-blanka uppercase"
                                >
                                  EDIT
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm('Delete this match entry from ledger?')) {
                                      await deleteMatch(match.id);
                                      await loadData();
                                      showToast('Match deleted');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-[8px] font-blanka uppercase"
                                >
                                  DEL
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* EXPANDED DETAILS */}
                          {isExpanded && (
                            <div className="pt-3 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/60 p-4 rounded-xl">
                              {match.playerStats.map(ps => {
                                const p = players.find(pl => pl.id === ps.playerId);
                                return (
                                  <div key={ps.playerId} className="flex items-center justify-between text-xs">
                                    <span className="font-blanka text-zinc-300 uppercase">{p?.name || ps.playerId}:</span>
                                    <span className="font-blanka text-blue-400">{ps.kills} KILLS</span>
                                  </div>
                                );
                              })}
                              {(match as any).compensationPoints ? (
                                <div className="col-span-2 sm:col-span-4 text-[9px] font-bold text-amber-400">
                                  +{(match as any).compensationPoints} COMPENSATION POINTS INCLUDED
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="animate-slide-up">
              <AdminSessions />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
