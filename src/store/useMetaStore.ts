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

  // Actions (identiques à avant)
  setMyTeam: (team: Team) => void;
  setOpponentTeam: (team: Team) => void;
  // ... (Garde toutes tes actions de gestion de joueurs ici)
  
  refreshMetaFromAI: () => Promise<void>;
  updateMatrixCell: (factionA: string, factionB: string, value: number) => void;
  updateMatrices: (matrices: MatchupMatrices) => void;
  resetToDefaults: () => void;
  loadInitialData: () => void;
}

// ... (Garde tes DEFAULT_MY_TEAM et DEFAULT_OPP_TEAM inchangés ici) ...

const defaultFactionMatrix = generateWTCMatrix(BASELINE_V11_WINRATES) as Record<string, Record<string, ScoreRating>>;

const initialMatrices: MatchupMatrices = {
  factionVsFaction: defaultFactionMatrix,
  dispositionVsDisposition: { /* ... tes dispositions ... */ },
  isManuallyOverridden: false
};

export const useMetaStore = create<MetaState>()(
  persist(
    (set, get) => ({
      // On charge la V11 par défaut
      winrates: BASELINE_V11_WINRATES,
      matrices: initialMatrices,
      isSyncing: false,
      lastUpdated: 'Août 2026 (Data V11)',
      dataSource: 'Méta W40k V11 Officiel',

      // ... (Garde toutes tes fonctions setMyTeam, addMyPlayer, etc. ici) ...

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
      // TRES IMPORTANT : Change la clé pour forcer le navigateur à oublier la V10
      name: 'wtc-meta-storage-v11'
    }
  )
);
