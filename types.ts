
export interface Player {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  deleted?: boolean;        // Track soft deletes
  deletedAt?: number;       // When was it deleted
  createdAt?: number;       // When was it created
}

export interface PlayerMatchStats {
  playerId: string;
  kills: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  matchNumber: number;
  position: number;
  playerStats: PlayerMatchStats[];
  totalPoints: number;
  playingFour: string[]; // Player IDs
  timestamp: number;
  weekId?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface Tournament {
  id: string;
  name: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  status: 'draft' | 'active' | 'completed';
  createdBy?: string;
  createdAt: number;
  currentRank?: number;
  rankDescription?: string;
  category?: 'official' | 'scrim';
}

export interface TournamentWeek {
  id: string;
  tournamentId: string;
  name: string;
  order: number;
  currentRank?: number;
  rankDescription?: string;
}

export type PositionPoints = { [key: number]: number };

/** 
 * MongoDB Schema Representation (Conceptual)
 * 
 * const MatchSchema = new Schema({
 *   tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' },
 *   matchNumber: Number,
 *   position: Number,
 *   playerStats: [{ playerId: String, kills: Number }],
 *   totalPoints: Number,
 *   playingFour: [String],
 *   timestamp: { type: Date, default: Date.now }
 * });
 * 
 * const TournamentSchema = new Schema({
 *   name: String,
 *   active: Boolean,
 *   createdAt: { type: Date, default: Date.now }
 * });
 */

export interface ScheduleItem {
  id: string;
  tournamentId?: string;
  tournamentName: string;
  date: string; // ISO Date String
  time: string;
  opponent?: string;
  stage?: 'Group' | 'Semi' | 'Final' | 'Match';
  location?: string;
  map: string;
  matchNumber: number;
  status: 'scheduled' | 'active' | 'done' | 'delayed' | 'postponed';
  channelLink?: string;
  timestamp: number;
}

export interface SystemSettings {
  id: string;
  mode: 'official' | 'normal';
  updatedAt: number;
}
