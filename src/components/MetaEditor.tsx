import React, { useState, useEffect } from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { Save, Info, RefreshCw } from 'lucide-react';

export const MetaEditor: React.FC = () => {
  const store = useMetaStore();

  // 🛡️ SÉCURITÉ : Garantir un objet valide même si le store contient undefined
  const rawMatrix = store.matrices?.factionVsFaction || {};
  const [matrixData, setMatrixData] = useState<Record<string, Record<string, number>>>(rawMatrix);

  useEffect(() => {
    setMatrixData(store.matrices?.factionVsFaction || {});
  }, [store.matrices]);

  // Factions par défaut si la matrice Meta n'a pas encore été initialisée
  const defaultFactions = [
    'Space Marines',
    'Aeldari',
    'Orks',
    'Tyranids',
    'Necrons',
    'World Eaters',
    'Tau Empire',
    'Astra Militarum'
  ];

  // Extraction sécurisée des factions
  const factions = Object.keys(matrixData).length > 0 ? Object.keys(matrixData) : defaultFactions;

  const handleScoreChange = (rowFaction: string, colFaction: string, value: string) => {
    const numValue = parseInt(value, 10);
    const score = isNaN(numValue) ? 0 : Math.min(20, Math.max(0, numValue));

    setMatrixData((prev) => ({
      ...prev,
      [rowFaction]: {
        ...(prev[rowFaction] || {}),
        [colFaction]: score
      }
    }));
  };

  const handleSave = () => {
    const updatedMatrices = {
      ...(store.matrices || {}),
      factionVsFaction: matrixData
    };

    if (store.saveMatrix) {
      store.saveMatrix(updatedMatrices);
    }
    alert('Matrice Meta sauvegardée !');
  };

  const handleReset = () => {
    const emptyMatrix: Record<string, Record<string, number>> = {};
    defaultFactions.forEach((f1) => {
      emptyMatrix[f1] = {};
      defaultFactions.forEach((f2) => {
        emptyMatrix[f1][f2] = 10; // Matchup équilibré par défaut (10-10)
      });
    });
    setMatrixData(emptyMatrix);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-24">
      {/* En-tête */}
      <div className="bg-slate-900 border border-slate-800 p-4 md:p-5 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-sky-400" />
            Éditeur de Matrice Meta (WTC)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Définissez les scores théoriques (0 à 20) de chaque faction contre les autres.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition border border-slate-700"
          >
            <RefreshCw className="w-4 h-4" /> Réinitialiser
          </button>
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow transition"
          >
            <Save className="w-4 h-4" /> Sauvegarder
          </button>
        </div>
      </div>

      {/* Tableau de la matrice */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-950 text-slate-300 uppercase sticky top-0 z-10">
            <tr>
              <th className="p-3 font-bold border-b border-r border-slate-800 text-sky-400 min-w-[130px] bg-slate-950">
                Attaquant \ Défenseur
              </th>
              {factions.map((f) => (
                <th key={f} className="p-2 text-center font-bold border-b border-slate-800 min-w-[75px]">
                  <span className="block truncate text-[10px]" title={f}>
                    {f}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factions.map((rowFaction) => (
              <tr key={rowFaction} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
                <td className="p-2.5 font-semibold text-slate-200 border-r border-slate-800 bg-slate-950/40 whitespace-nowrap">
                  {rowFaction}
                </td>
                {factions.map((colFaction) => {
                  const val = matrixData[rowFaction]?.[colFaction];
                  const isSelf = rowFaction === colFaction;

                  return (
                    <td key={`${rowFaction}-${colFaction}`} className={`p-1 ${isSelf ? 'bg-slate-950/80' : ''}`}>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        disabled={isSelf}
                        value={val !== undefined ? val : ''}
                        onChange={(e) => handleScoreChange(rowFaction, colFaction, e.target.value)}
                        placeholder={isSelf ? '-' : '10'}
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
