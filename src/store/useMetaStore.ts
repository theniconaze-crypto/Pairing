// src/store/useMetaStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team, Player, MatchupMatrices, ScoreRating } from '../types';
import { BASELINE_V11_WINRATES, generateWTCMatrix, fetchMetaFromGemini } from '../services/metaFetcher';

export interface MetaState {
  myTeam: Team;
  opponentTeam: Team;
  winrates: Record<string, number>;
  matrices: MatchupMatrices;
  isSyncing: boolean;
  lastUpdated: string;
  dataSource: string;
  geminiApiKey: string; // NOUVEAU : Stockage de la clé

  setGeminiApiKey: (key: string) => void;
  // ... (Garder vos fonctions de roster setMyTeam, addMyPlayer, etc. comme elles sont)
  
  refreshMetaFromAI: () => Promise<void>;
  updateMatrixCell: (factionA: string, factionB: string, value: number) => void;
  resetToDefaults: () => void;
  loadInitialData: () => void;
}

const defaultFactionMatrix = generateWTCMatrix(BASELINE_V11_WINRATES) as Record<string, Record<string, ScoreRating>>;
const initialMatrices: MatchupMatrices = { factionVsFaction: defaultFactionMatrix, dispositionVsDisposition: {}, isManuallyOverridden: false };

export const useMetaStore = create<MetaState>()(
  persist(
    (set, get) => ({
      myTeam: { id: 't1', name: 'Mon Équipe', size: 8, players: [] }, // Remettez vos joueurs par défaut ici si besoin
      opponentTeam: { id: 't2', name: 'Équipe Adverse', size: 8, players: [] },
      winrates: BASELINE_V11_WINRATES,
      matrices: initialMatrices,
      isSyncing: false,
      lastUpdated: 'Mode hors-ligne (Data V11)',
      dataSource: 'Base de données locale par défaut',
      geminiApiKey: '', 

      setGeminiApiKey: (key) => set({ geminiApiKey: key }),

      // ... (Garder vos autres fonctions) ...

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
          alert("Veuillez d'abord configurer votre clé API Gemini.");
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
          alert("Erreur lors de la récupération via Gemini. Vérifiez votre clé API.");
          set({ isSyncing: false });
        }
      },

      resetToDefaults: () => {
        set({
          winrates: BASELINE_V11_WINRATES,
          matrices: initialMatrices,
          lastUpdated: 'Réinitialisé aux données V11 hors-ligne',
          dataSource: 'Base locale'
        });
      },

      loadInitialData: () => {}
    }),
    {
      name: 'wtc-meta-storage-gemini' // Changement de clé pour valider l'update
    }
  )
);
