
import { Match, Tournament, ScheduleItem, Player, SystemSettings, TournamentWeek } from '@/types';
import { addAuthHeaders, handleAuthError } from '@/lib/clientAuth';

// ── API Helper ──────────────────────────────────────────────────────
const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: addAuthHeaders(options?.headers),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      handleAuthError(response.status);
      console.error(`API Error (${response.status}) at ${endpoint}`);
      return null;
    }
    return await response.json();
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn(`API request failed for ${endpoint}. Fallback to localStorage.`);
    return null;
  }
};

const dispatchUpdate = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('storage_update'));
};

const getLocal = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
};

const setLocal = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
};

// ── Matches (Hybrid Persistence with LocalStorage Backup) ───────────
export const getMatches = async (all: boolean = false): Promise<Match[]> => {
  const url = all ? '/api/matches?all=true' : '/api/matches';
  const data = await apiFetch(url);
  const local = getLocal<Match>('s8ul_matches');

  if (Array.isArray(data) && data.length > 0) {
    setLocal('s8ul_matches', data);
    return data;
  }

  if (local.length > 0) {
    // Sync local items to server memory if server was restarted
    Promise.all(local.map(m => apiFetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m)
    }))).catch(() => {});
    return local;
  }

  return (data && Array.isArray(data)) ? data : [];
};

export const saveMatch = async (match: Match): Promise<void> => {
  const local = getLocal<Match>('s8ul_matches');
  const filtered = local.filter(m => m.id !== match.id);
  setLocal('s8ul_matches', [match, ...filtered]);

  await apiFetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(match)
  });
  dispatchUpdate();
};

export const updateMatch = async (match: Match): Promise<void> => {
  const local = getLocal<Match>('s8ul_matches');
  const updated = local.map(m => m.id === match.id ? match : m);
  setLocal('s8ul_matches', updated);

  await apiFetch('/api/matches', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(match)
  });
  dispatchUpdate();
};

export const deleteMatch = async (id: string): Promise<void> => {
  const local = getLocal<Match>('s8ul_matches');
  setLocal('s8ul_matches', local.filter(m => m.id !== id));

  await apiFetch(`/api/matches?id=${id}`, { method: 'DELETE' });
  dispatchUpdate();
};

// ── Tournaments ─────────────────────────────────────────────────────
export const getTournaments = async (): Promise<Tournament[]> => {
  const data = await apiFetch('/api/tournaments');
  const local = getLocal<Tournament>('s8ul_tournaments');

  if (Array.isArray(data) && data.length > 0) {
    const hasOnlyDefaultInApi = data.length === 1 && data[0].id === 'initial_t';
    const localHasCustom = local.some(t => t.id !== 'initial_t');

    if (hasOnlyDefaultInApi && localHasCustom) {
      const mergedMap = new Map<string, Tournament>();
      data.forEach(t => mergedMap.set(t.id, t));
      local.forEach(t => mergedMap.set(t.id, t));
      const merged = Array.from(mergedMap.values());
      setLocal('s8ul_tournaments', merged);
      return merged;
    }

    setLocal('s8ul_tournaments', data);
    return data;
  }

  if (local.length > 0) {
    return local;
  }

  return (data && Array.isArray(data)) ? data : [];
};

export const createTournament = async (data: Partial<Tournament>): Promise<void> => {
  const newTournament: Tournament = {
    id: Math.random().toString(36).substr(2, 9),
    name: data.name || 'New Tournament',
    active: data.active ?? true,
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    endDate: data.endDate || new Date().toISOString().split('T')[0],
    status: data.status || 'active',
    createdBy: 'Admin',
    createdAt: Date.now(),
    currentRank: data.currentRank || 1,
    rankDescription: data.rankDescription || 'Leading by 12 pts',
    category: data.category || 'scrim'
  };

  const local = getLocal<Tournament>('s8ul_tournaments');
  setLocal('s8ul_tournaments', [...local, newTournament]);

  await apiFetch('/api/tournaments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTournament)
  });
  dispatchUpdate();
};

