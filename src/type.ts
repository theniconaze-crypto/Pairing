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
  tablePreferences: Record<string, ScoreRating>;
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
  isManuallyOverridden?: boolean;
}

export type StrategyOption = 'MAX_SCORE' | 'MIN_RISK';
export type InitiativeOption = 'WE_DEFEND_FIRST' | 'OPPONENT_DEFENDS_FIRST';

export interface PairedMatchup {
  stepNumber: number;
  myPlayerId: string;
  oppPlayerId: string;
  mapId: string;
  predictedScoreWTC: number;
  actualScoreWTC?: number;
}

export interface RoundSession {
  id: string;
  roundNumber: 1 | 2 | 3 | 4 | 5;
  opponentTeamName: string;
  myTeam: Team;
  opponentTeam: Team;
  strategy: StrategyOption;
  initiative: InitiativeOption;
  pairings: PairedMatchup[];
  status: 'DRAFTING' | 'IN_MATCH' | 'COMPLETED';
}
