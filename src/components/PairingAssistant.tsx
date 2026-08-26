// src/components/PairingAssistant.tsx
import React, { useState, useMemo } from 'react';
import { useMetaStore, RoundPairing } from '../store/useMetaStore';
import { Shield, Target, Swords, Trash2, CheckCircle2, Play } from 'lucide-react';

export const PairingAssistant: React.FC = () => {
  const store = useMetaStore();
  
  // Sécurisation stricte des données du store
  const myTeam = store?.myTeam || { name: 'Mon Équipe', players: [] };
  const oppTeam = store?.opponentTeam || { name: 'Équipe Adverse', players: [] };
  const matrices = store?.matrices || { factionVsFaction: {} };
  const rounds = store?.rounds || [];
  const activeRoundId = store?.activeRoundId || null;

  const myPlayers = myTeam.players || [];
  const oppPlayers = oppTeam.players || [];

  const activeRound = rounds.find(r => r.id === activeRoundId);

  // --- ÉTAT LOCAL DE LA SESSION DE PAIRING EN COURS ---
  const [currentPairings, setCurrentPairings] = useState<RoundPairing[]>([]);

  // Étape défenseur adverse
  const [oppDefId, setOppDefId] = useState<string>('');
  const [myAttackersIds, setMyAttackersIds] = useState<string[]>([]);
  const [chosenMyAttackerId, setChosenMyAttackerId] = useState<string>('');

  // Étape notre défenseur
  const [myDefId, setMyDefId] = useState<string>('');
  const [oppAttackersIds, setOppAttackersIds] = useState<string[]>([]);
  const [chosenOppAttackerId, setChosenOppAttackerId] = useState<string>('');

  // Joueurs déjà placés dans les pairings en cours
  const pairedMyIds = new Set(currentPairings.map(p => p.myPlayer?.id).filter(Boolean));
  const pairedOppIds = new Set(currentPairings.map(p => p.oppPlayer?.id).filter(Boolean));

  const availableMyPlayers = myPlayers.filter(p => p && !pairedMyIds.has(p.id));
  const availableOppPlayers = oppPlayers.filter(p => p && !pairedOppIds.has(p.id));

  const getScore = (myFaction: string, oppFaction: string) => {
    if (!matrices?.factionVsFaction) return 0;
    return matrices.factionVsFaction[myFaction]?.[oppFaction] ?? 0;
  };

  const getScoreBadgeClass = (val: number) => {
    if (val >= 2) return "bg-emerald-600 text-white border-emerald-500";
    if (val === 1) return "bg-emerald-400 text-slate-900 border-emerald-300";
    if (val === 0) return "bg-slate-300 text-slate-800 border-slate-200";
    if (val === -1) return "bg-rose-300 text-slate-900 border-rose-200";
    return "bg-rose-600 text-white border-rose-500";
  };

  // Recommandation attaquants face à leur défenseur
  const sortedAttackersForOppDef = useMemo(() => {
    if (!oppDefId) return [];
    const oppDefPlayer = oppPlayers.find(p => p.id === oppDefId);
    const oppFaction = oppDefPlayer?.faction || '';
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
    if (myP && oppP && activeRoundId) {
      const newPairings = [...currentPairings, { id: crypto.randomUUID(), myPlayer: myP, oppPlayer: oppP, score: getScore(myP.faction, oppP.faction) }];
      setCurrentPairings(newPairings);
      store.saveRoundPairings(activeRoundId, newPairings);
      setOppDefId('');
      setMyAttackersIds([]);
      setChosenMyAttackerId('');
    }
  };

  // Recommandation attaquants face à notre défenseur
  const sortedOppAttackersForMyDef = useMemo(() => {
    if (!myDefId) return [];
    const myDefPlayer = myPlayers.find(p => p.id === myDefId);
    const myFaction = myDefPlayer?.faction || '';
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
    if (myP && oppP && activeRoundId) {
      const newPairings = [...currentPairings, { id: crypto.randomUUID(), myPlayer: myP, oppPlayer: oppP, score: getScore(myP.faction, oppP.faction) }];
      setCurrentPairings(newPairings);
      store.saveRoundPairings(activeRoundId, newPairings);
      setMyDefId('');
      setOppAttackersIds([]);
      setChosenOppAttackerId('');
    }
  };

  const totalScore = currentPairings.reduce((acc, curr) => acc + (curr.score || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER & GESTION DES RONDES */}
      <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Swords className="w-6 h-6 text-sky-400" />
            Gestionnaire de Tournoi & Pairings WTC
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Rondes enregistrées : <span className="text-sky-400 font-bold">{rounds.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!activeRoundId ? (
            <button 
              onClick={() => { store.startNewRound(); setCurrentPairings([]); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg transition-all"
            >
              <Play className="w-4 h-4" />
              Lancer une Nouvelle Ronde
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-500 px-4 py-2 rounded-lg text-emerald-400 font-bold">
              <span>{activeRound?.name} en cours...</span>
            </div>
          )}
        </div>
      </div>

      {/* HISTORIQUE DES RONDES PASSÉES */}
      <div className="space-y-4">
        {rounds.map(round => (
          <div key={round.id} className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-md space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">{round.name}</h3>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${round.isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                  {round.isCompleted ? 'Terminée & Sauvegardée' : 'En cours de pairing'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeRoundId !== round.id && !round.isCompleted && (
                  <button onClick={() => { useMetaStore.setState({ activeRoundId: round.id }); setCurrentPairings(round.pairings || []); }} className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition">
                    Reprendre
                  </button>
                )}
                {activeRoundId === round.id && (
                  <button onClick={() => { store.completeRound(round.id); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">
                    Clôturer la ronde
                  </button>
                )}
                <button onClick={() => store.deleteRound(round.id)} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition" title="Supprimer la ronde">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Liste des matchs de cette ronde */}
            {round.pairings && round.pairings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm bg-slate-800 rounded-lg border border-slate-700">
                  <thead className="bg-slate-950 text-slate-300">
                    <tr>
                      <th className="p-3">Notre Joueur</th>
                      <th className="p-3 text-center">Score WTC</th>
                      <th className="p-3">Joueur Adverse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {round.pairings.map(m => (
                      <tr key={m.id} className="text-slate-200">
                        <td className="p-3 font-bold">{m.myPlayer?.name || 'Inconnu'} <span className="text-sky-400 text-xs font-normal">({m.myPlayer?.faction || ''})</span></td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getScoreBadgeClass(m.score)}`}>
                            {m.score > 0 ? `+${m.score}` : m.score}
                          </span>
                        </td>
                        <td className="p-3 font-bold">{m.oppPlayer?.name || 'Inconnu'} <span className="text-rose-400 text-xs font-normal">({m.oppPlayer?.faction || ''})</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Aucun match enregistré pour le moment dans cette ronde.</p>
            )}
          </div>
        ))}
      </div>

      {/* INTERFACE ACTIVE DE PAIRING (Si une ronde est ouverte) */}
      {activeRoundId && availableMyPlayers.length > 0 && (
        <div className="bg-slate-900 border border-sky-500/50 p-6 rounded-xl shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-sky-400 flex items-center gap-2">
              <Target className="w-6 h-6" />
              Phase de Draft en cours ({activeRound?.name}) - Restants : {availableMyPlayers.length}
            </h3>
            <span className="text-sm font-bold text-slate-300">Différentiel actuel : <span className={totalScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{totalScore > 0 ? `+${totalScore}` : totalScore}</span></span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Ils posent un défenseur */}
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex flex-col gap-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-500" /> 1. Ils posent un Défenseur
              </h4>
              <select 
                value={oppDefId} 
                onChange={e => { setOppDefId(e.target.value); setMyAttackersIds([]); setChosenMyAttackerId(''); }}
                className="bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-sky-500 text-sm"
              >
                <option value="">-- Choisir le défenseur adverse --</option>
                {availableOppPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.faction})</option>)}
              </select>

              {oppDefId && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-sky-300 uppercase">Top 2 attaquants recommandés</p>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {sortedAttackersForOppDef.map(p => {
                      const oppDefPlayer = oppPlayers.find(o => o.id === oppDefId);
                      const score = getScore(p.faction, oppDefPlayer?.faction || '');
                      const isSelected = myAttackersIds.includes(p.id);
                      return (
                        <div key={p.id} onClick={() => toggleMyAttacker(p.id)}
                          className={`flex items-center justify-between p-2.5 rounded border cursor-pointer text-sm ${isSelected ? 'bg-sky-900/40 border-sky-400' : 'bg-slate-900 border-slate-700'}`}
                        >
                          <div><p className="font-bold text-slate-100">{p.name}</p><span className="text-xs text-slate-400">{p.faction}</span></div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getScoreBadgeClass(score)}`}>{score > 0 ? `+${score}` : score}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {myAttackersIds.length === 2 && (
                <div className="space-y-2 pt-2 border-t border-slate-700">
                  <p className="text-xs font-semibold text-slate-300">Lequel ont-ils choisi d'affronter ?</p>
                  <div className="flex gap-2">
                    {myAttackersIds.map(id => {
                      const p = myPlayers.find(x => x.id === id);
                      if (!p) return null;
                      return (
                        <button key={id} onClick={() => setChosenMyAttackerId(id)}
                          className={`flex-1 p-2 rounded border text-xs font-bold transition ${chosenMyAttackerId === id ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-900 border-slate-600 text-slate-300'}`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                  <button disabled={!chosenMyAttackerId} onClick={handleValidateLeurDefenseur}
                    className="w-full py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold rounded text-xs flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Valider le Match
                  </button>
                </div>
              )}
            </div>

            {/* 2. Nous posons un défenseur */}
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex flex-col gap-3">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" /> 2. Nous posons un Défenseur
              </h4>
              <select 
                value={myDefId} 
                onChange={e => { setMyDefId(e.target.value); setOppAttackersIds([]); setChosenOppAttackerId(''); }}
                className="bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-sky-500 text-sm"
              >
                <option value="">-- Choisir notre défenseur --</option>
                {availableMyPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.faction})</option>)}
              </select>

              {myDefId && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-rose-300 uppercase">Leurs attaquants ciblés (Cochez 2)</p>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {sortedOppAttackersForMyDef.map(p => {
                      const myDefPlayer = myPlayers.find(o => o.id === myDefId);
                      const score = getScore(myDefPlayer?.faction || '', p.faction);
                      const isSelected = oppAttackersIds.includes(p.id);
                      return (
                        <div key={p.id} onClick={() => toggleOppAttacker(p.id)}
                          className={`flex items-center justify-between p-2.5 rounded border cursor-pointer text-sm ${isSelected ? 'bg-rose-900/40 border-rose-400' : 'bg-slate-900 border-slate-700'}`}
                        >
                          <div><p className="font-bold text-slate-100">{p.name}</p><span className="text-xs text-slate-400">{p.faction}</span></div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getScoreBadgeClass(score)}`}>{score > 0 ? `+${score}` : score}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {oppAttackersIds.length === 2 && (
                <div className="space-y-2 pt-2 border-t border-slate-700">
                  <p className="text-xs font-semibold text-slate-300">Lequel choisissez-vous d'affronter ?</p>
                  <div className="flex gap-2">
                    {oppAttackersIds.map(id => {
                      const p = oppPlayers.find(x => x.id === id);
                      if (!p) return null;
                      return (
                        <button key={id} onClick={() => setChosenOppAttackerId(id)}
                          className={`flex-1 p-2 rounded border text-xs font-bold transition ${chosenOppAttackerId === id ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-900 border-slate-600 text-slate-300'}`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                  <button disabled={!chosenOppAttackerId} onClick={handleValidateMonDefenseur}
                    className="w-full py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold rounded text-xs flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Valider le Match
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
