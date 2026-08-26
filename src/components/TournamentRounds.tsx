import React, { useState } from 'react';
import { Trophy, CheckCircle, Plus } from 'lucide-react';
import { useMetaStore } from '../store/useMetaStore';
import { RoundSession } from '../types';

export const TournamentRounds: React.FC = () => {
  const { myTeam, opponentTeam, matrices } = useMetaStore();
  const [activeRoundNumber, setActiveRoundNumber] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [rounds, setRounds] = useState<Record<number, RoundSession>>({});

  const startRound = () => {
    if (!myTeam || !opponentTeam) return;
    const newRound: RoundSession = {
      id: `round-${activeRoundNumber}`,
      roundNumber: activeRoundNumber,
      opponentTeamName: opponentTeam.name || `Équipe Ronde ${activeRoundNumber}`,
      myTeam,
      opponentTeam,
      strategy: 'MAX_SCORE',
      initiative: 'WE_DEFEND_FIRST',
      pairings: [],
      status: 'DRAFTING'
    };
    setRounds({ ...rounds, [activeRoundNumber]: newRound });
  };

  const currentRound = rounds[activeRoundNumber];

  return (
    <div className="p-4 space-y-4 pb-24 bg-slate-950 text-slate-100 min-h-screen">
      {/* Selector Rondes 1 a 5 */}
      <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        {([1, 2, 3, 4, 5] as const).map((r) => (
          <button
            key={r}
            onClick={() => setActiveRoundNumber(r)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeRoundNumber === r
                ? 'bg-sky-600 text-white shadow-lg'
                : 'text-slate-400 bg-slate-950 border border-slate-800/80'
            }`}
          >
            Ronde {r}
          </button>
        ))}
      </div>

      {!currentRound ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <Trophy className="w-8 h-8 text-sky-400 mx-auto" />
          <div className="text-sm font-bold">Ronde {activeRoundNumber} non configurée</div>
          <button
            onClick={startRound}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Démarrer la Ronde {activeRoundNumber}
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <div className="text-xs font-bold text-sky-400">Ronde {currentRound.roundNumber}</div>
              <div className="text-xs text-slate-400">vs {currentRound.opponentTeamName}</div>
            </div>
            <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded-full font-semibold">
              {currentRound.status}
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Passez sur l'onglet <span className="text-sky-400 font-bold">Pairing</span> pour piloter l'assistant en direct pour cette ronde.
          </p>
        </div>
      )}
    </div>
  );
};