export const updateTournament = async (id: string, data: Partial<Tournament>): Promise<void> => {
  const local = getLocal<Tournament>('s8ul_tournaments');
  const updated = local.map(t => t.id === id ? { ...t, ...data } : t);
  setLocal('s8ul_tournaments', updated);

  await apiFetch(`/api/tournaments?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  dispatchUpdate();
};

export const deleteTournament = async (id: string): Promise<void> => {
  const local = getLocal<Tournament>('s8ul_tournaments');
  setLocal('s8ul_tournaments', local.filter(t => t.id !== id));

  await apiFetch(`/api/tournaments?id=${id}`, { method: 'DELETE' });
  dispatchUpdate();
};

export const setActiveTournament = async (id: string, category?: string): Promise<void> => {
  const local = getLocal<Tournament>('s8ul_tournaments');
  const updated = local.map(t => ({
    ...t,
    active: t.id === id,
    ...(t.id === id && category ? { category } : {})
  }));
  setLocal('s8ul_tournaments', updated);

  await apiFetch(`/api/tournaments?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: true, category })
  });
  dispatchUpdate();
};

// ── Tournament Weeks ────────────────────────────────────────────────
export const getWeeks = async (tournamentId?: string): Promise<TournamentWeek[]> => {
  const url = tournamentId ? `/api/weeks?tournamentId=${tournamentId}` : '/api/weeks';
  const data = await apiFetch(url);
  const local = getLocal<TournamentWeek>('s8ul_weeks');

  if (Array.isArray(data) && data.length > 0) {
    setLocal('s8ul_weeks', data);
    return tournamentId ? data.filter(w => w.tournamentId === tournamentId) : data;
  }

  if (local.length > 0) {
    return tournamentId ? local.filter(w => w.tournamentId === tournamentId) : local;
  }

  return (data && Array.isArray(data)) ? (tournamentId ? data.filter(w => w.tournamentId === tournamentId) : data) : [];
};

export const createWeek = async (week: Omit<TournamentWeek, 'id'>): Promise<void> => {
  const newWeek: TournamentWeek = {
    ...week,
    id: Math.random().toString(36).substr(2, 9)
  };
  const local = getLocal<TournamentWeek>('s8ul_weeks');
  setLocal('s8ul_weeks', [...local, newWeek]);

  await apiFetch('/api/weeks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newWeek)
  });
  dispatchUpdate();
};

export const deleteWeek = async (id: string): Promise<void> => {
  const local = getLocal<TournamentWeek>('s8ul_weeks');
  setLocal('s8ul_weeks', local.filter(w => w.id !== id));

  await apiFetch(`/api/weeks?id=${id}`, { method: 'DELETE' });
  dispatchUpdate();
};

