import React, { useState } from 'react';
import { Player, MatchupMatrices } from '../types';
import { calculateMatchupScore } from '../engine/pairingEngine';

interface ZoomableMatrixProps {
  myPlayers: Player[];
  oppPlayers: Player[];
  matrices: MatchupMatrices;
}

export const ZoomableMatrix: React.FC<ZoomableMatrixProps> = ({ myPlayers, oppPlayers, matrices }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedMap, setSelectedMap] = useState<string>('Map 1');

  const getWtcColor = (scoreWTC: number) => {
    if (scoreWTC >= 15) return 'bg-emerald-600 text-white font-bold';
    if (scoreWTC >= 12) return 'bg-emerald-950 text-emerald-300 font-medium';
    if (scoreWTC >= 9) return 'bg-slate-800 text-slate-300';
    if (scoreWTC >= 6) return 'bg-amber-950 text-amber-300 font-medium';
    return 'bg-rose-950 text-rose-300 font-bold';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800">
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-400">Matrice Global Match-ups</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
            className="w-8 h-8 rounded-lg bg-slate-800 text-lg flex items-center justify-center active:bg-slate-700"
          >
            -
          </button>
          <span className="text-xs w-10 text-center font-mono">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
            className="w-8 h-8 rounded-lg bg-slate-800 text-lg flex items-center justify-center active:bg-slate-700"
          >
            +
          </button>
        </div>
      </div>

      <div className="overflow-auto touch-pan-x touch-pan-y flex-1 p-2">
        <div 
          className="transition-transform origin-top-left"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-2 border border-slate-800 bg-slate-900 sticky top-0 left-0 z-20 min-w-[100px]">
                  Mon Équipe \ Adv
                </th>
                {oppPlayers.map((opp) => (
                  <th key={opp.id} className="p-2 border border-slate-800 bg-slate-900 sticky top-0 z-10 min-w-[75px] text-center">
                    <div className="font-semibold truncate max-w-[70px]">{opp.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{opp.faction}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myPlayers.map((myP) => (
                <tr key={myP.id}>
                  <td className="p-2 border border-slate-800 bg-slate-900 sticky left-0 z-10 font-medium">
                    <div className="truncate max-w-[90px]">{myP.name}</div>
                    <div className="text-[10px] text-sky-400 truncate">{myP.faction}</div>
                  </td>
                  {oppPlayers.map((oppP) => {
                    const { scoreWTC, scoreBrut } = calculateMatchupScore(myP, oppP, selectedMap, matrices);
                    return (
                      <td key={oppP.id} className={`p-2 border border-slate-800 text-center ${getWtcColor(scoreWTC)}`}>
                        <div className="text-sm">{scoreWTC}</div>
                        <div className="text-[9px] opacity-75">{scoreBrut > 0 ? `+${scoreBrut.toFixed(1)}` : scoreBrut.toFixed(1)}</div>
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