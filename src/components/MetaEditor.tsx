import React, { useState, useEffect } from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { RefreshCw, Save, Sparkles, Key, Info } from 'lucide-react';

export const MetaEditor: React.FC = () => {
  const store = useMetaStore();

  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem('gemini_api_key') || ''
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const factionsList = [
    'Space Marines',
    'Blood Angels',
    'Dark Angels',
    'Space Wolves',
    'Black Templars',
    'Adeptus Custodes',
    'Adeptus Mechanicus',
    'Astra Militarum',
    'Imperial Knights',
    'Sisters of Battle',
    'Chaos Space Marines',
    'Chaos Knights',
    'Death Guard',
    'Thousand Sons',
    'World Eaters',
    'Aeldari',
    'Drukhari',
    'Necrons',
    'Orks',
    'Tau Empire',
    'Tyranids',
    'Genestealer Cults',
    'Leagues of Votann'
  ];

  const rawMatrix = store.matrices?.factionVsFaction || {};
  const [matrixData, setMatrixData] = useState<Record<string, Record<string, number>>>(rawMatrix);

  useEffect(() => {
    if (store.matrices?.factionVsFaction) {
      setMatrixData(store.matrices.factionVsFaction);
    }
  }, [store.matrices]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleScoreChange = (attacker: string, defender: string, val: string) => {
    const num = parseInt(val, 10);
    const score = isNaN(num) ? 10 : Math.min(20, Math.max(0, num));

    setMatrixData((prev) => ({
      ...prev,
      [attacker]: {
        ...(prev[attacker] || {}),
        [defender]: score
      }
    }));
  };

  const fetchMetaFromGemini = async () => {
    if (!apiKey.trim()) {
      alert('Veuillez renseigner votre clé API Gemini.');
      return;
    }

    setLoading(true);
    setStatusMessage('Interrogation de Gemini pour la méta W40K V11...');

    const prompt = `
En tant qu'expert des tournois Warhammer 40k V11 et du format WTC, génère une matrice de matchup Faction contre Faction.
Les scores doivent aller de 0 à 20 (10 = équilibré).
Tu DOIS retourner UNIQUEMENT un objet JSON brut, sans aucun texte avant ou après, sans balises markdown (pas de \`\`\`json).
Structure exacte attendue :
{
  "factionVsFaction": {
    "Space Marines": {
      "Space Marines": 10,
      "Aeldari": 9,
      "Orks": 11
    }
  }
}
Inclus les factions suivantes en lignes et colonnes : ${JSON.stringify(factionsList)}
    `.trim();

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 8192
            }
          })
        }
      );

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      let cleanText = rawText.trim();
      cleanText = cleanText.replace(/^```json\s*/i, '');
      cleanText = cleanText.replace(/^```\s*/i, '');
      cleanText = cleanText.replace(/\s*```$/i, '');

      const firstBrace = cleanText.indexOf('{');
      const lastBrace = cleanText.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('Aucun objet JSON valide détecté dans la réponse.');
      }

      const jsonString = cleanText.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonString);
      const newFactionVsFaction = parsed.factionVsFaction || {};

      const cleanedMatrix: Record<string, Record<string, number>> = {};
      factionsList.forEach((att) => {
        cleanedMatrix[att] = {};
        factionsList.forEach((def) => {
          const val = newFactionVsFaction[att]?.[def];
          if (att === def) {
            cleanedMatrix[att][def] = 10;
          } else {
            cleanedMatrix[att][def] = typeof val === 'number' ? Math.min(20, Math.max(0, val)) : (matrixData[att]?.[def] ?? 10);
          }
        });
      });

      setMatrixData(cleanedMatrix);

      const updatedMatrices = {
        ...(store.matrices || {}),
        factionVsFaction: cleanedMatrix
      };

      if (store.saveMatrix) {
        store.saveMatrix(updatedMatrices);
      }

      setStatusMessage('Matrice Meta mise à jour avec succès !');
    } catch (err: any) {
      console.error('Erreur Gemini:', err);
      setStatusMessage(`Erreur de compilation : ${err.message || 'Réponse invalide'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = () => {
    const updatedMatrices = {
      ...(store.matrices || {}),
      factionVsFaction: matrixData
    };
    if (store.saveMatrix) {
      store.saveMatrix(updatedMatrices);
    }
    alert('Matrice Meta sauvegardée !');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400"/>
              Compilation Meta V11 — Faction vs Faction
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Générez automatiquement via Gemini ou ajustez manuellement les scores WTC (0 à 20).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetaFromGemini}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition"
            >
              <RefreshCw ${loading ''}`} 'animate-spin' : ? className="{`w-4" h-4/>
              Compiler via Gemini AI
            </button>
            <button
              onClick={handleManualSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition"
            >
              <Save className="w-4 h-4"/>
              Sauvegarder
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <Key className="w-4 h-4 text-amber-400 shrink-0"/>
          <input
            type="password"
            placeholder="Clé API Gemini..."
            value={apiKey}
            onChange={(e) => handleSaveApiKey(e.target.value)}
            className="w-full bg-transparent text-xs text-white outline-none"
          />
        </div>

        {statusMessage && (
          <p className="text-xs text-sky-400 flex items-center gap-1 font-mono">
            <Info className="w-3.5 h-3.5"/> {statusMessage}
          </p>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-950 text-slate-300 uppercase sticky top-0 z-10">
            <tr>
              <th className="p-3 font-bold border-b border-r border-slate-800 text-sky-400 min-w-[140px] bg-slate-950">
                Attaquant \ Défenseur
              </th>
              {factionsList.map((f) => (
                <th key={f} className="p-2 text-center font-bold border-b border-slate-800 min-w-[80px]">
                  <span className="block truncate text-[10px]" title={f}>
                    {f}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factionsList.map((attFaction) => (
              <tr key={attFaction} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
                <td className="p-2.5 font-semibold text-slate-200 border-r border-slate-800 bg-slate-950/40 whitespace-nowrap">
                  {attFaction}
                </td>
                {factionsList.map((defFaction) => {
                  const score = matrixData[attFaction]?.[defFaction] ?? 10;
                  const isSelf = attFaction === defFaction;

                  let cellBg = '';
                  if (!isSelf) {
                    if (score >= 13) cellBg = 'bg-emerald-950/40 text-emerald-300';
                    else if (score <= 7) cellBg = 'bg-rose-950/40 text-rose-300';
                  }

                  return (
                    <td key={`${attFaction}-${defFaction}`} className={`p-1 ${cellBg}`}>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        disabled={isSelf}
                        value={isSelf ? 10 : score}
                        onChange={(e) => handleScoreChange(attFaction, defFaction, e.target.value)}
                        className={`w-full h-8 bg-slate-950 border ${
                          isSelf
                            ? 'border-transparent text-slate-600 cursor-not-allowed'
                            : 'border-slate-800 text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                        } rounded text-center text-xs font-mono outline-none transition`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
