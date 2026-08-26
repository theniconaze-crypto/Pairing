import React, { useState } from 'react';
import { Shield, Swords, Sparkles, CheckCircle2, ChevronRight, RotateCcw } from 'lucide-react';
import { Player, MatchupMatrices, StrategyOption, PairedMatchup } from '../types';
import { getDefenderRecommendation, getMinimaxRecommendation, calculateMatchupScore, solveHungarian } from '../engine/pairingEngine';

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
  const [strategy, setStrategy] = useState<StrategyOption>('MAX_SCORE');
  const [pairings, setPairings] = useState<PairedMatchup[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [turnState, setTurnState] = useState<'SELECT_DEFENDER' | 'SELECT_ATTACKERS' | 'FINAL_SOLVE'>('SELECT_DEFENDER');

  // Pools de joueurs et maps disponibles
  const pairedMyIds = pairings.map((p) => p.myPlayerId);
  const pairedOppIds = pairings.map((p) => p.oppPlayerId);
  const pairedMapIds = pairings.map((p) => p.mapId);

  const availableMy = myPlayers.filter((p) => !pairedMyIds.includes(p.id));
  const availableOpp = oppPlayers.filter((p) => !pairedOppIds.includes(p.id));
  const remainingMaps = availableMaps.filter((m) => !pairedMapIds.includes(m));

  // Sélection en cours
  const [selectedDefenderId, setSelectedDefenderId] = useState<string>('');
  const [selectedAttackerIds, setSelectedAttackerIds] = useState<string[]>([]);

  // Recommandation Minimax Défenseur
  const defenderRecs = getDefenderRecommendation(availableMy, availableOpp, remainingMaps, matrices, strategy);

  // Recommandation Minimax Attaquant & Map
  const attackerRec =
    selectedDefenderId && selectedAttackerIds.length === 2
      ? getMinimaxRecommendation(myPlayers, oppPlayers, remainingMaps, matrices, selectedDefenderId, selectedAttackerIds, strategy)
      : null;

  const handleAttackerToggle = (id: string) => {
    if (selectedAttackerIds.includes(id)) {
      setSelectedAttackerIds(selectedAttackerIds.filter((a) => a !== id));
    } else if (selectedAttackerIds.length < 2) {
      setSelectedAttackerIds([...selectedAttackerIds, id]);
    }
  };

  const confirmPairingStep = (chosenAttackerId: string, mapId: string) => {
    const defender = myPlayers.find((p) => p.id === selectedDefenderId)!;
    const attacker = oppPlayers.find((p) => p.id === chosenAttackerId)!;
    const { scoreWTC } = calculateMatchupScore(defender, attacker, mapId, matrices);

    const newPairing: PairedMatchup = {
      stepNumber: currentStep,
      myPlayerId: selectedDefenderId,
      oppPlayerId: chosenAttackerId,
      mapId,
      predictedScoreWTC: scoreWTC
    };

    setPairings([...pairings, newPairing]);
    setSelectedDefenderId('');
    setSelectedAttackerIds([]);

    if (availableMy.length - 1 <= 2) {
      setTurnState('FINAL_SOLVE');
    } else {
      setCurrentStep(currentStep + 1);
      setTurnState('SELECT_DEFENDER');
    }
  };

  const executeHungarianFinalMatch = () => {
    if (availableMy.length === 0) return;
    const costMatrix = availableMy.map((myP) =>
      availableOpp.map((oppP) => {
        const scores = remainingMaps.map((m) => calculateMatchupScore(myP, oppP, m, matrices).scoreWTC);
        return Math.max(...scores);
      })
    );

    const matching = solveHungarian(costMatrix);
    const finalPairings: PairedMatchup[] = matching.map((oppIdx, myIdx) => {
      const myP = availableMy[myIdx];
      const oppP = availableOpp[oppIdx];
      const mapId = remainingMaps[myIdx] || remainingMaps[0];
      const { scoreWTC } = calculateMatchupScore(myP, oppP, mapId, matrices);
      return {
        stepNumber: currentStep + myIdx,
        myPlayerId: myP.id,
        oppPlayerId: oppP.id,
        mapId,
        predictedScoreWTC: scoreWTC
      };
    });

    setPairings([...pairings, ...finalPairings]);
    setTurnState('FINAL_SOLVE');
  };

  const resetPairings = () => {
    setPairings([]);
    setCurrentStep(1);
    setSelectedDefenderId('');
    setSelectedAttackerIds([]);
    setTurnState('SELECT_DEFENDER');
  };

  const totalPredictedScore = pairings.reduce((sum, p) => sum + p.predictedScoreWTC, 0);

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 text-slate-100 min-h-screen pb-28">
      {/* Header Statut et Score Cumulé */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Étape {currentStep} sur 5</div>
          <div className="text-xs font-bold text-sky-400">Score Prédictif Ronde : {totalPredictedScore} pts WTC</div>
        </div>
        <button
          onClick={resetPairings}
          className="p-2 bg-slate-800 rounded-xl text-slate-400 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Affichages des Appariements déjà validés */}
      {pairings.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Matchs Validés</span>
          <div className="space-y-1.5">
            {pairings.map((p, idx) => {
              const myP = myPlayers.find((m) => m.id === p.myPlayerId);
              const oppP = oppPlayers.find((o) => o.id === p.oppPlayerId);
              return (
                <div key={idx} className="flex items-center justify-between bg-slate-950 p-2 rounded-xl text-xs border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">{myP?.name}</span>
                    <span className="text-slate-500">vs</span>
                    <span className="font-bold text-amber-400">{oppP?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">{p.mapId}</span>
                    <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold">{p.predictedScoreWTC} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase 1 : Recommandation & Choix du Défenseur */}
      {turnState === 'SELECT_DEFENDER' && availableMy.length > 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
            <Shield className="w-4 h-4" /> 1. Recommandation Défenseur à Poser
          </div>

          {defenderRecs.length > 0 && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl space-y-1">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Poser idéalement : {defenderRecs[0].player.name}
              </div>
              <div className="text-[11px] text-slate-300">
                Score Min Garanti : <span className="font-bold text-white font-mono">{defenderRecs[0].expectedMinScore.toFixed(1)} pts</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            {availableMy.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedDefenderId(p.id);
                  setTurnState('SELECT_ATTACKERS');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedDefenderId === p.id
                    ? 'bg-sky-950 border-sky-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="font-bold text-xs">{p.name}</div>
                <div className="text-[10px] text-sky-400">{p.faction}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase 2 : Révélation des 2 Attaquants et Choix Final */}
      {turnState === 'SELECT_ATTACKERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Swords className="w-4 h-4" /> 2. Révéler les 2 Attaquants Adverses
          </div>

          <div className="grid grid-cols-2 gap-2">
            {availableOpp.map((p) => {
              const isSelected = selectedAttackerIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => handleAttackerToggle(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-950 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs truncate">{p.name}</div>
                  <div className="text-[10px] text-amber-400">{p.faction}</div>
                </button>
              );
            })}
          </div>

          {attackerRec && (
            <div className="bg-emerald-950/60 border border-emerald-800 p-3 rounded-xl space-y-2">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Option Optimale Recommandée :
              </div>
              <div className="text-xs text-slate-200">
                Prendre <span className="font-bold text-white">{oppPlayers.find((p) => p.id === attackerRec.recommendedAttackerId)?.name}</span> sur <span className="font-bold text-white">{attackerRec.recommendedMapId}</span>
              </div>
              <button
                onClick={() => confirmPairingStep(attackerRec.recommendedAttackerId, attackerRec.recommendedMapId)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Valider cette Recommandation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Phase Finale : Kuhn-Munkres pour les 2 derniers joueurs */}
      {availableMy.length <= 2 && availableMy.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-3">
          <div className="text-xs font-bold text-sky-400">Fin de Draft : 2 Derniers Joueurs Restants</div>
          <p className="text-[11px] text-slate-400">Exécuter l'Algorithme Hongrois pour maximiser l'affectation finale des tables.</p>
          <button
            onClick={executeHungarianFinalMatch}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            Calculer l'Optimisation Finale Hongroise <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
