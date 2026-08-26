import React, { useState } from 'react';
import { Sliders, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { useMetaStore } from '../store/useMetaStore';
import { ScoreRating } from '../types';

export const MetaEditor: React.FC = () => {
  const { matrices, updateMatrices, refreshMetaFromAI, isSyncing } = useMetaStore();
  const [selectedFaction, setSelectedFaction] = useState<string>('Space Marines');

  const factions = Object.keys(matrices.factionVsFaction);
  const possibleRatings: ScoreRating[] = [-3, -2, -1, 0, 1, 2, 3];

  const handleScoreChange = (oppFaction: string, value: ScoreRating) => {
    const updated = JSON.parse(JSON.stringify(matrices));
    if (!updated.factionVsFaction[selectedFaction]) {
      updated.factionVsFaction[selectedFaction] = {};
    }
    updated.factionVsFaction[selectedFaction][oppFaction] = value;
    updated.isManuallyOverridden = true;
    updateMatrices(updated);
  };

  return (
    <div className="p-4 space-y-4 pb-24 bg-slate-950 text-slate-100 min-h-screen">
      {/* Alerte Modification Manuelle */}
      {matrices.isManuallyOverridden && (
        <div className="bg-amber-950/80 border border-amber-600/60 rounded-2xl p-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <span className="font-bold">Pondération manuelle active :</span> Vos ajustements seront conservés localement mais <span className="underline">seront écrasés</span> lors du prochain rafraîchissement IA/Meta.
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 font-semibold text-sm text-sky-400">
          <Sliders className="w-4 h-4" /> Éditeur de Matrice Faction vs Faction
        </div>
        <button
          onClick={refreshMetaFromAI}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 active:scale-95 px-3 py-1.5 rounded-xl text-sky-400 border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          Reset IA Meta
        </button>
      </div>

      {/* Sélection de Faction */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {factions.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFaction(f)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedFaction === f
                ? 'bg-sky-600 text-white'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grille d'Ajustement */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {selectedFaction} contre :
        </h3>
        <div className="space-y-3 divide-y divide-slate-800/60">
          {factions.filter((f) => f !== selectedFaction).map((oppFaction) => {
            const currentVal = matrices.factionVsFaction[selectedFaction]?.[oppFaction] ?? 0;
            return (
              <div key={oppFaction} className="pt-3 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span>{oppFaction}</span>
                  <span className={`font-mono font-bold ${currentVal > 0 ? 'text-emerald-400' : currentVal < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {currentVal > 0 ? `+${currentVal}` : currentVal}
                  </span>
                </div>
                <div className="flex justify-between gap-1">
                  {possibleRatings.map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleScoreChange(oppFaction, rating)}
                      className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all ${
                        currentVal === rating
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 active:bg-slate-800'
                      }`}
                    >
                      {rating > 0 ? `+${rating}` : rating}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};