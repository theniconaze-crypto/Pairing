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

  // Nouvelles actions de génération
  generateRandomOpponentTeam: () => void;
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
        return { myTeam: { ...state.myTeam, players, size: players.length } };
      }),

      deleteMyPlayer: (id) => set((state) => {
        const players = (state.myTeam.players || []).filter(p => p.id !== id);
        return { myTeam: { ...state.myTeam, players, size: players.length } };
      }),

      addOpponentPlayer: (player) => set((state) => {
        const players = [...(state.opponentTeam.players || []), player];
        return { opponentTeam: { ...state.opponentTeam, players, size: players.length } };
      }),

      deleteOpponentPlayer: (id) => set((state) => {
        const players = (state.opponentTeam.players || []).filter(p => p.id !== id);
        return { opponentTeam: { ...state.opponentTeam, players, size: players.length } };
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
        return { rounds: [...state.rounds, newRound], activeRoundId: newRoundId };
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

      // Logique de génération d'équipe aléatoire
      generateRandomOpponentTeam: () => {
        const sampleNames = ["Alex", "Thomas", "Nicolas", "Julien", "David", "Maxime", "Lucas", "Romain"];
        const sampleFactions = ["Space Marines", "Aeldari", "Orks", "Tyranids", "Necrons", "World Eaters", "Tau Empire", "Astra Militarum"];
        
        const players: Player[] = Array.from({ length: 5 }, (_, i) => ({
          id: crypto.randomUUID(),
          name: `${sampleNames[Math.floor(Math.random() * sampleNames.length)]} ${i + 1}`,
          faction: sampleFactions[Math.floor(Math.random() * sampleFactions.length)],
          disposition: 'Balanced',
          tablePreferences: {}
        }));

        set({ opponentTeam: { id: crypto.randomUUID(), name: "Équipe Adverse Aléatoire", size: players.length, players } });
      },

      // Logique de génération optimisée Meta
      generateMetaOptimizedTeam: () => {
        const matrices = get().matrices?.factionVsFaction || {};
        const allFactions = Object.keys(matrices);
        
        if (allFactions.length === 0) {
          alert("La matrice Meta est vide. Veuillez remplir les scores de factions d'abord.");
          return;
        }

        const scoredFactions = allFactions.map(faction => {
          const scores = Object.values(matrices[faction] || {}) as number[];
          const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          return { faction, avg };
        }).sort((a, b) => bPour pouvoir te fournir les codes **complets et exacts** à modifier, il me manque une information essentielle : je n'ai pas accès à ton code actuel. 

Pour que la solution s'intègre parfaitement, j'ai besoin de connaître la structure de tes données (comment sont stockés tes personnages/joueurs et ce fameux "tableau meta") ainsi que l'architecture de ton interface.

En attendant, voici la logique JavaScript standard que tu pourras adapter ou qui me servira de base dès que tu m'auras fourni ton code.

### 1. Logique pour générer l'équipe adverse aléatoire

L'idéal est d'utiliser un algorithme de mélange (comme le *Fisher-Yates*) pour piocher au hasard dans ta base de données de personnages sans doublons.

```javascript
// Fonction pour générer une équipe aléatoire
function genererEquipeAdverseAleatoire(baseDeDonnees, tailleEquipe = 4) {
  // On crée une copie pour ne pas altérer la base originale
  let personnagesDisponibles = [...baseDeDonnees];
  let equipeAdverse = [];

  for (let i = 0; i < tailleEquipe; i++) {
    if (personnagesDisponibles.length === 0) break;
    
    // Sélection d'un index aléatoire
    const indexAleatoire = Math.floor(Math.random() * personnagesDisponibles.length);
    
    // Ajout du personnage à l'équipe et retrait des choix possibles
    equipeAdverse.push(personnagesDisponibles[indexAleatoire]);
    personnagesDisponibles.splice(indexAleatoire, 1);
  }

  return equipeAdverse;
}
