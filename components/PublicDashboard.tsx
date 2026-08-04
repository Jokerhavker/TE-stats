
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getMatches, getTournaments, getDashboardView, setDashboardView, getPlayers, getWeeks, getSettings } from '@/services/stateManager';
import { Match, Player, Tournament, TournamentWeek, SystemSettings } from '@/types';
import { INITIAL_PLAYERS, POSITION_POINTS } from '@/constants';


// Animated number counter hook
const useCountUp = (target: number, duration: number = 1200) => {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (target === prevTarget.current && count === target) return;
    prevTarget.current = target;

    let start = 0;
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return count;
};
// Radar empty state component
const RadarEmptyState = ({ message }: { message: string }) => (
  <div className="py-16 flex flex-col items-center justify-center gap-6">
    <div className="radar-container">
      <div className="radar-ring" />
      <div className="radar-ring" />
      <div className="radar-ring" />
      <div className="radar-sweep" />
      <div className="radar-dot" style={{ top: '25%', left: '65%', animationDelay: '0.5s' }} />
      <div className="radar-dot" style={{ top: '60%', left: '30%', animationDelay: '1.5s' }} />
      <div className="radar-dot" style={{ top: '40%', left: '75%', animationDelay: '2.2s' }} />
    </div>
    <div className="text-center space-y-2">
      <p className="font-michroma text-[10px] tracking-widest text-zinc-500 uppercase">{message}</p>
      <p className="text-[9px] text-zinc-700 tracking-wider">Waiting for update...</p>
    </div>
  </div>
);
const PublicDashboard: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatchStats, setSelectedMatchStats] = useState<Match | null>(null);
  const [selectedHistoryTournament, setSelectedHistoryTournament] = useState<Tournament | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'tournamentHistory' | 'teams'>(getDashboardView() as any);
  const [activeCategory, setActiveCategory] = useState<'official' | 'scrim'>(
    () => (typeof window !== 'undefined' && sessionStorage.getItem('te_category') as 'official' | 'scrim') || 'scrim'
  );
  const [weeks, setWeeks] = useState<TournamentWeek[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('overall');
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [overallStats, setOverallStats] = useState<Record<string, { kills: number; played: number }>>({});
  const [isFetchingOverallStats, setIsFetchingOverallStats] = useState(false);

  useEffect(() => {
    if (selectedTournamentId === 'overall') {
      const fetchOverallStats = async () => {
        setIsFetchingOverallStats(true);
        try {
          const res = await fetch(`/api/players/stats?category=${activeCategory}`);
          const data = await res.json();
          setOverallStats(data || {});
        } catch (e) {
          console.error("Failed to fetch overall stats", e);
        } finally {
          setIsFetchingOverallStats(false);
        }
      };
      fetchOverallStats();
    }
  }, [selectedTournamentId, activeCategory]);

  useEffect(() => {
    if (!tournaments.length) {
      if (selectedTournamentId) setSelectedTournamentId('');
      return;
    }

    const inCategory = tournaments.filter(t => (t.category || 'scrim') === activeCategory);
    if (!inCategory.length) {
      if (selectedTournamentId) setSelectedTournamentId('');
      return;
    }

    const stillValid = inCategory.some(t => t.id === selectedTournamentId);
    if (!stillValid) {
      const activeInCategory = inCategory.find(t => t.active);
      setSelectedTournamentId((activeInCategory || inCategory[0]).id);
    }
  }, [tournaments, activeCategory, selectedTournamentId]);

  const hasInitializedCategory = useRef(false);

  const refreshData = async () => {
    try {
      const [m, t, p, w, st] = await Promise.all([getMatches(), getTournaments(), getPlayers(), getWeeks(), getSettings()]);
      setMatches(m || []);
      setTournaments(t || []);
      setPlayers(p || []);
      setWeeks(w || []);
      setSettings(st);

      // Auto-set the category on initial load based on active tournaments
      if (!hasInitializedCategory.current) {
        hasInitializedCategory.current = true;
        const savedCategory = typeof window !== 'undefined' ? sessionStorage.getItem('te_category') : null;
        if (!savedCategory) {
          const activeTournaments = (t || []).filter(curr => curr.active).sort((a, b) => b.createdAt - a.createdAt);
          if (activeTournaments.length > 0) {
            setActiveCategory(activeTournaments[0].category || 'scrim');
          }
        }
      }

      // Only set initial tournament on first load (never override user's manual selection)
      if (!selectedTournamentId) {
        const activeT = (t || []).find(curr => curr.active);
        if (activeT) setSelectedTournamentId(activeT.id);
      }

      setCurrentView(getDashboardView() as any);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('storage_update', refreshData);
    const interval = setInterval(refreshData, 10000);
    return () => {
      window.removeEventListener('storage_update', refreshData);
      clearInterval(interval);
    };
  }, []);

  const categoryTournaments = tournaments
    .filter(t => (t.category || 'scrim') === activeCategory)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const rosterPlayers = players.length > 0 ? players : INITIAL_PLAYERS;
  const displayTournament = selectedTournamentId === 'overall' 
    ? { id: 'overall', name: 'OVERALL LIFETIME STATS', category: activeCategory, active: false, createdAt: 0 } as Tournament
    : (selectedTournamentId ? categoryTournaments.find(t => t.id === selectedTournamentId) : null)
      || categoryTournaments[0]
      || tournaments.find(t => t.id === selectedTournamentId)
      || tournaments[0];

  const tournamentWeeks = weeks
    .filter(w => w.tournamentId === displayTournament?.id)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    const isOfficial = (displayTournament?.category || activeCategory) === 'official';
    if (!isOfficial || !displayTournament) {
      if (selectedWeekId !== 'overall') setSelectedWeekId('overall');
      return;
    }

    if (
      selectedWeekId !== 'overall' &&
      !tournamentWeeks.some(w => w.id === selectedWeekId)
    ) {
      setSelectedWeekId('overall');
    }
  }, [activeCategory, displayTournament?.id, displayTournament?.category, selectedWeekId, weeks]);

  const isOfficialTournament = (displayTournament?.category || activeCategory) === 'official';

  const tournamentMatches = matches
    .filter(m => m.tournamentId === displayTournament?.id || (!m.tournamentId && !!displayTournament))
    .filter(m => isOfficialTournament && selectedWeekId !== 'overall' ? m.weekId === selectedWeekId : true)
    .sort((a, b) => b.matchNumber - a.matchNumber);

  const lastMatch = tournamentMatches[0];
  const lastMatchTotalPoints = lastMatch?.totalPoints || 0;
  const lastMatchKills = (lastMatch?.playerStats || (lastMatch as any)?.players || []).reduce((acc: number, p: any) => acc + (p.kills || 0), 0) || 0;
  const lastMatchPlacementPts = lastMatch ? (POSITION_POINTS[lastMatch.position] || 0) : 0;

  // Dynamically combine rosterPlayers with any substitutes found in the match data
  const activePlayers = [...rosterPlayers];
  tournamentMatches.forEach(m => {
    (m.playerStats || (m as any).players || []).forEach((ps: any) => {
      const raw = (ps.playerId || ps.id || ps.name || '').toString().trim();
      if (!raw) return;
      const lowerRaw = raw.toLowerCase();
      if (!activePlayers.some(p => 
        p.id.toLowerCase() === lowerRaw || 
        p.name.toLowerCase() === lowerRaw ||
        p.name.replace(/^TE\.\s*/i, '').trim().toLowerCase() === lowerRaw.replace(/^TE\.\s*/i, '').trim()
      )) {
        activePlayers.push({
          id: raw,
          name: raw.toUpperCase(),
          role: 'SUBSTITUTE',
          imageUrl: ''
        });
      }
    });
  });

  // Shared helper — resolves any player stat entry to a roster or substitute player
  const resolvePlayer = (ps: any) =>
    activePlayers.find(p => {
      const raw = (ps.playerId || ps.id || ps.name || '').toString().trim().toLowerCase();
      return (
        p.id.toLowerCase() === raw ||
        p.name.toLowerCase() === raw ||
        p.name.replace(/^TE\.\s*/i, '').trim().toLowerCase() === raw.replace(/^TE\.\s*/i, '').trim()
      );
    });

  // Points + kills totals for a given tournament (used by stat cards & history cards)
  const calculateTournamentStats = (tId: string) => {
    const isOff = (tournaments.find(t => t.id === tId)?.category || activeCategory) === 'official';
    const relevant = matches
      .filter(m => m.tournamentId === tId || (!m.tournamentId && !!tId))
      .filter(m => isOff && selectedWeekId !== 'overall' ? m.weekId === selectedWeekId : true);

    const playerTotals: Record<string, number> = Object.fromEntries(activePlayers.map(p => [p.id, 0]));
    relevant.forEach(m =>
      (m.playerStats || (m as any).players || []).forEach((ps: any) => {
        const player = resolvePlayer(ps);
        if (player) playerTotals[player.id] = (playerTotals[player.id] || 0) + (Number(ps.kills) || 0);
      })
    );

    return {
      playerTotals,
      totalPoints: relevant.reduce((sum, m) => sum + (m.totalPoints || 0), 0),
      count: relevant.length,
    };
  };

  // Per-player kills & matches played — scoped to current tournament & week
  const calcPlayerStats = () => {
    const stats: Record<string, { kills: number; played: number }> = Object.fromEntries(
      activePlayers.map(p => [p.id, { kills: 0, played: 0 }])
    );
    tournamentMatches.forEach(m =>
      (m.playerStats || (m as any).players || []).forEach((ps: any) => {
        const player = resolvePlayer(ps);
        if (player) {
          stats[player.id].kills += Number(ps.kills) || 0;
          stats[player.id].played += 1;
        }
      })
    );
    return stats;
  };

  const currentStats = calculateTournamentStats(displayTournament?.id || '');
  const playerStats = calcPlayerStats();

  const animatedTotalPoints = useCountUp(currentStats.totalPoints);

  const handleCopySummary = () => {
    if (!lastMatch || !displayTournament) return;
    const killSummary = (lastMatch.playerStats || (lastMatch as any).players || []).map((ps: any) => {
      const p = activePlayers.find(i => i.id === ps.playerId || i.id.toLowerCase() === (ps.playerId || '').toLowerCase());
      return `${p?.name || ps.playerId}: ${ps.kills || 0}`;
    }).join('\n');
    const posPts = POSITION_POINTS[lastMatch.position] || 0;
    const summary = `${displayTournament.name}\nMatch ${lastMatch.matchNumber}\n\n${killSummary}\nRank: #${lastMatch.position} (${posPts} PTS)\nTotal: ${lastMatch.totalPoints} PTS\n\nOverall Points: ${currentStats.totalPoints} PTS`;

    navigator.clipboard.writeText(summary).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const getRankBadge = (position: number) => {
    if (position === 1) return { emoji: '🥇', className: 'rank-gold' };
    if (position === 2) return { emoji: '🥈', className: 'rank-silver' };
    if (position === 3) return { emoji: '🥉', className: 'rank-bronze' };
    return null;
  };

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-green-500/10 border-b-green-500/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <div className="text-center space-y-2">
        <div className="font-blanka text-blue-500 animate-pulse tracking-widest text-xs">Syncing database...</div>
        <div className="flex items-center gap-2 justify-center">
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-8 animate-slide-up">
      {/* 01. Live Standings Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-800/50 pb-6">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {displayTournament?.category === 'official' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shrink-0" />
                  <span className="text-[7px] font-black tracking-widest text-purple-400 uppercase">OFFICIAL</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shrink-0" />
                  <span className="text-[7px] font-black tracking-widest text-blue-400 uppercase">SCRIM</span>
                </div>
              )}
              {displayTournament?.active ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
                  <span className="text-[7px] font-black tracking-widest text-green-400 uppercase">LIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-500/10 border border-zinc-500/20 rounded-full">
                  <span className="text-[7px] font-black tracking-widest text-zinc-400 uppercase">ARCHIVED</span>
                </div>
              )}
            </div>
            <h2 className="text-xl sm:text-3xl font-blanka text-white uppercase tracking-tight leading-tight break-words">
              {displayTournament?.name || 'NO ACTIVE HUB'}
            </h2>
            <p className="text-zinc-500 font-bold text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em]">
              LIVE STANDINGS {selectedWeekId !== 'overall' ? `• ${weeks.find(w => w.id === selectedWeekId)?.name.toUpperCase()}` : '• OVERALL'} • {tournamentMatches.length} MATCHES
            </p>
          </div>
          {/* Category Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 self-start shrink-0">
            <button
              onClick={() => {
                setActiveCategory('scrim');
                if (typeof window !== 'undefined') sessionStorage.setItem('te_category', 'scrim');
                const firstScrim = tournaments.find(t => (t.category || 'scrim') === 'scrim' && t.active) || tournaments.find(t => (t.category || 'scrim') === 'scrim');
                if (firstScrim) setSelectedTournamentId(firstScrim.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-[8px] sm:text-[9px] font-blanka tracking-widest uppercase transition-all cursor-pointer ${
                activeCategory === 'scrim'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              SCRIMS
            </button>
            <button
              onClick={() => {
                setActiveCategory('official');
                if (typeof window !== 'undefined') sessionStorage.setItem('te_category', 'official');
                const firstOfficial = tournaments.find(t => t.category === 'official' && t.active) || tournaments.find(t => t.category === 'official');
                if (firstOfficial) setSelectedTournamentId(firstOfficial.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-[8px] sm:text-[9px] font-blanka tracking-widest uppercase transition-all cursor-pointer ${
                activeCategory === 'official'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              OFFICIAL
            </button>
          </div>
        </div>
        {/* Tournament Dropdown full-width on mobile */}
        {categoryTournaments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap shrink-0">Switch Tournament:</span>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full sm:flex-1 sm:max-w-sm bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-[10px] font-bold rounded-xl px-3 py-2 cursor-pointer hover:border-zinc-700 transition-all focus:outline-none focus:border-blue-500/50"
            >
              <option value="overall">OVERALL LIFETIME STATS</option>
              {categoryTournaments
                .slice()
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .map(t => {
                  const count = matches.filter(m => m.tournamentId === t.id).length;
                  return (
                    <option key={t.id} value={t.id}>
                      {t.active ? '🟢 ' : ''}{t.name} ({count}M)
                    </option>
                  );
                })}
            </select>
          </div>
        )}
      </div>

      {/* WEEK SELECTOR BAR */}
      {(displayTournament?.category === 'official' || activeCategory === 'official') && (
        <div className="bg-zinc-900/60 border border-purple-500/25 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] font-blanka text-purple-400 uppercase tracking-widest">
              WEEK / PHASE:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedWeekId('overall')}
              className={`px-4 py-2 rounded-xl text-[9px] font-blanka tracking-wider uppercase transition-all cursor-pointer ${
                selectedWeekId === 'overall'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]'
                  : 'bg-zinc-950/80 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800'
              }`}
            >
              OVERALL ({matches.filter(m => m.tournamentId === displayTournament?.id).length} M)
            </button>

            {tournamentWeeks.map(w => {
              const weekMatchCount = matches.filter(m => m.tournamentId === displayTournament?.id && m.weekId === w.id).length;
              const isSelected = selectedWeekId === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWeekId(w.id)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-blanka tracking-wider uppercase transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]'
                      : 'bg-zinc-950/80 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800'
                  }`}
                >
                  {w.name} ({weekMatchCount} M)
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="glass-card p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-2xl md:rounded-3xl border-zinc-800/50 relative group hover:border-blue-500/30 transition-all">
          <div className="absolute top-2 right-3 text-zinc-800 group-hover:text-blue-500/10 transition-colors">
            <svg className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
          </div>
          <p className="text-[8px] sm:text-[8px] md:text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3">Total Points</p>
          <div className="flex items-end gap-1.5 sm:gap-3">
            <p className="text-3xl sm:text-4xl md:text-5xl font-blanka text-neon-green leading-none">{animatedTotalPoints}</p>
            {lastMatchTotalPoints > 0 && (
              <span className="text-blue-400 font-bold text-[8px] sm:text-[9px] md:text-[10px] mb-1 flex items-center gap-0.5" title="Points from last match">
                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                {lastMatchTotalPoints}
              </span>
            )}
          </div>
          <div className="mt-3 sm:mt-4 h-0.5 sm:h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: '65%' }} />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-2xl md:rounded-3xl border-zinc-800/50 relative group hover:border-yellow-500/30 transition-all">
          <div className="absolute top-2 right-3 text-zinc-800 group-hover:text-yellow-500/10 transition-colors">
            <svg className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C20.08 10.63 22 8.55 22 6V5c0-1.1-.9-2-2-2zM5 7h2v2H5V7zm14 2h-2V7h2v2z" /></svg>
          </div>
          <p className="text-[8px] sm:text-[8px] md:text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3">Current Rank</p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-blanka text-white leading-none">#{displayTournament?.currentRank || 1}</p>
          <p className="mt-2 sm:mt-3 text-[7px] sm:text-[8px] md:text-[9px] text-zinc-600 font-bold uppercase leading-tight">{displayTournament?.rankDescription || 'Leading by 12 pts'}</p>
        </div>

        <div className="glass-card p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-2xl md:rounded-3xl border-zinc-800/50 relative group hover:border-red-500/30 transition-all">
          <div className="absolute top-2 right-3 text-zinc-800 group-hover:text-red-500/10 transition-colors">
            <svg className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" /></svg>
          </div>
          <p className="text-[8px] sm:text-[8px] md:text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3">Eliminations</p>
          <div className="flex items-end gap-1.5 sm:gap-3">
            <p className="text-3xl sm:text-4xl md:text-5xl font-blanka text-white leading-none">
              {tournamentMatches.reduce((acc, m) => acc + (m.playerStats || (m as any).players || []).reduce((a: number, b: any) => a + (b.kills || 0), 0), 0)}
            </p>
            {lastMatchKills > 0 && (
              <span className="text-green-400 font-bold text-[8px] sm:text-[9px] md:text-[10px] mb-1 flex items-center gap-0.5" title="Kills from last match">
                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                {lastMatchKills}
              </span>
            )}
          </div>
          <p className="mt-2 sm:mt-3 text-[8px] sm:text-[8px] md:text-[9px] text-zinc-600 font-bold uppercase">KILLS</p>
        </div>

        <div className="glass-card p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-2xl md:rounded-3xl border-zinc-800/50 relative group hover:border-green-500/30 transition-all">
          <div className="absolute top-2 right-3 text-zinc-800 group-hover:text-green-500/10 transition-colors">
            <svg className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" /></svg>
          </div>
          <p className="text-[8px] sm:text-[8px] md:text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3">Placement Pts</p>
          <div className="flex items-end gap-1.5 sm:gap-3">
            <p className="text-3xl sm:text-4xl md:text-5xl font-blanka text-neon-green leading-none">{tournamentMatches.reduce((acc, m) => acc + (POSITION_POINTS[m.position] || 0), 0)}</p>
            {lastMatchPlacementPts > 0 && (
              <span className="text-blue-400 font-bold text-[8px] sm:text-[9px] md:text-[10px] mb-1 flex items-center gap-0.5" title="Placement pts from last match">
                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                {lastMatchPlacementPts}
              </span>
            )}
          </div>
          <p className="mt-2 sm:mt-3 text-[8px] sm:text-[9px] text-zinc-600 font-bold uppercase">Survival pts</p>
        </div>
      </div>

      {/* 03. Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Match History */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <h3 className="text-lg sm:text-xl font-blanka text-white uppercase tracking-wider">Match History</h3>
            <button
              onClick={() => {
                setDashboardView('tournamentHistory');
                setCurrentView('tournamentHistory');
              }}
              className="text-[8px] sm:text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors whitespace-nowrap"
            >
              View History →
            </button>
          </div>
          {tournamentMatches.length > 0 ? (
            <div className="glass-card rounded-3xl overflow-hidden border-zinc-800/50">
              {/* Mobile: card list */}
              <div className="block sm:hidden divide-y divide-zinc-900/50">
                {tournamentMatches.slice(0, 5).map((m, i) => {
                  const kills = (m.playerStats || (m as any).players || []).reduce((a: number, b: any) => a + (b.kills || 0), 0);
                  return (
                    <div key={`${m.id}-${i}`} className="p-4 hover:bg-zinc-900/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-blanka text-sm text-white">Match {m.matchNumber}</span>
                          {m.weekId && (
                            <span className="ml-2 px-1.5 py-0.5 bg-blue-900/40 text-blue-400 rounded text-[7px] font-black uppercase tracking-widest">
                              {weeks.find(w => w.id === m.weekId)?.name || 'Phase'}
                            </span>
                          )}
                        </div>
                        <span className={`font-blanka text-base ${m.position === 1 ? 'text-neon-green' : 'text-white'}`}>#{m.position}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Kills</p>
                            <p className="font-bold text-sm text-zinc-300">{kills}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Points</p>
                            <p className="font-blanka text-sm text-neon-green">{m.totalPoints}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedMatchStats(m)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-blue-600 text-white text-[8px] font-black rounded-lg transition-all"
                        >
                          STATS
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop: table */}
              <div className="hidden sm:block w-full overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-zinc-900/50 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 border-b border-zinc-900">
                    <tr>
                      <th className="px-6 py-4">Match</th>
                      <th className="px-6 py-4">Placement</th>
                      <th className="px-6 py-4">Kills</th>
                      <th className="px-6 py-4">Total Pts</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/50">
                    {tournamentMatches.slice(0, 5).map((m, i) => (
                      <tr key={`${m.id}-${i}`} className="hover:bg-zinc-900/30 transition-colors group">
                        <td className="px-6 py-5">
                          <span className="font-bold text-xs text-white">Match {m.matchNumber}</span>
                          {m.weekId && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-900/40 text-blue-400 rounded text-[8px] font-black uppercase tracking-widest">
                              {weeks.find(w => w.id === m.weekId)?.name || 'Unknown Phase'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`font-blanka text-sm ${m.position === 1 ? 'text-neon-green' : 'text-white'}`}>#{m.position}</span>
                        </td>
                        <td className="px-6 py-5 text-zinc-400 font-bold text-xs">{(m.playerStats || (m as any).players || []).reduce((a: number, b: any) => a + (b.kills || 0), 0)}</td>
                        <td className="px-6 py-5 font-blanka text-sm text-neon-green">{m.totalPoints}</td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-zinc-800/50 border border-zinc-800 text-zinc-500 rounded-lg text-[8px] font-black tracking-widest">COMPLETED</span>
                        </td>
                        <td className="px-6 py-5 text-right flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedMatchStats(m)}
                            className="px-4 py-2 bg-zinc-800 hover:bg-blue-600 text-white text-[9px] font-black rounded-lg transition-all"
                          >
                            VIEW STATS
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <RadarEmptyState message={selectedTournamentId === 'overall' ? "Match history is hidden in Overall view" : "No history found"} />
          )}
        </div>

        {/* Right Column: Top Fraggers Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-blanka text-white uppercase tracking-wider flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z" /></svg>
              Top Fraggers
            </h3>
            <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-600 rounded text-[7px] font-black tracking-widest uppercase">Team Elite</span>
          </div>

          <div className="glass-card rounded-3xl p-6 border-zinc-800/50 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {rosterPlayers.map(p => {
              if (selectedTournamentId === 'overall') {
                const os = overallStats[p.id.toLowerCase()] || overallStats[p.name.toLowerCase()] || { kills: 0, played: 0 };
                return { ...p, kills: os.kills, played: os.played };
              }
              const played = tournamentMatches.filter(m => (m.playerStats || (m as any).players || []).some((ps: any) =>
                ps.playerId === p.id ||
                ps.playerId?.toLowerCase() === p.id.toLowerCase() ||
                ps.playerId?.toUpperCase() === p.name.toUpperCase().replace(/^TE\.\s*/i, '')
              )).length;
              return { ...p, kills: currentStats.playerTotals[p.id] || 0, played };
            })
              .sort((a, b) => b.kills - a.kills)
              .slice(0, 5)
              .map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/30 hover:border-blue-500/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-blanka text-zinc-700 text-xs">
                            {p.name.charAt(p.name.indexOf('.') + 1)}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-[6px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter whitespace-nowrap shadow-md shadow-blue-600/20 z-10">
                        {p.role.split(' ')[0]}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-blanka text-xs text-white uppercase tracking-wider">{p.name.split('.')[1] || p.name}</p>
                        {idx === 0 && <span className="text-yellow-400 text-[10px]">★</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[7px] font-black text-zinc-600 uppercase">K/M <span className="text-zinc-500 text-[8px] ml-0.5">{(p.played > 0 ? p.kills / p.played : 0).toFixed(1)}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-blanka text-white group-hover:text-blue-500 transition-colors">{p.kills}</p>
                    <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Kills</p>
                  </div>
                </div>
              ))}

            <button
              onClick={() => setCurrentView('teams')}
              className="w-full py-4 mt-2 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl text-[9px] font-black text-zinc-500 tracking-[0.2em] uppercase hover:bg-zinc-800 hover:text-white transition-all nav-press"
            >
              View Full Roster
            </button>
          </div>
        </div>
      </div>
    </div >
  );

  const renderTournamentHistory = () => {
    const sortedHistory = categoryTournaments.sort((a, b) => b.createdAt - a.createdAt);
    const totalPages = Math.ceil(sortedHistory.length / 5);
    const paginatedHistory = sortedHistory.slice((historyPage - 1) * 5, historyPage * 5);

    return (
      <div className="space-y-8 animate-slide-up">
        {/* Category Toggle */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex w-full sm:w-auto items-center p-1 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
            <button
              onClick={() => {
                setActiveCategory('official');
                setSelectedWeekId('overall');
                setHistoryPage(1);
              }}
              className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-blanka text-xs sm:text-sm tracking-widest transition-all ${activeCategory === 'official'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                }`}
            >
              OFFICIALS
            </button>
            <button
              onClick={() => {
                setActiveCategory('scrim');
                setSelectedWeekId('overall');
                setHistoryPage(1);
              }}
              className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-blanka text-xs sm:text-sm tracking-widest transition-all ${activeCategory === 'scrim'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                }`}
            >
              SCRIMS
            </button>
          </div>
        </div>

        <h3 className="font-blanka text-xl text-white flex items-center gap-3">
          <span className="w-6 h-1 bg-zinc-700 rounded-full" />
          Tournament History
          <span className="text-[9px] font-bold text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-full ml-2">{categoryTournaments.length}</span>
        </h3>
        {categoryTournaments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedHistory.map((t, idx) => {
            const stats = calculateTournamentStats(t.id);
            return (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTournamentId(t.id);
                  setSelectedHistoryTournament(t);
                }}
                className={`text-left p-8 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group card-hover ${selectedTournamentId === t.id
                  ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                  : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                  }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {t.active && (
                  <div className="absolute top-0 right-0 bg-green-600 text-white px-4 py-1 text-[8px] font-bold tracking-widest rounded-bl-xl flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                )}
                <p className={`text-xs font-blanka mb-4 ${selectedTournamentId === t.id ? 'text-blue-400' : 'text-zinc-400'}`}>
                  {t.name}
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[9px] font-bold text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded">{stats.count} matches</span>
                  <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{stats.totalPoints} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                    {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-[8px] font-bold text-blue-500 group-hover:translate-x-1 transition-transform">SELECT →</span>
                </div>
              </button>
            );
          })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 disabled:opacity-50 hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest px-4">
                  Page {historyPage} of {totalPages}
                </span>
                <button
                  disabled={historyPage === totalPages}
                  onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 disabled:opacity-50 hover:bg-zinc-800 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <RadarEmptyState message="No tournaments found" />
        )}
      </div>
    );
  };


  const renderTeams = () => (
    <div className="space-y-8 sm:space-y-10 animate-slide-up pb-10">
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-5">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-3xl font-blanka text-white uppercase leading-tight">CURRENT ROSTER</h2>
          <p className="text-zinc-500 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">TEAM ELITE</p>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl shrink-0 ml-3">
          <span className="text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-widest">Size:</span>
          <span className="text-white font-blanka text-sm">05</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
        {rosterPlayers.map((p, idx) => (
          <div key={p.id} className="glass-card rounded-[2.5rem] p-10 border-zinc-800/50 relative overflow-hidden group hover:border-blue-500/30 transition-all card-hover shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors" />

            <div className="relative mb-8">
              <div className="w-24 h-24 bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 group-hover:border-blue-500/30 transition-all flex items-center justify-center">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-blanka text-zinc-800 group-hover:text-blue-500/40 transition-colors">
                    {p.name.charAt(p.name.indexOf('.') + 1)}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[8px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/20 whitespace-nowrap z-10">
                {p.role.split(' ')[0]}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-2xl font-blanka text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{p.name}</h4>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">{p.role}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-800/50">
              <div>
                <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Total Kills</p>
                <p className="text-xl font-blanka text-white mt-1">{playerStats[p.id]?.kills || 0}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Matches</p>
                <p className="text-xl font-blanka text-blue-500 mt-1">{playerStats[p.id]?.played || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-20 px-4">

      {/* View Content */}
      <div className="min-h-[600px] space-y-16">
        {currentView === 'dashboard' && (
          <>
            {renderDashboard()}
          </>
        )}
        {currentView === 'teams' && renderTeams()}
        {currentView === 'tournamentHistory' && renderTournamentHistory()}
        {/* Match Stats Modal */}
        {selectedMatchStats && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => setSelectedMatchStats(null)} />
            <div className="relative w-full max-w-lg glass-card rounded-[2rem] md:rounded-[2.5rem] border-zinc-800/50 overflow-hidden animate-slide-up shadow-2xl mx-auto">
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
                <div>
                  <h3 className="text-xl md:text-2xl font-blanka text-white uppercase tracking-wider flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    Match {selectedMatchStats.matchNumber} Report
                  </h3>
                  <p className="text-zinc-500 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">Detailed Statistics</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const sortedPlayers = [...selectedMatchStats.playerStats].sort((a, b) => b.kills - a.kills);
                      let copyText = `${displayTournament?.name || 'ACTIVE TOURNAMENT'}\nMatch ${selectedMatchStats.matchNumber}\n\n`;

                      sortedPlayers.forEach(stat => {
                        const p = rosterPlayers.find(p => p.id === stat.playerId);
                        if (p) copyText += `${p.name}: ${stat.kills}\n`;
                      });

                      const posPts = POSITION_POINTS[selectedMatchStats.position] || 0;
                      copyText += `Rank: #${selectedMatchStats.position} (${posPts} PTS)\nTotal: ${selectedMatchStats.totalPoints} PTS\n\nOverall Points: ${currentStats.totalPoints} PTS\n\nhttps://${typeof window !== 'undefined' ? window.location.host : 's8ul-elite.com'}`;

                      navigator.clipboard.writeText(copyText);

                      // Optional: alert or toast here. For now just visual feedback on the button
                      const btn = document.getElementById('copy-stats-btn');
                      if (btn) {
                        const originalText = btn.innerHTML;
                        btn.innerHTML = 'COPIED!';
                        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                      }
                    }}
                    id="copy-stats-btn"
                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[9px] font-black rounded-lg transition-all"
                  >
                    COPY / SHARE
                  </button>
                  <button
                    onClick={() => setSelectedMatchStats(null)}
                    className="p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-800/50 border-b border-zinc-800/50">
                <div className="p-4 bg-zinc-900/80 text-center">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Squad Rank</p>
                  <p className="text-xl font-blanka text-neon-green">#{selectedMatchStats.position}</p>
                </div>
                <div className="p-4 bg-zinc-900/80 text-center border-y sm:border-y-0 sm:border-x border-zinc-800/50">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Kills</p>
                  <p className="text-xl font-blanka text-white">{(selectedMatchStats.playerStats || (selectedMatchStats as any).players || []).reduce((a: number, b: any) => a + (b.kills || 0), 0)}</p>
                </div>
                <div className="p-4 bg-zinc-900/80 text-center">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Aggregate PTS</p>
                  <p className="text-xl font-blanka text-blue-500">{selectedMatchStats.totalPoints}</p>
                </div>
              </div>

              {/* Player Kills List */}
              <div className="p-6 md:p-8 space-y-4">
                {(selectedMatchStats.playerStats || (selectedMatchStats as any).players || []).slice().sort((a: any, b: any) => (b.kills || 0) - (a.kills || 0)).map((stat: any) => {
                  const player = rosterPlayers.find(p => p.id === stat.playerId || p.id.toLowerCase() === (stat.playerId || '').toLowerCase() || p.name.toUpperCase().replace(/^TE\.\s*/i, '') === (stat.playerId || '').toUpperCase().replace(/^TE\.\s*/i, ''));
                  return (
                    <div key={stat.playerId} className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center font-blanka text-[10px] text-zinc-500">
                          {player?.imageUrl ? (
                            <img src={player.imageUrl} alt={player?.name} className="w-full h-full object-cover" />
                          ) : (
                            <>{player?.name.charAt(player.name.indexOf('.') + 1)}{player?.name.charAt(player.name.indexOf('.') + 2)}</>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-blanka text-white uppercase tracking-wider">{player?.name.split('.')[1] || player?.name}</p>
                          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{player?.role}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-end gap-2">
                        <p className="text-3xl font-blanka text-white">{stat.kills}</p>
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest pb-1">Kills</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tournament Summary Modal */}
        {selectedHistoryTournament && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => setSelectedHistoryTournament(null)} />
            <div className="relative w-full max-w-lg glass-card rounded-[2rem] md:rounded-[2.5rem] border-zinc-800/50 overflow-hidden animate-slide-up shadow-2xl mx-auto">
              <div className="p-6 md:p-8 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
                <div>
                  <h3 className="text-xl md:text-2xl font-blanka text-white uppercase tracking-wider flex items-center gap-3 leading-tight">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full shrink-0" />
                    {selectedHistoryTournament.name}
                  </h3>
                  <p className="text-zinc-500 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">Tournament Report</p>
                </div>
                <button
                  onClick={() => setSelectedHistoryTournament(null)}
                  className="p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
                {/* High Level Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/50">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Aggregate Points</p>
                    <p className="text-3xl font-blanka text-blue-500">{calculateTournamentStats(selectedHistoryTournament.id).totalPoints}</p>
                  </div>
                  <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/50">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Matches Played</p>
                    <p className="text-3xl font-blanka text-white">{calculateTournamentStats(selectedHistoryTournament.id).count}</p>
                  </div>
                </div>

                {/* Squad Statistics */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2 ml-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Squad Performance</p>
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Total Kills</p>
                  </div>
                  {(() => {
                    const stats = calculateTournamentStats(selectedHistoryTournament.id);
                    return rosterPlayers
                      .map(p => ({
                        ...p,
                        kills: stats.playerTotals[p.id] || 0,
                        played: matches.filter(m => m.tournamentId === selectedHistoryTournament.id && (m.playerStats || (m as any).players || []).some((ps: any) => ps.playerId === p.id || ps.playerId?.toLowerCase() === p.id.toLowerCase())).length
                      }))
                      .sort((a, b) => b.kills - a.kills)
                      .map(p => (
                        <div key={p.id} className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-800/30 rounded-2xl group hover:border-blue-500/20 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded overflow-hidden flex items-center justify-center font-blanka text-[10px] text-zinc-500 group-hover:text-blue-500 transition-colors">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <>{p.name.charAt(p.name.indexOf('.') + 1)}{p.name.charAt(p.name.indexOf('.') + 2)}</>
                              )}
                            </div>
                            <div>
                              <p className="font-blanka text-xs text-white uppercase tracking-widest">{p.name.split('.')[1] || p.name}</p>
                              <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest">{p.played} matches</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-blanka text-white group-hover:text-blue-500 transition-colors">{p.kills}</span>
                            <span className="text-[8px] font-black text-zinc-600 uppercase ml-2">Kills</span>
                          </div>
                        </div>
                      ));
                  })()}
                </div>

                {/* Match Breakdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2 ml-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Match Breakdown</p>
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Summary</p>
                  </div>
                  <div className="space-y-3">
                    {matches
                      .filter(m => m.tournamentId === selectedHistoryTournament.id)
                      .sort((a, b) => b.matchNumber - a.matchNumber)
                      .map(m => (
                        <div key={m.id} className="p-5 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl flex items-center justify-between hover:bg-zinc-800/30 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center font-blanka text-xs text-blue-500 shadow-inner">
                              {m.matchNumber}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Match #{m.matchNumber}</p>
                              <p className="text-[8px] text-zinc-500 font-bold mt-0.5 uppercase">
                                {new Date(m.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • Rank: #{m.position}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right px-4 border-r border-zinc-800/50">
                              <p className="text-xs font-blanka text-white">{m.playerStats.reduce((a, b) => a + b.kills, 0)}</p>
                              <p className="text-[7px] text-zinc-600 font-black uppercase">Kills</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-blanka text-neon-green">{m.totalPoints}</p>
                              <p className="text-[7px] text-zinc-600 font-black uppercase">PTS</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-4">
                  <div className="p-4 bg-blue-600/5 border border-blue-500/20 rounded-2xl text-center">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      Date: {new Date(selectedHistoryTournament.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicDashboard;
