// src/components/MetaTab.tsx
import React from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { RefreshCw, Database, CheckCircle2, AlertCircle } from 'lucide-react';

export const MetaTab: React.FC = () => {
  const { winrates, matrices, isSyncing, lastUpdated, dataSource, refreshMetaFromAI, resetToDefaults, updateMatrixCell } = useMetaStore();

  const factions = Object.keys(winrates);

  const getScoreBadgeClass = (val: number) => {
    if (val >= 2) return "bg-emerald-600 text-white font-bold";
    if (val === 1) return "bg-emerald-100 text-emerald-800 font-medium";
    if (val === 0) return "bg-slate-100 text-slate-700";
    if (val === -1) return "bg-rose-100 text-rose-800 font-medium";
    return "bg-rose-600 text-white font-bold";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Info & Sync */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 text-white p-5 rounded-xl shadow-md gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            Matrice & Winrates Méta Tournois (WTC 10e Éd.)
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Source : <span className="font-semibold text-sky-300">{dataSource}</span> • Dernier relevé : {lastUpdated}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => resetToDefaults()}
            className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition"
          >
            Réinitialiser
          </button>
          <button
            onClick={() => refreshMetaFromAI()}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold shadow disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Analyse des Winrates...' : 'Rafraîchir les Stats'}
          </button>
        </div>
      </div>

      {/* Aperçu des Winrates Global (%) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Winrates GT Officiels (% Victoires Tournois)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {factions.map(f => (
            <div key={f} className="p-2 bg-slate-50 border border-slate-100 rounded text-xs flex justify-between items-center">
              <span className="font-medium text-slate-800 truncate">{f}</span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${winrates[f] >= 53 ? 'text-emerald-700 bg-emerald-50' : winrates[f] <= 47 ? 'text-rose-700 bg-rose-50' : 'text-slate-600'}`}>
                {winrates[f]}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Matrice WTC (-3 à +3) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Matrice Matchup WTC Calculée (-3 à +3)</h3>
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 border border-slate-200 bg-slate-100 text-left">VS</th>
              {factions.map(f => (
                <th key={f} className="p-1 border border-slate-200 bg-slate-50 font-semibold text-slate-700 min-w-[36px]">
                  {f.substring(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factions.map(fA => (
              <tr key={fA}>
                <td className="p-2 border border-slate-200 font-semibold text-slate-800 text-left bg-slate-50 truncate max-w-[120px]">
                  {fA}
                </td>
                {factions.map(fB => {
                  const val = matrices[fA]?.[fB] ?? 0;
                  return (
                    <td key={fB} className="border border-slate-200 p-0.5">
                      <select
                        value={val}
                        onChange={(e) => updateMatrixCell(fA, fB, parseInt(e.target.value))}
                        className={`w-8 h-8 rounded text-center cursor-pointer border-0 ${getScoreBadgeClass(val)}`}
                      >
                        <option value={3}>+3</option>
                        <option value={2}>+2</option>
                        <option value={1}>+1</option>
                        <option value={0}>0</option>
                        <option value={-1}>-1</option>
                        <option value={-2}>-2</option>
                        <option value={-3}>-3</option>
                      </select>
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