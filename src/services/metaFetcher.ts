// src/services/metaFetcher.ts

export interface MetaFetchResult {
  lastUpdated: string;
  source: string;
  winrates: Record<string, number>;
  matrix: Record<string, Record<string, number>>;
}

export const BASELINE_V11_WINRATES: Record<string, number> = {
  "Chaos Daemons": 64.8, "Aeldari": 54.2, "Thousand Sons": 54.1, "Black Templars": 53.5,
  "Necrons": 52.8, "Adeptus Custodes": 52.0, "World Eaters": 51.5, "Drukhari": 51.2,
  "Chaos Space Marines": 50.8, "Imperial Knights": 50.5, "Orks": 50.1, "Blood Angels": 49.8,
  "Adepta Sororitas": 49.5, "T'au Empire": 49.2, "Astra Militarum": 48.9, "Ultramarines": 48.5,
  "Leagues of Votann": 48.0, "Chaos Knights": 47.6, "Dark Angels": 47.2, "Space Marines": 46.8,
  "Death Guard": 46.5, "Tyranids": 45.9, "Genestealer Cults": 45.2, "Space Wolves": 44.5,
  "Grey Knights": 43.8, "Adeptus Mechanicus": 42.1
};

const FACTION_LIST = Object.keys(BASELINE_V11_WINRATES);

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
  const matrix: Record<string, Record<string, number>> = {};
  FACTION_LIST.forEach((f1) => {
    matrix[f1] = {};
    FACTION_LIST.forEach((f2) => {
      const wr1 = winrates[f1] ?? 50;
      const wr2 = winrates[f2] ?? 50;
      matrix[f1][f2] = convertWinrateDiffToWTC(wr1, wr2, f1, f2);
    });
  });
  return matrix;
}

// APPEL DE L'API GEMINI 3.5 FLASH
export async function fetchMetaFromGemini(apiKey: string): Promise<MetaFetchResult> {
  if (!apiKey) throw new Error("Clé API Gemini manquante.");

  const prompt = `Tu es un expert en statistiques de tournois Warhammer 40,000 (WTC). 
  Analyse l'état actuel de la méta V11 et fournis les taux de victoires (winrates) estimés les plus récents.
  Tu DOIS retourner les données UNIQUEMENT sous la forme d'un objet JSON strict.
  Les clés doivent être EXACTEMENT les noms de factions suivants en anglais, et les valeurs doivent être des nombres décimaux (pourcentages de 0 à 100) :
  ${JSON.stringify(FACTION_LIST)}
  Format de sortie strict attendu : {"winrates": {"Faction Name": 50.5, ...}}`;

  // Utilisation de l'endpoint officiel pour gemini-3.5-flash
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // Forçage de la réponse structurée en JSON pur
      generationConfig: { 
        response_mime_type: "application/json" 
      } 
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur API Gemini 3.5 Flash (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!rawText) {
    throw new Error("Réponse vide reçue de Gemini 3.5 Flash.");
  }

  const aiResult = JSON.parse(rawText);
  const aiWinrates = aiResult.winrates;

  // Sécurité : comble les éventuelles factions manquantes avec le winrate par défaut (50%)
  const safeWinrates: Record<string, number> = {};
  FACTION_LIST.forEach(faction => {
    safeWinrates[faction] = aiWinrates[faction] !== undefined ? Number(aiWinrates[faction]) : 50.0;
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return {
    lastUpdated: dateStr,
    source: "Google Gemini 3.5 Flash AI (En direct)",
    winrates: safeWinrates,
    matrix: generateWTCMatrix(safeWinrates)
  };
}
