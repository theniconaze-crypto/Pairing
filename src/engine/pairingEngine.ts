import { Player, MatchupMatrices, StrategyOption } from '../types';

/**
 * Convertit un score brut (-3 a +3) en points WTC (0 a 20)
 */
export function ratingToWTC(score: number): number {
  const clamped = Math.max(-3, Math.min(3, score));
  if (clamped >= 0) {
    if (clamped >= 2) return 15 + (clamped - 2) * 3;
    if (clamped >= 1) return 12 + (clamped - 1) * 3;
    return 10 + clamped * 2;
  } else {
    if (clamped <= -2) return 5 + (clamped + 2) * 3;
    if (clamped <= -1) return 8 + (clamped + 1) * 3;
    return 10 + clamped * 2;
  }
}

/**
 * Calcul du Score Brut combiné : (Faction * 0.6) + (Disposition * 0.4) + Malus/Bonus Table
 */
export function calculateMatchupScore(
  myPlayer: Player,
  oppPlayer: Player,
  mapId: string,
  matrices: MatchupMatrices
): { scoreBrut: number; scoreWTC: number } {
  const factionScore = matrices.factionVsFaction[myPlayer.faction]?.[oppPlayer.faction] ?? 0;
  const dispScore = matrices.dispositionVsDisposition[myPlayer.disposition]?.[oppPlayer.disposition] ?? 0;
  const tableScore = myPlayer.tablePreferences[mapId] ?? 0;

  const scoreBrut = (factionScore * 0.6) + (dispScore * 0.4) + tableScore;
  const scoreWTC = ratingToWTC(scoreBrut);

  return { scoreBrut, scoreWTC };
}

/**
 * Algorithme Hongrois (Kuhn-Munkres) - O(N^3)
 */
export function solveHungarian(costMatrix: number[][]): number[] {
  const n = costMatrix.length;
  if (n === 0) return [];

  let maxVal = -Infinity;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (costMatrix[i][j] > maxVal) maxVal = costMatrix[i][j];
    }
  }

  const C = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => maxVal - costMatrix[i][j])
  );

  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= n; j++) {
        if (!used[j]) {
          const cur = C[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const result = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) {
    if (p[j] !== 0) {
      result[p[j] - 1] = j - 1;
    }
  }
  return result;
}

/**
 * Solveur Minimax pour recommander la meilleure action de Draft WTC
 */
export function getMinimaxRecommendation(
  myPlayers: Player[],
  oppPlayers: Player[],
  maps: string[],
  matrices: MatchupMatrices,
  defenderId: string,
  attackerIds: string[],
  strategy: StrategyOption
): { recommendedAttackerId: string; recommendedMapId: string; expectedScore: number } {
  const defender = myPlayers.find((p) => p.id === defenderId);
  if (!defender) throw new Error('Défenseur introuvable');

  let bestAttackerId = attackerIds[0];
  let bestMapId = maps[0];
  let maxGuaranteedScore = -Infinity;

  for (const attId of attackerIds) {
    const attacker = oppPlayers.find((p) => p.id === attId);
    if (!attacker) continue;

    for (const mapId of maps) {
      const { scoreWTC } = calculateMatchupScore(defender, attacker, mapId, matrices);

      const remMy = myPlayers.filter((p) => p.id !== defenderId);
      const remOpp = oppPlayers.filter((p) => p.id !== attId);
      const remMaps = maps.filter((m) => m !== mapId);

      let subMatrixScore = 0;
      if (remMy.length > 0 && remOpp.length > 0) {
        const matrix = remMy.map((myP) =>
          remOpp.map((oppP) => {
            const scores = remMaps.map((m) => calculateMatchupScore(myP, oppP, m, matrices).scoreWTC);
            return Math.max(...scores);
          })
        );
        const matching = solveHungarian(matrix);
        subMatrixScore = matching.reduce((acc, oppIdx, myIdx) => acc + matrix[myIdx][oppIdx], 0);
      }

      const totalBranchScore = strategy === 'MAX_SCORE' 
        ? scoreWTC + subMatrixScore 
        : scoreWTC - Math.abs(10 - scoreWTC) * 0.5 + subMatrixScore;

      if (totalBranchScore > maxGuaranteedScore) {
        maxGuaranteedScore = totalBranchScore;
        bestAttackerId = attId;
        bestMapId = mapId;
      }
    }
  }

  return {
    recommendedAttackerId: bestAttackerId,
    recommendedMapId: bestMapId,
    expectedScore: maxGuaranteedScore
  };
}
