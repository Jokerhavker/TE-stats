
import { Player, PositionPoints, Tournament } from './types';

export const POSITION_POINTS: PositionPoints = {
  1: 12,
  2: 9,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
  11: 0,
  12: 0,
};

export const INITIAL_PLAYERS: Player[] = [
  { id: 'pahadi', name: 'PAHADI', role: 'SNIPER' },
  { id: 'cropse', name: 'CROPSE', role: 'PRIMARY RUSHER' },
  { id: 'kohli', name: 'KOHLI', role: 'SECONDRY RUSHER' },
  { id: 'amin', name: 'AMIN', role: 'NADER' },
  { id: 'mrjay', name: 'MRJAY', role: 'RUSHER/SUPPORTER' },
];

export const INITIAL_TOURNAMENTS: Tournament[] = [
  { id: 'initial_t', name: '0000000000', active: true, status: 'active', createdAt: 1710000000000 },
];
