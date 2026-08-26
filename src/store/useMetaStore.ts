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
  pairings: RoundPairing[];
  isCompleted: boolean;
}

export interface MetaState {
  myTeam: Team;
  opponentTeam: Team;
  winrates: Record<string, number>;
  matrices: MatchupMatrices;
  isSyncing: boolean;
  lastUpdated: string;
  dataSource: string;
  geminiApiKey: string;
  
  // --- GESTION DES RONDES ---
  rounds: TournamentRound[];
  activeRoundId: string | null;

  setGeminiApiKey: (key: string) => void;
  setMyTeam: (team: Team) => void;
  setOpponentTeam: (team: Team) => void;

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

  // Actions Rondes
  startNewRound: () => void;
  saveRoundPairings: (roundId: string, pairings: RoundPairing[]) => void;
  completeRound: (roundId: string) => void;
  deleteRound: (roundId: string) => void;
}

const DEFAULT_MY_TEAM: Team = {
  id: 'my-team',
  name: 'Mon Équipe',
  size: 8,
  players: [
    { id: 'p1', name: 'Capitaine', faction: 'Space Marines', disposition: 'Take & Hold', tablePreferences: {} },
    { id: 'p2', name: 'Joueur 2', faction: 'Orks', disposition: 'Purge the Foe', tablePreferences: {} }
  ]
};

const DEFAULT_OPP_TEAM: Team = {
  id: 'opp-team',
  name: 'Équipe Adverse',
  size: 8,
  players: [
    { id: 'o1', name: 'Adversaire 1', faction: 'Chaos Daemons', disposition: 'Disruption', tablePreferences: {} },
    { id: 'o2', name: 'Adversaire 2', faction: 'Thousand Sons', disposition: 'Priority Asset', tablePreferences: {} }
  ]
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
            players: (state.opponentTeam?.players || []).map((p) => (p.id === id ? { ...p, ...updated } : p))
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

      // --- LOGIQUE DES RONDES ---
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
