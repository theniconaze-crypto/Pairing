import React, { useState } from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { RefreshCw, Save, Sparkles, Key, Info } from 'lucide-react';

export const MetaEditor: React.FC = () => {
  const store = useMetaStore();

  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem('gemini_api_key') || ''
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // SÉCURITÉ : Garantit un objet valide pour éviter l'écran noir
  const rawMeta = store.matrices?.metaRatings || {};
  const [ratings, setRatings] = useState<Record<string, number>>(rawMeta);

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

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleRatingChange = (faction: string, val: string) => {
    const num = parseInt(val, 10);
    const clamped = isNaN(num) ? 0 : Math.min(3, Math.max(-3, num));
    setRatings((prev) => ({ ...prev, [faction]: clamped }));
  };

  // Appel à l'API Gemini Flash pour analyser le Meta V11
  const fetchMetaFromGemini = async () => {
    if (!apiKey.trim()) {
      alert('Veuillez renseigner votre clé API Gemini.');
      return;
    }

    setLoading(true);
    setStatusMessage('Analyse des données Meta W40k V11 via Gemini...');

    const prompt = `
Tu es un expert W40K V11 et tournois WTC.
Analyse les winrates récents et la meta globale des factions Warhammer 40,000 V11.
Attribue à chaque faction un score de puissance relative de -3 (très faible/defavorable) à +3 (ultra dominante/meta).
Retourne EXCLUSIVEMENT un JSON valide respectant cette structure exacte, sans texte autour :
{
  "factions": {
    "Space Marines": 0,
    "Aeldari": 2,
    "Necrons": 1
  }
}
Liste des factions à évaluer : ${factionsList.join(', ')}.
    `.trim();

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Extraction du JSON depuis la réponse nettoyée
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Format de réponse invalide reçu de Gemini.');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const newRatings: Record<string, number> = parsed.factions || {};

      // Clamp des valeurs entre -3 et +3
      const cleanedRatings: Record<string, number> = {};
      factionsList.forEach((faction) => {
        const val = newRatings[faction] ?? ratings[faction] ?? 0;
        cleanedRatings[faction] = Math.min(3, Math.max(-3, val));
      });

      setRatings(cleanedRatings);
      
      // Sauvegarde dans le Store
      const updatedMatrices = {
        ...(store.matrices || {}),
        metaRatings: cleanedRatings
      };
      if (store.saveMatrix) {
        store.saveMatrix(updatedMatrices);
      }

      setStatusMessage('Meta rafraîchie avec succès !');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Erreur lors de la récupération : ${err.message || 'Problème de connexion API'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = () => {
    const updatedMatrices = {
      ...(store.matrices || {}),
      metaRatings: ratings
    };
    if (store.saveMatrix) {
      store.saveMatrix(updatedMatrices);
    }
    alert('Modifications manuelles du Meta sauvegardées !');
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      {/* En-tête */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Vision Meta & Winrates W40K V11
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pondération globale des factions (-3 : Très Faible, 0 : Équilibré, +3 : Meta Dominant).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetaFromGemini}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir via Gemini AI
            </button>
            <button
              onClick={handleManualSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition"
            >
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>
        </div>

        {/* Clef API Gemini */}
        <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <Key className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            type="password"
            placeholder="Clé API Gemini (Flash 1.5/3.5)..."
            value={apiKey}
            onChange={(e) => handleSaveApiKey(e.target.value)}
            className="w-full bg-transparent text-xs text-white outline-none"
          />
        </div>

        {statusMessage && (
          <p className="text-xs text-sky-400 flex items-center gap-1 font-mono">
            <Info className="w-3.5 h-3.5" /> {statusMessage}
          </p>
        )}
      </div>

      {/* Grille des Factions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {factionsList.map((faction) => {
          const score = ratings[faction] ?? 0;

          // Palette dynamique de couleur en fonction du score WTC
          let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
          if (score > 0) badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-800';
          if (score < 0) badgeColor = 'bg-rose-950/60 text-rose-300 border-rose-800';

          return (
            <div
              key={faction}
              className={`p-3 rounded-lg border flex items-center justify-between transition ${badgeColor}`}
            >
              <span className="text-xs font-bold truncate pr-2">{faction}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="-3"
                  max="3"
                  value={score}
                  onChange={(e) => handleRatingChange(faction, e.target.value)}
                  className="w-12 h-8 bg-slate-950 border border-slate-700 rounded text-center text-xs font-bold text-white outline-none focus:border-sky-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
