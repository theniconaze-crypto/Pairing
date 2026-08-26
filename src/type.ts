export type ScoreRating = -3 | -2.5 | -2 | -1.5 | -1 | -0.5 | 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3;

export type DispositionArchetype = 
  | 'Purge the Foe'
  | 'Reconnaissance'
  | 'Take & Hold'
  | 'Disruption'
  | 'Priority Asset';

export interface Player {
  id: string;
  name: string;
  faction: string;
  disposition: DispositionArchetype;
  rawList?: string;
  tablePreferences: Record<string, ScoreRating>; // key: mapId (ex: "Map 1") -> score (-3 a +3)
}

export interface Team {
  id: string;
  name: string;
  size: 6 | 8;
  players: Player[];
}

export interface MatchupMatrices {
  factionVsFaction: Record<string, Record<string, ScoreRating>>;
  dispositionVsDisposition: Record<DispositionArchetype, Record<DispositionArchetype, ScoreRating>>;
}

export type StrategyOption = 'MAX_SCORE' | 'MIN_RISK';

export interface PairingAssignment {
  myPlayerId: string;
  oppPlayerId: string;
  mapId: string;
  predictedScoreWTC: number;
  actualScoreWTC?: number;
}

export interface PairingStepState {
  stepNumber: number;
  myAvailablePlayerIds: string[];
  oppAvailablePlayerIds: string[];
  availableMapIds: string[];
  currentDefenderId?: string;
  currentAttackerIds?: string[];
  assignments: PairingAssignment[];
}

export interface RoundSession {
  id: string;
  roundNumber: 1 | 2 | 3 | 4 | 5;
  opponentTeamName: string;
  myTeam: Team;
  opponentTeam: Team;
  strategy: StrategyOption;
  assignments: PairingAssignment[];
  status: 'IN_PROGRESS' | 'COMPLETED';
}