// src/store/useMetaStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team, Player, MatchupMatrices, ScoreRating } from '../types';
import { BASELINE_V11_WINRATES, generateWTCMatrix, fetchMetaFromGemini } from '../services/metaFetcher';

export interface RoundPairing {
  id: string;
  myPlayer: Player;
  oppPlayer: Player;
  score: number;
}

export interface TournamentRound {
  id: string;
  roundNumber: number;
  name: string;
  assignedOpponentTeamId?: string; // ID de l'équipe adverse assignée à cette ronde
  pairings: RoundPairing[];
  isCompleted: boolean;
}

export interface MetaState {
  myTeam: Team;
  opponentTeam: Team; // Équipe adverse actuellement active dans le pairing
  tournamentOpponents: Team[]; // Liste des 5 équipes adverses du tournoi
  winrates: Record<string, number>;
  matrices: MatchupMatrices;
  isSyncing: boolean;
  lastUpdated: string;
  dataSource: string;
  geminiApiKey: string;
  
  rounds: TournamentRound[];
  activeRoundId: string | null;

  setGeminiApiKey: (key: string) => void;
  setMyTeam: (team: Team) => void;
  setOpponentTeam: (team: Team) => void;
  
  // Gestion des équipes du tournoi
  addTournamentOpponent: (team: Team) => void;
  updateTournamentOpponent: (team: Team) => void;
  deleteTournamentOpponent: (id: string) => void;
  assignOpponentToRound: (roundId: string, opponentTeamId: string) => void;

  addMyPlayer: (player: Player) => void;
  updateMyPlayer: (id: string, updated: Partial<Player>) => void;
  deleteMyPlayer: (id: string) => void;

  addOpponentPlayer: (player: Player) => void;
  updateOpponentPlayer: (id: string, updated: Partial<Player>) => void;
  deleteOpponentPlayer: (id: string) => void;

  refreshMetaFromAI: () => Promise<void>;
  updateMatrixCell: (factionA: string, factionB: string, value: number) => void;
  resetToDefaults: () => void;
  loadInitialData: () => void;

  startNewRound: () => void;
  saveRoundPairings: (roundId: string, pairings: RoundPairing[]) => void;
  completeRound: (roundId: string) => void;
  deleteRound: (roundId: string) => void;
}

const DEFAULT_MY_TEAM: Team = {
  id: 'my-team',
  name: 'Mon Équipe',
  size: 8,
  players: []
};

const DEFAULT_OPP_TEAM: Team = {
  id: 'opp-team',
  name: 'Équipe Adverse Actuelle',
  size: 8,
  players: []
};

const defaultFactionMatrix = generateWTCMatrix(BASELINE_V11_WINRATES) as Record<string, Record<string, ScoreRating>>;
const initialMatrices: MatchupMatrices = {
  factionVsFaction: defaultFactionMatrix,
  dispositionVsDisposition: {},
  isManuallyOverridden: false
};

