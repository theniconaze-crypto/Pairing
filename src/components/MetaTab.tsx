import React, { useState, useEffect } from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { Save, Info } from 'lucide-react';

export const MetaTab: React.FC = () => {
  const store = useMetaStore();
  
  // 🛡️ CORRECTION SÉCURITÉ ICI : 
  // On utilise "?." et "|| {}" pour garantir qu'on a toujours un objet valide, même si le store est vide
  const safeMatrices = store.matrices?.factionVsFaction || {};
  
  const [localData, setLocalData] = useState<Record<string, Record<string, number>>>(safeMatrices);

  // Met à jour l'affichage si le store change
  useEffect(() => {
    setLocalData(store.matrices?.factionVsFaction || {});
  }, [store.matrices]);

  // Liste de factions par défaut si la matrice est complètement vide
  const defaultFactions = [
    "Space Marines", "Aeldari", "Orks", "Tyranids", 
    "Necrons", "World Eaters", "Tau Empire", "Astra Militarum"
  ];

  // 🛡️ SÉCURITÉ : On lit les clés existantes. Si l'objet est vide, on utilise la liste par défaut.
  const existingFactions = Object.keys(safeMatrices);
  const factionsToDisplay = existingFactions.length > 0 ? existingFactions : defaultFactions;

  const handleScoreChange = (factionA: string, factionB: string, value: string) => {
    const score = parseInt(value, 10);
    if (isNaN(score)) return;

    setLocalData(prev => ({
      ...prev,
      [factionA]: {
        ...(prev[factionA] || {}),
        [factionB]: score
      }
    }));
  };

  const handleSave = () => {
    store.saveMatrix({ factionVsFaction: localData });
    alert("Matrice Meta sauvegardée avec succès !");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Info className="w-6 h-6 text-sky-400" />
            Matrice Meta (Score WTC)
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Remplissez les scores (0 à 20) d'une faction contre une autre. Ces données serviront à générer l'équipe optimisée.
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition"
        >
          <Save className="w-4 h-4" /> Sauvegarder la Matrice
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-300 uppercase bg-slate-950">
            <tr>
              <th className="p-4 font-bold border-b border-r border-slate-800 text-sky-400">Attaquant \ Défenseur</th>
              {factionsToDisplay.map(f => (
                <th key={f} className="p-3 text-center font-bold border-b border-slate-800" style={{ minWidth: '90px' }}>
                  <span className="block truncate text-[10px]" title={f}>{f.substring(0, 12)}.</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factionsToDisplay.map((factionRow) => (
              <tr key={factionRow} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="p-3 font-bold text-slate-200 border-r border-slate-800 whitespace-nowrap bg-slate-950/50">
                  {factionRow}
                </td>
                {factionsToDisplay.map((factionCol) => {
                  const score = localData[factionRow]?.[factionCol];
                  return (
                    <td key={`${factionRow}-${factionCol}`} className="p-1">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={score !== undefined ? score : ''}
                        onChange={(e) => handleScoreChange(factionRow, factionCol, e.target.value)}
                        placeholder="-"
                        className="w-full h-10 bg-slate-950 border border-slate-800 rounded p-1 text-center text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition"
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
