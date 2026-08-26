// src/store/useMetaStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, Team, Round, RoundPairing, MatrixData } from '../types';

interface MetaStore {
  myTeam: Team;
  opponentTeam: Team;
  tournamentOpponents: Team[];
  matrices: MatrixData;
  rounds: Round[];
  activeRoundId: string | null;

  setMyTeam: (team: Team) => void;
  setOpponentTeam: (team: Team) => void;
  addMyPlayer: (player: Player) => void;
  deleteMyPlayer: (id: string) => void;
  addOpponentPlayer: (player: Player) => void;
  deleteOpponentPlayer: (id: string) => void;
  
  saveMatrix: (matrix: MatrixData) => void;
  startNewRound: () => void;
  completeRound: (roundId: string) => void;
  deleteRound: (roundId: string) => void;
  assignOpponentToRound: (roundId: string, oppTeamId: string) => void;
  saveRoundPairings: (roundId: string, pairings: RoundPairing[]) => void;

  // Actions de génération automatique
  generateRandomOpponentTeam: (name?: string) => void;
  generateMetaOptimizedTeam: () => void;
}

export const useMetaStore = create<MetaStore>()(
  persist(
    (set, get) => ({
      myTeam: { id: 'my-team', name: 'Mon Équipe', size: 0, players: [] },
      opponentTeam: { id: 'opp-team', name: 'Équipe Adverse', size: 0, players: [] },
      tournamentOpponents: [],
      matrices: { factionVsFaction: {} },
      rounds: [],
      activeRoundId: null,

      setMyTeam: (team) => set({ myTeam: team }),
      setOpponentTeam: (team) => set({ opponentTeam: team }),

      addMyPlayer: (player) => set((state) => {
        const players = [...(state.myTeam.players || []), player];
        return {
          myTeam: { ...state.myTeam, players, size: players.length }
        };
      }),

      deleteMyPlayer: (id) => set((state) => {
        const players = (state.myTeam.players || []).filter(p => p.id !== id);
        return {
          myTeam: { ...state.myTeam, players, size: players.length }
        };
      }),

      addOpponentPlayer: (player) => set((state) => {
        const players = [...(state.opponentTeam.players || []), player];
        return {
          opponentTeam: { ...state.opponentTeam, players, size: players.length }
        };
      }),

      deleteOpponentPlayer: (id) => set((state) => {
        const players = (state.opponentTeam.players || []).filter(p => p.id !== id);
        return {
          opponentTeam: { ...state.opponentTeam, players, size: players.length }
        };
      }),

      saveMatrix: (matrix) => set({ matrices: matrix }),

      startNewRound: () => set((state) => {
        const newRoundId = crypto.randomUUID();
        const newRound: Round = {
          id: newRoundId,
          name: `Ronde ${state.rounds.length + 1}`,
          isCompleted: false,
          pairings: []
        };
        return {
          rounds: [...state.rounds, newRound],
          activeRoundId: newRoundId
        };
      }),

      completeRound: (roundId) => set((state) => ({
        rounds: state.rounds.map(r => r.id === roundId ? { ...r, isCompleted: true } : r),
        activeRoundId: state.activeRoundId === roundId ? null : state.activeRoundId
      })),

      deleteRound: (roundId) => set((state) => ({
        rounds: state.rounds.filter(r => r.id !== roundId),
        activeRoundId: state.activeRoundId === roundId ? null : state.activeRoundId
      })),

      assignOpponentToRound: (roundId, oppTeamId) => set((state) => ({
        rounds: state.rounds.map(r => r.id === roundId ? { ...r, assignedOpponentTeamId: oppTeamId } : r)
      })),

      saveRoundPairings: (roundId, pairings) => set((state) => ({
        rounds: state.rounds.map(r => r.id === roundId ? { ...r, pairings } : r)
      })),

      generateRandomOpponentTeam: (name = "Équipe Adverse Aléatoire") => {
        const sampleNames = ["Alex", "Thomas", "Nicolas", "Julien", "David", "Maxime", "Lucas", "Romain"];
        const sampleFactions = ["Space Marines", "Aeldari", "Orks", "Tyranids", "Necrons", "World Eaters", "Tau Empire", "Astra Militarum"];
        
        const players: Player[] = Array.from({ length: 5 }, (_, i) => ({
          id: crypto.randomUUID(),
          name: `${sampleNames[Math.floor(Math.random() * sampleNames.length)]} ${i + 1}`,
          faction: sampleFactions[Math.floor(Math.random() * sampleFactions.length)],
          disposition: 'Balanced',
          tablePreferences: {}
        }));

        const newTeam: Team = { id: crypto.randomUUID(), name, size: players.length, players };
        set({ opponentTeam: newTeam });
      },

      generateMetaOptimizedTeam: () => {
        const matrices = get().matrices?.factionVsFaction || {};
        const allFactions = Object.keys(matrices);
        
        if (allFactions.length === 0) return;

        const scoredFactions = allFactions.map(faction => {
          const scores = Object.values(matrices[faction] || {}) as number[];
          const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          return { faction, avg };
        }).sort((a, b) => b.avg - a.avg);

        const topFaction = scoredFactions[0]?.faction || "Space Marines";

        const optimizedPlayers: Player[] = Array.from({ length: 5 }, (_, i) => ({
          id: crypto.randomUUID(),
          name: `Champion ${i + 1}`,
          faction: topFaction,
          disposition: 'Balanced',
          tablePreferences: {}
        }));

        set((state) => ({
          myTeam: {
            ...state.myTeam,
            name: `Meta Dream Team (${topFaction})`,
            players: optimizedPlayers,
            size: optimizedPlayers.length
          }
        }));
      }
    }),
    {
      name: 'wtc-pairing-storage'
    }
  )
);