export const updateWeek = async (id: string, updates: Partial<Omit<TournamentWeek, 'id' | 'tournamentId'>>): Promise<void> => {
  const local = getLocal<TournamentWeek>('s8ul_weeks');
  setLocal('s8ul_weeks', local.map(w => w.id === id ? { ...w, ...updates } : w));

  await apiFetch(`/api/weeks?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  dispatchUpdate();
};

// ── Dashboard View ──────────────────────────────────────────────────
export const getDashboardView = (): string => {
  if (typeof window !== 'undefined') return sessionStorage.getItem('s8ul_dashboard_view') || 'dashboard';
  return 'dashboard';
};

export const setDashboardView = (view: string): void => {
  if (typeof window !== 'undefined') sessionStorage.setItem('s8ul_dashboard_view', view);
  dispatchUpdate();
};

// ── Schedule ────────────────────────────────────────────────────────
export const getSchedule = async (): Promise<ScheduleItem[]> => {
  const data = await apiFetch('/api/schedule');
  const local = getLocal<ScheduleItem>('s8ul_schedule');

  if (Array.isArray(data) && data.length > 0) {
    setLocal('s8ul_schedule', data);
    return data;
  }

  if (local.length > 0) {
    return local;
  }

  return (data && Array.isArray(data)) ? data : [];
};

export const saveScheduleItem = async (item: ScheduleItem): Promise<void> => {
  const local = getLocal<ScheduleItem>('s8ul_schedule');
  setLocal('s8ul_schedule', [item, ...local.filter(i => i.id !== item.id)]);

  await apiFetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  dispatchUpdate();
};

export const updateScheduleItem = async (item: ScheduleItem): Promise<void> => {
  const local = getLocal<ScheduleItem>('s8ul_schedule');
  setLocal('s8ul_schedule', local.map(i => i.id === item.id ? item : i));

  await apiFetch('/api/schedule', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  dispatchUpdate();
};

export const deleteScheduleItem = async (id: string): Promise<void> => {
  const local = getLocal<ScheduleItem>('s8ul_schedule');
  setLocal('s8ul_schedule', local.filter(i => i.id !== id));

  await apiFetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
  dispatchUpdate();
};

// ── Players ─────────────────────────────────────────────────────────
export const getPlayers = async (): Promise<Player[]> => {
  const data = await apiFetch('/api/players');
  const local = getLocal<Player>('s8ul_players');

  if (Array.isArray(data) && data.length > 0) {
    setLocal('s8ul_players', data);
    return data.filter(p => !p.deleted);
  }

  if (local.length > 0) {
    return local.filter(p => !p.deleted);
  }

  return (data && Array.isArray(data)) ? data.filter(p => !p.deleted) : [];
};

export const getAllPlayers = async (): Promise<Player[]> => {
  const data = await apiFetch('/api/players?includeDeleted=true');
  const local = getLocal<Player>('s8ul_players');

  if (Array.isArray(data) && data.length > 0) {
    setLocal('s8ul_players', data);
    return data;
  }

  return local;
};

export const getDeletedPlayers = async (): Promise<Player[]> => {
  const all = await getAllPlayers();
  return all.filter(p => p.deleted === true);
};

export const createPlayer = async (data: Omit<Player, 'id'>): Promise<{ recovered?: boolean; message?: string }> => {
  const newPlayer: Player = {
    ...data,
    id: Math.random().toString(36).substr(2, 9)
  };

  const local = getLocal<Player>('s8ul_players');
  setLocal('s8ul_players', [...local, newPlayer]);

  const response = await apiFetch('/api/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPlayer)
  });
  dispatchUpdate();
  return response || {};
};

export const updatePlayer = async (id: string, data: Partial<Player>): Promise<void> => {
  const local = getLocal<Player>('s8ul_players');
  setLocal('s8ul_players', local.map(p => p.id === id ? { ...p, ...data } : p));

  await apiFetch(`/api/players?id=${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  dispatchUpdate();
};

export const deletePlayer = async (id: string): Promise<void> => {
  const local = getLocal<Player>('s8ul_players');
  setLocal('s8ul_players', local.map(p => p.id === id ? { ...p, deleted: true } : p));

  await apiFetch(`/api/players?id=${id}`, { method: 'DELETE' });
  dispatchUpdate();
};

export const restoreDeletedPlayer = async (playerId: string): Promise<void> => {
  const local = getLocal<Player>('s8ul_players');
  setLocal('s8ul_players', local.map(p => p.id === playerId ? { ...p, deleted: false, deletedAt: undefined } : p));

  await apiFetch(`/api/players?id=${playerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleted: false, deletedAt: null, restoredAt: Date.now() })
  });
  dispatchUpdate();
};

// ── System Settings ────────────────────────────────────────────────
export const getSettings = async (): Promise<SystemSettings | null> => {
  const data = await apiFetch('/api/settings');
  if (data) return data;
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('s8ul_settings');
    if (local) return JSON.parse(local);
  }
  return null;
};

export const updateSettings = async (data: Partial<SystemSettings>): Promise<void> => {
  if (typeof window !== 'undefined') {
    const existing = await getSettings();
    const updated = { id: 'system', mode: 'normal', ...existing, ...data };
    localStorage.setItem('s8ul_settings', JSON.stringify(updated));
  }

  await apiFetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'system', ...data })
  });
  dispatchUpdate();
};
