import React, { useState } from 'react';
import { Shield, Swords, Sparkles, RefreshCw } from 'lucide-react';
import { Player, MatchupMatrices, StrategyOption, PairingAssignment } from '../types';
import { getMinimaxRecommendation, calculateMatchupScore } from '../engine/pairingEngine';
import { useMetaStore } from '../store/useMetaStore';

interface PairingAssistantProps {
  myPlayers: Player[];
  oppPlayers: Player[];
  availableMaps: string[];
  matrices: MatchupMatrices;
}

export const PairingAssistant: React.FC<PairingAssistantProps> = ({
  myPlayers,
  oppPlayers,
  availableMaps,
  matrices
}) => {
  const { refreshMetaFromAI, isSyncing } = useMetaStore();
  const [strategy, setStrategy] = useState<StrategyOption>('MAX_SCORE');
  const [selectedDefender, setSelectedDefender] = useState<string>(myPlayers[0]?.id || '');
  const [selectedAttackers, setSelectedAttackers] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<PairingAssignment[]>([]);

  const handleAttackerToggle = (id: string) => {
    if (selectedAttackers.includes(id)) {
      setSelectedAttackers(selectedAttackers.filter((a) => a !== id));
    } else if (selectedAttackers.length < 2) {
      setSelectedAttackers([...selectedAttackers, id]);
    }
  };

  const recommendation =
    selectedDefender && selectedAttackers.length === 2
      ? getMinimaxRecommendation(
          myPlayers,
          oppPlayers,
          availableMaps,
          matrices,
          selectedDefender,
          selectedAttackers,
          strategy
        )
      : null;

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 text-slate-100 min-h-screen pb-24">
      {/* Header Strategy & AI Refresh */}
      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setStrategy('MAX_SCORE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              strategy === 'MAX_SCORE' ? 'bg-sky-600 text-white' : 'text-slate-400'
            }`}
          >
            Max Points
          </button>
          <button
            onClick={() => setStrategy('MIN_RISK')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              strategy === 'MIN_RISK' ? 'bg-amber-600 text-white' : 'text-slate-400'
            }`}
          >
            Sécurité (Anti-Cap)
          </button>
        </div>

        <button
          onClick={refreshMetaFromAI}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 active:scale-95 px-3 py-2 rounded-xl text-sky-400 border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          Meta AI
        </button>
      </div>

      {/* Étape 1 : Défenseur */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
          <Shield className="w-4 h-4" /> 1. Sélectionner mon Défenseur
        </div>
        <div className="grid grid-cols-2 gap-2">
          {myPlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedDefender(player.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedDefender === player.id
                  ? 'bg-sky-950 border-sky-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-semibold text-xs truncate">{player.name}</div>
              <div className="text-[10px] opacity-75">{player.faction}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Étape 2 : Attaquants adverses */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <Swords className="w-4 h-4" /> 2. Révéler les 2 Attaquants Adverses
        </div>
        <div className="grid grid-cols-2 gap-2">
          {oppPlayers.map((player) => {
            const isSelected = selectedAttackers.includes(player.id);
            return (
              <button
                key={player.id}
                onClick={() => handleAttackerToggle(player.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-950 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-semibold text-xs truncate">{player.name}</div>
                <div className="text-[10px] opacity-75">{player.faction}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Étape 3 : Recommendation Minimax */}
      {recommendation && (
        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-800/60 p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" /> Recommandation Minimax
          </div>
          <div className="text-xs text-slate-200 space-y-1">
            <div>
              Prendre l'attaquant : <span className="font-bold text-emerald-300">
                {oppPlayers.find((p) => p.id === recommendation.recommendedAttackerId)?.name}
              </span>
            </div>
            <div>
              Sur la table : <span className="font-bold text-emerald-300">{recommendation.recommendedMapId}</span>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Score Garanti projeté sur la ronde : <span className="font-mono text-white">{recommendation.expectedScore.toFixed(1)} pts WTC</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};