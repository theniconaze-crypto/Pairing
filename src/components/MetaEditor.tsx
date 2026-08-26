import React, { useState } from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { RefreshCw, Database, KeyRound, Check, AlertTriangle } from 'lucide-react';

export const MetaEditor: React.FC = () => {
  const { winrates, matrices, isSyncing, lastUpdated, dataSource, geminiApiKey, setGeminiApiKey, refreshMetaFromAI, resetToDefaults, updateMatrixCell } = useMetaStore();
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
    if (val === 1) return "bg-emerald-100 text-emerald-800 font-medium";
    if (val === 0) return "bg-slate-100 text-slate-700";
    if (val === -1) return "bg-rose-100 text-rose-800 font-medium";
    return "bg-rose-600 text-white font-bold";
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Panneau de configuration de l'API */}
      <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-md">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-amber-400" />
          Moteur d'Intelligence Artificielle (Google Gemini)
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Connectez votre clé API Google Gemini pour analyser le web en temps réel et générer une matrice WTC basée sur les toutes dernières discussions, listes de tournois et retours de la communauté V11.
        </p>
        
        <div className="flex items-center gap-3">
          <input 
            type="password"
            placeholder="Entrez votre clé API Gemini (AIzaSy...)"
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-amber-500"
          />
          <button 
            onClick={saveApiKey}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg flex items-center gap-2 transition"
          >
            {showKeySaved ? <Check className="w-4 h-4 text-emerald-400" /> : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Header Info & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 text-white p-5 rounded-xl shadow-md gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            Matrice de Winrates 
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Source : <span className="font-semibold text-sky-300">{dataSource}</span> • MAJ : {lastUpdated}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => resetToDefaults()} className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg transition">
            Reset (Hors-ligne)
          </button>
          <button
            onClick={() => refreshMetaFromAI()}
            disabled={isSyncing || !geminiApiKey}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold shadow-lg disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Analyse Gemini en cours...' : 'Générer la Méta via IA'}
          </button>
        </div>
      </div>

      {/* Reste du code de votre matrice et des winrates... */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {/* ... L'affichage du tableau WTC reste identique à votre version ... */}
      </div>

    </div>
  );
};
