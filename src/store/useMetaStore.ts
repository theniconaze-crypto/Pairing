import { create } from 'zustand';
import { Team, Player, MatchupMatrices, DispositionArchetype, ScoreRating } from '../types';

interface MetaState {
  myTeam: Team;
  opponentTeam: Team;
  matrices: MatchupMatrices;
  isSyncing: boolean;

  // Actions Équipes
  setMyTeam: (team: Team) => void;
  setOpponentTeam: (team: Team) => void;
  
  // Actions Joueurs Mon Équipe
  addMyPlayer: (player: Player) => void;
  updateMyPlayer: (id: string, updated: Partial<Player>) => void;
  deleteMyPlayer: (id: string) => void;

  // Actions Joueurs Équipe Adverse
  addOpponentPlayer: (player: Player) => void;
  updateOpponentPlayer: (id: string, updated: Partial<Player>) => void;
  deleteOpponentPlayer: (id: string) => void;

  // Meta & Sync
  updateMatrices: (matrices: MatchupMatrices) => void;
  refreshMetaFromAI: () => Promise<void>;
  loadInitialData: () => void;
}

const FACTIONS_DEFAULT = [
  'Space Marines', 'Necrons', 'Aeldari', 'Tyranids', 'Tau Empire', 
  'Chaos Space Marines', 'Orks', 'Adeptus Custodes', 'Imperial Knights', 
  'Chaos Knights', 'Thousand Sons', 'World Eaters', 'Death Guard', 
  'Astra Militarum', 'Adepta Sororitas', 'Grey Knights', 'Drukhari', 
  'Genestealer Cults', 'Adeptus Mechanicus'
];

const DEFAULT_MATRICES: MatchupMatrices = {
  factionVsFaction: FACTIONS_DEFAULT.reduce((acc, f1) => {
    acc[f1] = FACTIONS_DEFAULT.reduce((inner, f2) => {
      inner[f2] = 0;
      return inner;
    }, {} as Record<string, ScoreRating>);
    return acc;
  }, {} as Record<string, Record<string, ScoreRating>>),
  dispositionVsDisposition: {
    'Purge the Foe': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0 },
    'Reconnaissance': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0 },
    'Take & Hold': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0 },
    'Disruption': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0 },
    'Priority Asset': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0 }
  },
  isManuallyOverridden: false
};

export const useMetaStore = create<MetaState>((set) => ({
  myTeam: { id: 'my-team', name: 'Mon Équipe', size: 8, players: [] },
  opponentTeam: { id: 'opp-team', name: 'Équipe Adverse', size: 8, players: [] },
  matrices: DEFAULT_MATRICES,
  isSyncing: false,

  setMyTeam: (team) => set({ myTeam: team }),
  setOpponentTeam: (team) => set({ opponentTeam: team }),

  addMyPlayer: (player) =>
    set((state) => ({
      myTeam: { ...state.myTeam, players: [...state.myTeam.players, player] }
    })),

  updateMyPlayer: (id, updated) =>
    set((state) => ({
      myTeam: {
        ...state.myTeam,
        players: state.myTeam.players.map((p) => (p.id === id ? { ...p, ...updated } : p))
      }
    })),

  deleteMyPlayer: (id) =>
    set((state) => ({
      myTeam: { ...state.myTeam, players: state.myTeam.players.filter((p) => p.id !== id) }
    })),

  addOpponentPlayer: (player) =>
    set((state) => ({
      opponentTeam: { ...state.opponentTeam, players: [...state.opponentTeam.players, player] }
    })),

  updateOpponentPlayer: (id, updated) =>
    set((state) => ({
      opponentTeam: {
        ...state.opponentTeam,
        players: state.opponentTeam.players.map((p) => (p.id === id ? { ...p, ...updated } : p))
      }
    })),

  deleteOpponentPlayer: (id) =>
    set((state) => ({
      opponentTeam: { ...state.opponentTeam, players: state.opponentTeam.players.filter((p) => p.id !== id) }
    })),

  updateMatrices: (matrices) => set({ matrices }),

  refreshMetaFromAI: async () => {
    set({ isSyncing: true });
    // Simulation du rechargement des données IA
    setTimeout(() => {
      set({ matrices: { ...DEFAULT_MATRICES, isManuallyOverridden: false }, isSyncing: false });
    }, 1000);
  },

  loadInitialData: () => {}
}));
