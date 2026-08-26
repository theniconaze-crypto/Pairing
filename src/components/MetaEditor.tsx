// src/components/MetaEditor.tsx
import React, { useState } from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { RefreshCw, Database, KeyRound, Check } from 'lucide-react';

export const MetaEditor: React.FC = () => {
  const { 
    winrates, 
    matrices, 
    isSyncing, 
    lastUpdated, 
    dataSource, 
    geminiApiKey, 
    setGeminiApiKey, 
    refreshMetaFromAI, 
    resetToDefaults, 
    updateMatrixCell 
  } = useMetaStore();

  const factions = Object.keys(winrates);
  const [tempKey, setTempKey] = useState(geminiApiKey);
  const [showKeySaved, setShowKeySaved] = useState(false);

  const saveApiKey = () => {
    setGeminiApiKey(tempKey);
    setShowKeySaved(true);
    setTimeout(() => setShowKeySaved(false), 2000);
  };

  const getScoreBadgeClass = (val: number) => {
    if (val >= 2) return "bg-emerald-600 text-white font-bold";
    if (val === 1) return "bg-emerald-500/20 text-emerald-300 font-medium";
    if (val === 0) return "bg-slate-700 text-slate-300";
    if (val === -1) return "bg-rose-500/20 text-rose-300 font-medium";
    return "bg-rose-600 text-white font-bold";
  };

  const factionVsFaction = matrices?.factionVsFaction || {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Panneau Clé API Gemini 3.5 Flash */}
      <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-md">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
          <KeyRound className="w-5 h-5 text-amber-400" />
          Clé API Google Gemini 3.5 Flash
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Entrez votre clé pour que l'IA interroge la méta en direct.
        </p>
        
        <div className="flex items-center gap-3">
          <input 
            type="password"
            placeholder="AIzaSy..."
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-amber-500"
          />
          <button 
            onClick={saveApiKey}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg flex items-center gap-2 transition"
          >
            {showKeySaved ? <Check className="w-4 h-4 text-emerald-400" /> : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Header & Bouton de Synchro */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 text-white p-5 rounded-xl shadow-md gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            Matrice des Matchups WTC
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Source : <span className="font-semibold text-sky-300">{dataSource}</span> • MAJ : {lastUpdated}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => resetToDefaults()} className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg transition">
            Reset Défaut
          </button>
          <button
            onClick={() => refreshMetaFromAI()}
            disabled={isSyncing || !geminiApiKey}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-bold shadow-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Analyse Gemini 3.5 en cours...' : 'Rafraîchir la Méta via IA'}
          </button>
        </div>
      </div>

      {/* LE TABLEAU DE LA MÉTA (Garanti d'être visible) */}
      <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg overflow-x-auto">
        <h3 className="text-md font-bold text-white mb-4">Matrice Croisée Faction vs Faction (-3 à +3)</h3>
        
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-300 sticky top-0 z-10">
                <th className="p-2 border border-slate-700 text-left font-bold bg-slate-950">Faction (Ligne / Colonne)</th>
                {factions.map(f => (
                  <th key={f} className="p-2 border border-slate-700 text-center truncate max-w-[90px]" title={f}>
                    {f.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {factions.map(fA => (
                <tr key={fA} className="hover:bg-slate-800/50">
                  <td className="p-2 border border-slate-700 font-bold text-slate-200 bg-slate-950 sticky left-0 z-0">
                    {fA} ({winrates[fA]}%)
                  </td>
                  {factions.map(fB => {
                    const score = factionVsFaction[fA]?.[fB] ?? 0;
                    return (
                      <td key={fB} className="p-1 border border-slate-800 text-center">
                        <select
                          value={score}
                          onChange={(e) => updateMatrixCell(fA, fB, Number(e.target.value) as any)}
                          className={`w-full p-1 rounded text-center font-bold outline-none cursor-pointer ${getScoreBadgeClass(score)}`}
                        >
                          <option value="3">+3 (Écrasant)</option>
                          <option value="2">+2 (Avantage)</option>
                          <option value="1">+1 (Léger +)</option>
                          <option value="0">0 (Égalité)</option>
                          <option value="-1">-1 (Léger -)</option>
                          <option value="-2">-2 (Désavantage)</option>
                          <option value="-3">-3 (Impossible)</option>
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

    </div>
  );
};
