// src/store/useMetaStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  BASELINE_GT_WINRATES, 
  generateWTCMatrix, 
  fetchLatestTournamentMeta 
} from '../services/metaFetcher';

interface MetaState {
  winrates: Record<string, number>;
  matrices: Record<string, Record<string, number>>;
  isSyncing: boolean;
  lastUpdated: string;
  dataSource: string;
  
  // Actions
  refreshMetaFromAI: () => Promise<void>;
  updateMatrixCell: (factionA: string, factionB: string, value: number) => void;
  resetToDefaults: () => void;
}

const defaultMatrix = generateWTCMatrix(BASELINE_GT_WINRATES);

export const useMetaStore = create<MetaState>()(
  persist(
    (set, get) => ({
      winrates: BASELINE_GT_WINRATES,
      matrices: defaultMatrix,
      isSyncing: false,
      lastUpdated: "Août 2026 (Listhammer GT Data)",
      dataSource: "Stat Check & Listhammer GT Meta",

      refreshMetaFromAI: async () => {
        set({ isSyncing: true });
        try {
          const freshData = await fetchLatestTournamentMeta();
          set({
            winrates: freshData.winrates,
            matrices: freshData.matrix,
            lastUpdated: freshData.lastUpdated,
            dataSource: freshData.source,
            isSyncing: false
          });
        } catch (error) {
          console.error("Erreur lors du rafraîchissement Méta:", error);
          set({ isSyncing: false });
        }
      },

      updateMatrixCell: (fA, fB, value) => {
        const current = get().matrices;
        const updated = {
          ...current,
          [fA]: { ...current[fA], [fB]: value },
          [fB]: { ...current[fB], [fA]: -value } // Maintien de l'antisymétrie WTC
        };
        set({ matrices: updated, dataSource: "Modifié manuellement (Capitaine)" });
      },

      resetToDefaults: () => {
        set({
          winrates: BASELINE_GT_WINRATES,
          matrices: generateWTCMatrix(BASELINE_GT_WINRATES),
          lastUpdated: "Réinitialisé aux données Listhammer GT",
          dataSource: "Stat Check & Listhammer GT Meta"
        });
      }
    }),
    {
      name: 'wtc-meta-storage',
    }
  )
);
