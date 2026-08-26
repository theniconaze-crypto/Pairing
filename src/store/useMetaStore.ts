import { create } from 'zustand';
import { db } from '../db/dexieDb';
import { Team, MatchupMatrices, RoundSession } from '../types';

interface MetaState {
  myTeam: Team | null;
  opponentTeam: Team | null;
  matrices: MatchupMatrices;
  activeRound: RoundSession | null;
  isSyncing: boolean;
  setMyTeam: (team: Team) => Promise<void>;
  setOpponentTeam: (team: Team) => Promise<void>;
  updateMatrices: (newMatrices: MatchupMatrices) => Promise<void>;
  refreshMetaFromAI: () => Promise<void>;
  loadInitialData: () => Promise<void>;
}

const defaultMatrices: MatchupMatrices = {
  factionVsFaction: {
    'Space Marines': { 'Necrons': 0.5, 'Aeldari': -1, 'Tyranids': 1 },
    'Necrons': { 'Space Marines': -0.5, 'Aeldari': 0, 'Tyranids': 1.5 },
    'Aeldari': { 'Space Marines': 1, 'Necrons': 0, 'Tyranids': 2 },
    'Tyranids': { 'Space Marines': -1, 'Necrons': -1.5, 'Aeldari': -2 }
  },
  dispositionVsDisposition: {
    'Purge the Foe': { 'Purge the Foe': 0, 'Reconnaissance': 1, 'Take & Hold': -0.5, 'Disruption': 0, 'Priority Asset': 0 },
    'Reconnaissance': { 'Purge the Foe': -1, 'Reconnaissance': 0, 'Take & Hold': 1, 'Disruption': 0.5, 'Priority Asset': 0 },
    'Take & Hold': { 'Purge the Foe': 0.5, 'Reconnaissance': -1, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 0.5 },
    'Disruption': { 'Purge the Foe': 0, 'Reconnaissance': -0.5, 'Take & Hold': 0, 'Disruption': 0, 'Priority Asset': 1 },
    'Priority Asset': { 'Purge the Foe': 0, 'Reconnaissance': 0, 'Take & Hold': -0.5, 'Disruption': -1, 'Priority Asset': 0 }
  }
};

export const useMetaStore = create<MetaState>((set, get) => ({
  myTeam: null,
  opponentTeam: null,
  matrices: defaultMatrices,
  activeRound: null,
  isSyncing: false,

  loadInitialData: async () => {
    const savedMatrices = await db.matrices.get('default');
    if (savedMatrices) {
      set({ matrices: savedMatrices.data });
    } else {
      await db.matrices.put({ id: 'default', data: defaultMatrices });
    }
  },

  setMyTeam: async (team) => {
    await db.teams.put(team);
    set({ myTeam: team });
  },

  setOpponentTeam: async (team) => {
    await db.teams.put(team);
    set({ opponentTeam: team });
  },

  updateMatrices: async (newMatrices) => {
    await db.matrices.put({ id: 'default', data: newMatrices });
    set({ matrices: newMatrices });
  },

  refreshMetaFromAI: async () => {
    set({ isSyncing: true });
    try {
      // Mock d'appel API Gemini / Engine Meta v11
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const current = get().matrices;
      const updated = JSON.parse(JSON.stringify(current));
      
      // Ajustement simulé de la meta
      if (updated.factionVsFaction['Aeldari']) {
        updated.factionVsFaction['Aeldari']['Space Marines'] = 0.5;
      }
      
      await get().updateMatrices(updated);
    } finally {
      set({ isSyncing: false });
    }
  }
}));