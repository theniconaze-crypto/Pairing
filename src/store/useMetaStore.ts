// src/store/useMetaStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team, Player, MatchupMatrices, ScoreRating } from '../types';
import { BASELINE_V11_WINRATES, generateWTCMatrix, fetchLatestTournamentMeta } from '../services/metaFetcher';

export interface MetaState {
  myTeam: Team;
  opponentTeam: Team;
  winrates: Record<string, number>;
  matrices: MatchupMatrices;
  isSyncing: boolean;
  lastUpdated: string;
  dataSource: string;

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
  updateMatrices: (matrices: MatchupMatrices) => void;
  resetToDefaults: () => void;
  loadInitialData: () => void;
}

const DEFAULT_MY_TEAM: Team = {
  id: 'my-team',
  name: 'Mon Équipe',
  size: 8,
  players: [
    { id: 'p1', name: 'Capitaine', faction: 'Space Marines', disposition: 'Take & Hold', tablePreferences: {} },
    { id: 'p2', name: 'Joueur 2', faction: 'Orks', disposition: 'Purge the Foe', tablePreferences: {} },
    { id: 'p3', name: 'Joueur 3', faction: 'Aeldari', disposition: 'Reconnaissance', tablePreferences: {} },
    { id: 'p4', name: 'Joueur 4', faction: 'Necrons', disposition: 'Take & Hold', tablePreferences: {} }
  ]
};

const DEFAULT_OPP_TEAM: Team = {
  id: 'opp-team',
  name: 'Équipe Adverse',
  size: 8,
  players: [
    { id: 'o1', name: 'Adversaire 1', faction: 'Chaos Daemons', disposition: 'Disruption', tablePreferences: {} },
    { id: 'o2', name: 'Adversaire 2', faction: 'Thousand Sons', disposition: 'Priority Asset', tablePreferences: {} },
    { id: 'o3', name: 'Adversaire 3', faction: 'T\'au Empire', disposition: 'Take & Hold', tablePreferences: {} },
    { id: 'o4', name: 'Adversaire 4', faction: 'World Eaters', disposition: 'Purge the Foe', tablePreferences: {} }
  ]
};

const defaultFactionMatrix = generateWTCMatrix(BASELINE_V11_WINRATES) as Record<string, Record<string, ScoreRating>>;

const initialMatrices: MatchupMatrices = {
  factionVsFaction: defaultFactionMatrix,
  dispositionVsDisposition: {
    'Purge the Foe': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0 },
    'Reconnaissance': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0 },
    'Take & Hold': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0 },
    'Disruption': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0 },
    'Priority Asset': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0 }
  },
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
      lastUpdated: 'Août 2026 (Data V11)',
      dataSource: 'Méta W40k V11 Officiel',

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

      updateMatrices: (matrices) => set({ matrices }),

      updateMatrixCell: (fA, fB, value) => {
        const currentMatrices = get().matrices;
        const currentFxF = currentMatrices.factionVsFaction || {};
        const updatedFxF = {
          ...currentFxF,
          [fA]: { ...(currentFxF[fA] || {}), [fB]: value as ScoreRating },
          [fB]: { ...(currentFxF[fB] || {}), [fA]: -value as ScoreRating }
        };
        set({
          matrices: {
            ...currentMatrices,
            factionVsFaction: updatedFxF,
            isManuallyOverridden: true
          },
          dataSource: 'Modifié manuellement (V11)'
        });
      },

      refreshMetaFromAI: async () => {
        set({ isSyncing: true });
        try {
          const freshData = await fetchLatestTournamentMeta();
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
        } catch {
          set({ isSyncing: false });
        }
      },

      resetToDefaults: () => {
        set({
          winrates: BASELINE_V11_WINRATES,
          matrices: initialMatrices,
          lastUpdated: 'Réinitialisé aux données V11',
          dataSource: 'Méta W40k V11 Officiel'
        });
      },

      loadInitialData: () => {}
    }),
    {
      name: 'wtc-meta-storage-v11-final'
    }
  )
);
