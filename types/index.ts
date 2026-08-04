export interface Player {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  deleted?: boolean;
  deletedAt?: number;
  restoredAt?: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  matchNumber: number;
  players?: PlayerMatchStats[];
  playerStats: PlayerMatchStats[];
  playingFour?: string[];
  approvalStatus?: string;
  timestamp: number;
  weekId?: string;
  map?: string;
  mapName?: string;
  position: number;
  totalPoints: number;
  didNotPlay?: boolean;
  didNotPlayPlayer?: string;
  compensationPoints?: number;
}

export interface PlayerMatchStats {
  playerId: string;
  position: number;
  kills: number;
  points: number;
}

export interface Tournament {
  id: string;
  name: string;
  active: boolean;
  startDate: string;
  endDate: string;
  status: 'active' | 'done' | 'delayed';
  createdBy: string;
  createdAt: number;
  currentRank: number;
  rankDescription: string;
  category: string;
}

export interface ScheduleItem {
  id: string;
  matchNumber: number;
  date: string;
  time: string;
  status: 'scheduled' | 'ongoing' | 'completed';
}

export interface TournamentWeek {
  id: string;
  tournamentId: string;
  name: string;
  order: number;
}

export interface SystemSettings {
  id: string;
  sessionTimeout: number; // in milliseconds
  maxActiveSessions: number;
}

export interface AdminSession {
  id: string;
  userId: string;
  userRole: 'admin' | 'ledger';
  sessionName: string;
  deviceType?: string;
  loginTime: number;
  lastActivityTime: number;
  expiresAt: number;
  isActive: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'ledger';
}
