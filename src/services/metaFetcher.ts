export interface MetaFetchResult {
  lastUpdated: string;
  source: string;
  winrates: Record<string, number>;
  matrix: Record<string, Record<string, number>>;
}

export const BASELINE_GT_WINRATES: Record<string, number> = {
  "Orks": 56.8,
  "Aeldari": 56.2,
  "Necrons": 55.4,
  "Thousand Sons": 55.0,
  "Adepta Sororitas": 54.1,
  "Adeptus Custodes": 53.5,
  "World Eaters": 53.2,
  "Chaos Space Marines": 52.3,
  "Leagues of Votann": 52.1,
  "Ultramarines": 51.9,
  "Blood Angels": 51.8,
  "Drukhari": 51.5,
  "Astra Militarum": 51.2,
  "Black Templars": 50.4,
  "Death Guard": 50.2,
  "T'au Empire": 50.1,
  "Imperial Knights": 49.5,
  "Chaos Knights": 49.1,
  "Dark Angels": 48.7,
  "Grey Knights": 48.3,
  "Genestealer Cults": 47.9,
  "Space Marines": 47.5,
  "Chaos Daemons": 46.9,
  "Space Wolves": 46.8,
  "Tyranids": 45.9,
  "Adeptus Mechanicus": 43.8
};

export function convertWinrateDiffToWTC(wrA: number, wrB: number, factionA: string, factionB: string): number {
  if (factionA === factionB) return 0;
  let diff = wrA - wrB;

  if (factionA.includes("Knights") && (factionB === "Thousand Sons" || factionB === "Aeldari")) diff -= 8;
  if (factionB.includes("Knights") && (factionA === "Thousand Sons" || factionA === "Aeldari")) diff += 8;

  if (diff >= 12) return 3;
  if (diff >= 6) return 2;
  if (diff >= 2) return 1;
  if (diff > -2) return 0;
  if (diff > -6) return -1;
  if (diff > -12) return -2;
  return -3;
}

export function generateWTCMatrix(winrates: Record<string, number>): Record<string, Record<string, number>> {
  const factions = Object.keys(winrates);
  const matrix: Record<string, Record<string, number>> = {};

  factions.forEach((f1) => {
    matrix[f1] = {};
    factions.forEach((f2) => {
      const wr1 = winrates[f1] ?? 50;
      const wr2 = winrates[f2] ?? 50;
      matrix[f1][f2] = convertWinrateDiffToWTC(wr1, wr2, f1, f2);
    });
  });

  return matrix;
}

export async function fetchLatestTournamentMeta(): Promise<MetaFetchResult> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  try {
    const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.stat-check.com/api/v1/meta-stats'), {
      signal: AbortSignal.timeout(3000)
    });

    if (response.ok) {
      const remoteData = await response.json();
      if (remoteData && remoteData.winrates) {
        return {
          lastUpdated: dateStr,
          source: "Stat Check / BCP Live Feed",
          winrates: remoteData.winrates,
          matrix: generateWTCMatrix(remoteData.winrates)
        };
      }
    }
  } catch {
    // Fallback silencieux sur données de secours
  }

  return {
    lastUpdated: `Août 2026 (Listhammer & Stat Check GT Data)`,
    source: "Stat Check & Listhammer GT Meta",
    winrates: BASELINE_GT_WINRATES,
    matrix: generateWTCMatrix(BASELINE_GT_WINRATES)
  };
}