export const useMetaStore = create<MetaState>()(
  persist(
    (set, get) => ({
      myTeam: DEFAULT_MY_TEAM,
      opponentTeam: DEFAULT_OPP_TEAM,
      tournamentOpponents: [],
      winrates: BASELINE_V11_WINRATES,
      matrices: initialMatrices,
      isSyncing: false,
      lastUpdated: 'Août 2026 (V11)',
      dataSource: 'Base locale',
      geminiApiKey: '',
      
      rounds: [],
      activeRoundId: null,

      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setMyTeam: (team) => set({ myTeam: team }),
      setOpponentTeam: (team) => set({ opponentTeam: team }),

      addTournamentOpponent: (team) => set((state) => ({
        tournamentOpponents: [...state.tournamentOpponents, team]
      })),

      updateTournamentOpponent: (updatedTeam) => set((state) => ({
        tournamentOpponents: state.tournamentOpponents.map(t => t.id === updatedTeam.id ? updatedTeam : t)
      })),

      deleteTournamentOpponent: (id) => set((state) => ({
        tournamentOpponents: state.tournamentOpponents.filter(t => t.id !== id)
      })),

      assignOpponentToRound: (roundId, opponentTeamId) => {
        const state = get();
        const targetOpp = state.tournamentOpponents.find(t => t.id === opponentTeamId);
        set({
          rounds: state.rounds.map(r => r.id === roundId ? { ...r, assignedOpponentTeamId: opponentTeamId } : r),
          opponentTeam: targetOpp ? { ...targetOpp } : state.opponentTeam
        });
      },

      addMyPlayer: (player) =>
        set((state) => ({
          myTeam: { ...state.myTeam, players: [...(state.myTeam?.players || []), player] }
        })),

      updateMyPlayer: (id, updated) =>
        set((state) => ({
          myTeam: {
            ...state.myTeam,
            players: (state.myTeam?.players || []).map((p) => (p.id === id ? { ...p, ...updated } : p))
          }
        })),

      deleteMyPlayer: (id) =>
        set((state) => ({
          myTeam: {
            ...state.myTeam,
            players: (state.myTeam?.players || []).filter((p) => p.id !== id)
          }
        })),

      addOpponentPlayer: (player) =>
        set((state) => ({
          opponentTeam: { ...state.opponentTeam, players: [...(state.opponentTeam?.players || []), player] }
        })),

      updateOpponentPlayer: (id, updated) =>
        set((state) => ({
          opponentTeam: {
            ...state.opponentTeam,
            players: (state.opponentTeam?.players || []).filter((p) => p.id !== id)
          }
        })),

      deleteOpponentPlayer: (id) =>
        set((state) => ({
          opponentTeam: {
            ...state.opponentTeam,
            players: (state.opponentTeam?.players || []).filter((p) => p.id !== id)
          }
        })),

      updateMatrixCell: (fA, fB, value) => {
        const currentMatrices = get().matrices;
        const currentFxF = currentMatrices.factionVsFaction || {};
        const updatedFxF = {
          ...currentFxF,
          [fA]: { ...(currentFxF[fA] || {}), [fB]: value as ScoreRating },
          [fB]: { ...(currentFxF[fB] || {}), [fA]: -value as ScoreRating }
        };
        set({
          matrices: { ...currentMatrices, factionVsFaction: updatedFxF, isManuallyOverridden: true },
          dataSource: 'Modifié manuellement'
        });
      },

      refreshMetaFromAI: async () => {
        const key = get().geminiApiKey;
        if (!key) {
          alert("Veuillez configurer votre clé API Gemini.");
          return;
        }

        set({ isSyncing: true });
        try {
          const freshData = await fetchMetaFromGemini(key);
          set({
            winrates: freshData.winrates,
            matrices: {
              ...get().matrices,
              factionVsFaction: freshData.matrix as Record<string, Record<string, ScoreRating>>,
              isManuallyOverridden: false
            },
            lastUpdated: freshData.lastUpdated,
            dataSource: freshData.source,
            isSyncing: false
          });
        } catch (error) {
          console.error(error);
          alert("Erreur lors de la récupération Gemini.");
          set({ isSyncing: false });
        }
      },

      resetToDefaults: () => {
        set({
          winrates: BASELINE_V11_WINRATES,
          matrices: initialMatrices,
          lastUpdated: 'Réinitialisé',
          dataSource: 'Base locale'
        });
      },

      loadInitialData: () => {},

      startNewRound: () => {
        const rounds = get().rounds;
        const nextNum = rounds.length + 1;
        const newRound: TournamentRound = {
          id: crypto.randomUUID(),
          roundNumber: nextNum,
          name: `Ronde ${nextNum}`,
          pairings: [],
          isCompleted: false
        };
        set({
          rounds: [...rounds, newRound],
          activeRoundId: newRound.id
        });
      },

      saveRoundPairings: (roundId, pairings) => {
        set((state) => ({
          rounds: state.rounds.map((r) => (r.id === roundId ? { ...r, pairings } : r))
        }));
      },

      completeRound: (roundId) => {
        set((state) => ({
          rounds: state.rounds.map((r) => (r.id === roundId ? { ...r, isCompleted: true } : r)),
          activeRoundId: null
        }));
      },

      deleteRound: (roundId) => {
        set((state) => ({
          rounds: state.rounds.filter((r) => r.id !== roundId),
          activeRoundId: state.activeRoundId === roundId ? null : state.activeRoundId
        }));
      }
    }),
    { name: 'wtc-rounds-storage-v11' }
  )
);
