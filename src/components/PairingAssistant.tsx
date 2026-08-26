// src/components/PairingAssistant.tsx
import React, { useState, useMemo } from 'react';
import { Player, MatchupMatrices } from '../types';
import { Shield, Target, Swords, Trash2, CheckCircle2 } from 'lucide-react';

interface Props {
  myPlayers: Player[];
  oppPlayers: Player[];
  matrices: MatchupMatrices;
  availableMaps?: string[];
}

export const PairingAssistant: React.FC<Props> = ({ myPlayers, oppPlayers, matrices }) => {
  // --- ÉTAT GLOBAL DES MATCHS ---
  const [pairings, setPairings] = useState<Array<{ id: string, myPlayer: Player, oppPlayer: Player }>>([]);

  // --- ÉTAPE : L'ADVERSAIRE POSE UN DÉFENSEUR ---
  const [oppDefId, setOppDefId] = useState<string>('');
  const [myAttackersIds, setMyAttackersIds] = useState<string[]>([]);
  const [chosenMyAttackerId, setChosenMyAttackerId] = useState<string>('');

  // --- ÉTAPE : NOUS POSONS UN DÉFENSEUR ---
  const [myDefId, setMyDefId] = useState<string>('');
  const [oppAttackersIds, setOppAttackersIds] = useState<string[]>([]);
  const [chosenOppAttackerId, setChosenOppAttackerId] = useState<string>('');

  // Filtrer les joueurs déjà placés dans un match
  const pairedMyIds = new Set(pairings.map(p => p.myPlayer.id));
  const pairedOppIds = new Set(pairings.map(p => p.oppPlayer.id));

  const availableMyPlayers = myPlayers.filter(p => !pairedMyIds.has(p.id));
  const availableOppPlayers = oppPlayers.filter(p => !pairedOppIds.has(p.id));

  // Outil de lecture du score
  const getScore = (myFaction: string, oppFaction: string) => {
    return matrices.factionVsFaction[myFaction]?.[oppFaction] ?? 0;
  };

  const getScoreBadgeClass = (val: number) => {
    if (val >= 2) return "bg-emerald-600 text-white border-emerald-500";
    if (val === 1) return "bg-emerald-400 text-slate-900 border-emerald-300";
    if (val === 0) return "bg-slate-300 text-slate-800 border-slate-200";
    if (val === -1) return "bg-rose-300 text-slate-900 border-rose-200";
    return "bg-rose-600 text-white border-rose-500";
  };

  // --- LOGIQUE : Gérer leur Défenseur ---
  const sortedAttackersForOppDef = useMemo(() => {
    if (!oppDefId) return [];
    const oppFaction = oppPlayers.find(p => p.id === oppDefId)?.faction || '';
    return [...availableMyPlayers].sort((a, b) => getScore(b.faction, oppFaction) - getScore(a.faction, oppFaction));
  }, [oppDefId, availableMyPlayers, oppPlayers, matrices]);

  const toggleMyAttacker = (id: string) => {
    setMyAttackersIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length < 2) return [...prev, id];
      return prev;
    });
  };

  const handleValidateLeurDefenseur = () => {
    const myP = myPlayers.find(p => p.id === chosenMyAttackerId);
    const oppP = oppPlayers.find(p => p.id === oppDefId);
    if (myP && oppP) {
      setPairings(prev => [...prev, { id: crypto.randomUUID(), myPlayer: myP, oppPlayer: oppP }]);
      // Reset
      setOppDefId('');
      setMyAttackersIds([]);
      setChosenMyAttackerId('');
    }
  };

  // --- LOGIQUE : Gérer notre Défenseur ---
  const sortedOppAttackersForMyDef = useMemo(() => {
    if (!myDefId) return [];
    const myFaction = myPlayers.find(p => p.id === myDefId)?.faction || '';
    // On trie du meilleur pour NOUS au pire
    return [...availableOppPlayers].sort((a, b) => getScore(myFaction, b.faction) - getScore(myFaction, a.faction));
  }, [myDefId, availableOppPlayers, myPlayers, matrices]);

  const toggleOppAttacker = (id: string) => {
    setOppAttackersIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length < 2) return [...prev, id];
      return prev;
    });
  };

  const handleValidateMonDefenseur = () => {
    const myP = myPlayers.find(p => p.id === myDefId);
    const oppP = oppPlayers.find(p => p.id === chosenOppAttackerId);
    if (myP && oppP) {
      setPairings(prev => [...prev, { id: crypto.randomUUID(), myPlayer: myP, oppPlayer: oppP }]);
      // Reset
      setMyDefId('');
      setOppAttackersIds([]);
      setChosenOppAttackerId('');
    }
  };

  const totalScore = pairings.reduce((acc, curr) => acc + getScore(curr.myPlayer.faction, curr.oppPlayer.faction), 0);

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Swords className="w-6 h-6 text-sky-400" />
            Assistant de Pairing (Séquence WTC)
          </h2>
          <p className="text-sm text-slate-400 mt-1">Joueurs non pairés : <span className="font-bold text-sky-400">{availableMyPlayers.length}</span></p>
        </div>
      </div>

      {/* PANNEAUX DE CONSTRUCTION DE MATCH */}
      {availableMyPlayers.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLONNE 1 : L'Adversaire pose son Défenseur */}
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-white text-lg">1. Ils posent un Défenseur</h3>
            </div>
            
            <select 
              value={oppDefId} 
              onChange={e => { setOppDefId(e.target.value); setMyAttackersIds([]); setChosenMyAttackerId(''); }}
              className="bg-slate-800 border border-slate-600 text-white rounded-lg p-3 outline-none focus:border-sky-500"
            >
              <option value="">-- Sélectionnez le défenseur adverse --</option>
              {availableOppPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.faction})</option>)}
            </select>

            {oppDefId && (
              <div className="flex-1 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4">
                <p className="text-sm font-semibold text-sky-300 uppercase tracking-wide">Meilleurs attaquants recommandés (Cochez-en 2)</p>
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2">
                  {sortedAttackersForOppDef.map(p => {
                    const score = getScore(p.faction, oppPlayers.find(o => o.id === oppDefId)?.faction || '');
                    const isSelected = myAttackersIds.includes(p.id);
                    return (
                      <div key={p.id} onClick={() => toggleMyAttacker(p.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? 'bg-sky-900/50 border-sky-400 shadow-sm' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-100">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.faction}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold border ${getScoreBadgeClass(score)}`}>
                          {score > 0 ? `+${score}` : score}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {myAttackersIds.length === 2 && (
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mt-2 space-y-3 animate-in fade-in">
                <p className="text-sm font-semibold text-slate-200">Lequel ont-ils choisi d'affronter ?</p>
                <div className="flex gap-2">
                  {myAttackersIds.map(id => {
                    const p = myPlayers.find(x => x.id === id)!;
                    return (
                      <button key={id} onClick={() => setChosenMyAttackerId(id)}
                        className={`flex-1 p-3 rounded-lg border text-sm font-bold transition-all ${
                          chosenMyAttackerId === id ? 'bg-emerald-600 border-emerald-400 text-white shadow-md' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {p.name}
                      </button>
                    )
                  })}
                </div>
                
                <button disabled={!chosenMyAttackerId} onClick={handleValidateLeurDefenseur}
                  className="w-full mt-2 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Valider le match
                </button>
              </div>
            )}
          </div>

          {/* COLONNE 2 : Nous posons un Défenseur */}
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white text-lg">2. Nous posons un Défenseur</h3>
            </div>
            
            <select 
              value={myDefId} 
              onChange={e => { setMyDefId(e.target.value); setOppAttackersIds([]); setChosenOppAttackerId(''); }}
              className="bg-slate-800 border border-slate-600 text-white rounded-lg p-3 outline-none focus:border-sky-500"
            >
              <option value="">-- Sélectionnez notre défenseur --</option>
              {availableMyPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.faction})</option>)}
            </select>

            {myDefId && (
              <div className="flex-1 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4">
                <p className="text-sm font-semibold text-rose-300 uppercase tracking-wide">Leurs attaquants (Cochez les 2 ciblés)</p>
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2">
                  {sortedOppAttackersForMyDef.map(p => {
                    const score = getScore(myPlayers.find(o => o.id === myDefId)?.faction || '', p.faction);
                    const isSelected = oppAttackersIds.includes(p.id);
                    return (
                      <div key={p.id} onClick={() => toggleOppAttacker(p.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? 'bg-rose-900/50 border-rose-400 shadow-sm' : 'bg-slate-800/80 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-100">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.faction}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold border ${getScoreBadgeClass(score)}`}>
                          {score > 0 ? `+${score}` : score}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {oppAttackersIds.length === 2 && (
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mt-2 space-y-3 animate-in fade-in">
                <p className="text-sm font-semibold text-slate-200">Lequel choisissez-vous d'affronter ?</p>
                <div className="flex gap-2">
                  {oppAttackersIds.map(id => {
                    const p = oppPlayers.find(x => x.id === id)!;
                    return (
                      <button key={id} onClick={() => setChosenOppAttackerId(id)}
                        className={`flex-1 p-3 rounded-lg border text-sm font-bold transition-all ${
                          chosenOppAttackerId === id ? 'bg-emerald-600 border-emerald-400 text-white shadow-md' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {p.name}
                      </button>
                    )
                  })}
                </div>
                
                <button disabled={!chosenOppAttackerId} onClick={handleValidateMonDefenseur}
                  className="w-full mt-2 py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Valider le match
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* MATCH FINAL AUTOMATIQUE (Derniers joueurs restants) */}
      {availableMyPlayers.length === 1 && availableOppPlayers.length === 1 && (
        <div className="bg-emerald-900/30 border border-emerald-500 p-6 rounded-xl text-center space-y-5 shadow-lg">
          <h3 className="text-xl font-bold text-emerald-400">Dernière Table Restante</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="text-center md:text-right">
              <p className="text-lg font-bold text-white">{availableMyPlayers[0].name}</p>
              <p className="text-sm text-slate-400">{availableMyPlayers[0].faction}</p>
            </div>
            <span className="px-4 py-2 bg-slate-800 rounded-full font-black text-emerald-400 shadow-inner">VS</span>
            <div className="text-center md:text-left">
              <p className="text-lg font-bold text-white">{availableOppPlayers[0].name}</p>
              <p className="text-sm text-slate-400">{availableOppPlayers[0].faction}</p>
            </div>
          </div>
          <button 
            onClick={() => setPairings(prev => [...prev, { id: crypto.randomUUID(), myPlayer: availableMyPlayers[0], oppPlayer: availableOppPlayers[0] }])} 
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md transition-all"
          >
            Générer le dernier match automatiquement
          </button>
        </div>
      )}

      {/* LISTE DES MATCHS VALIDÉS */}
      {pairings.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-500" />
              Matchs Confirmés ({pairings.length})
            </h3>
            <div className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm font-bold text-slate-200">
              Différentiel Estimé : 
              <span className={`ml-2 text-lg ${totalScore > 0 ? 'text-emerald-400' : totalScore < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {totalScore > 0 ? `+${totalScore}` : totalScore}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-left text-sm bg-slate-800">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="p-4 font-semibold w-1/3">Notre Équipe</th>
                  <th className="p-4 font-semibold text-center w-1/6">Score WTC</th>
                  <th className="p-4 font-semibold w-1/3">Équipe Adverse</th>
                  <th className="p-4 text-right w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {pairings.map(match => {
                  const sc = getScore(match.myPlayer.faction, match.oppPlayer.faction);
                  return (
                    <tr key={match.id} className="text-slate-200 hover:bg-slate-800/80 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-[15px]">{match.myPlayer.name}</p>
                        <p className="text-xs text-sky-400">{match.myPlayer.faction}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1.5 rounded-md text-xs font-black border shadow-sm ${getScoreBadgeClass(sc)}`}>
                          {sc > 0 ? `+${sc}` : sc}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-[15px]">{match.oppPlayer.name}</p>
                        <p className="text-xs text-rose-400">{match.oppPlayer.faction}</p>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setPairings(prev => prev.filter(p => p.id !== match.id))} 
                          className="p-2.5 text-rose-400 bg-rose-400/10 hover:bg-rose-500 hover:text-white rounded-lg transition-all" 
                          title="Annuler ce match"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
