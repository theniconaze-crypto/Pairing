// src/components/PairingAssistant.tsx
import React, { useState, useMemo } from 'react';
import { useMetaStore, RoundPairing } from '../store/useMetaStore';
import { Shield, Target, Swords, Trash2, CheckCircle2, Play, Calendar, Layers, Users } from 'lucide-react';

export const PairingAssistant: React.FC = () => {
  const store = useMetaStore();
  
  const myTeam = store?.myTeam || { name: 'Mon Équipe', players: [] };
  const matrices = store?.matrices || { factionVsFaction: {} };
  const rounds = store?.rounds || [];
  const activeRoundId = store?.activeRoundId || null;
  const tournamentOpponents = store?.tournamentOpponents || [];

  const myPlayers = myTeam.players || [];

  // Récupérer la ronde active et son équipe adverse assignée s'il y en a une
  const activeRound = rounds.find(r => r.id === activeRoundId);
  const activeAssignedOppTeam = tournamentOpponents.find(t => t.id === activeRound?.assignedOpponentTeamId);
  
  // Si une équipe est assignée à la ronde active, on l'utilise, sinon on prend l'équipe adverse générale du store
  const activeOppTeam = activeAssignedOppTeam || store?.opponentTeam || { name: 'Équipe Adverse', players: [] };
  const oppPlayers = activeOppTeam.players || [];

  // --- NAVIGATION INTERNE ENTRE L'ASSISTANT ET L'ONGLET RONDES ---
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

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
    return [...availableOppPlayers].sort((a, b) => getScore(myFaction, b.faction) - getScore(myFaction, b.faction));
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
      
      {/* HEADER & SOUS-ONGLETS DE NAVIGATION */}
      <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Swords className="w-6 h-6 text-sky-400" />
            Gestionnaire de Tournoi WTC
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gérez vos phases de draft et consultez l'historique des rondes par équipe adverse.
          </p>
        </div>

        {/* Boutons d'onglets internes */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'active' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Target className="w-4 h-4" />
            Draft en cours
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'history' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-4 h-4" />
            Onglet Rondes ({rounds.length})
          </button>
        </div>
      </div>

      {/* CONTENU : ONGLET DRAFT ACTIVE */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {!activeRoundId ? (
            <div className="bg-slate-900 border border-slate-700 p-12 rounded-xl text-center space-y-4">
              <Calendar className="w-12 h-12 text-sky-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Aucune ronde active pour le moment</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Lancez une nouvelle ronde de tournoi pour commencer la phase de pairing WTC et enregistrer automatiquement les résultats.
              </p>
              <button 
                onClick={() => { 
                  store.startNewRound(); 
                  setCurrentPairings([]); 
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg transition-all"
              >
                <Play className="w-5 h-5" />
                Lancer une Nouvelle Ronde
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-sky-500/50 p-6 rounded-xl shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-sky-400 flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    {activeRound?.name}
                  </h3>
                  <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-full">
                    En cours
                  </span>
                  {activeAssignedOppTeam && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 px-3 py-1 rounded-lg">
                      <Users className="w-3.5 h-3.5" /> Adversaire : {activeAssignedOppTeam.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-300">
                    Différentiel WTC : <span className={totalScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{totalScore > 0 ? `+${totalScore}` : totalScore}</span>
                  </span>
                  <button 
                    onClick={() => { store.completeRound(activeRoundId); setActiveTab('history'); }} 
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                  >
                    Clôturer la ronde
                  </button>
                </div>
              </div>

              {/* Si aucun joueur adverse n'est chargé */}
              {oppPlayers.length === 0 ? (
                <div className="p-8 text-center space-y-4 bg-slate-950/50 rounded-xl border border-rose-500/30">
                  <Users className="w-12 h-12 text-rose-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">Aucune équipe adverse assignée ou roster vide !</h4>
                  <p className="text-sm text-slate-400">Veuillez assigner une équipe adverse à cette ronde dans l'onglet "Rondes" pour lancer les pairings.</p>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-sm transition"
                  >
                    Aller assigner une équipe
                  </button>
                </div>
              ) : availableMyPlayers.length === 0 ? (
                <div className="p-8 text-center space-y-4 bg-slate-950/50 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">Tous les matchs de cette ronde ont été complétés !</h4>
                  <p className="text-sm text-slate-400">Vous pouvez consulter et vérifier les résultats dans l'onglet des rondes.</p>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-sm transition"
                  >
                    Voir l'onglet Rondes
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTENU : ONGLET RONDES & HISTORIQUE */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900 border border-slate-700 p-4 rounded-xl">
            <div>
              <h3 className="text-lg font-bold text-white">Historique & Assignation des Rondes</h3>
              <p className="text-xs text-slate-400">Assignez une équipe adverse à chaque ronde et consultez les résultats.</p>
            </div>
            <button 
              onClick={() => { 
                store.startNewRound(); 
                setCurrentPairings([]); 
                setActiveTab('active');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
            >
              <Play className="w-3.5 h-3.5" />
              Lancer une Nouvelle Ronde
            </button>
          </div>

          {rounds.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700 p-12 rounded-xl text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-400">Aucune ronde enregistrée pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rounds.map(round => {
                const roundTotalScore = (round.pairings || []).reduce((acc, curr) => acc + (curr.score || 0), 0);
                const assignedOpp = tournamentOpponents.find(t => t.id === round.assignedOpponentTeamId);

                return (
                  <div key={round.id} className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-md space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-3 gap-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{round.name}</h3>
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${round.isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                          {round.isCompleted ? 'Terminée & Sauvegardée' : 'En cours de draft'}
                        </span>
                        {round.pairings && round.pairings.length > 0 && (
                          <span className="text-xs font-semibold text-slate-300">
                            Score : <span className={roundTotalScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{roundTotalScore > 0 ? `+${roundTotalScore}` : roundTotalScore}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {activeRoundId !== round.id && !round.isCompleted && (
                          <button onClick={() => { useMetaStore.setState({ activeRoundId: round.id }); setCurrentPairings(round.pairings || []); setActiveTab('active'); }} className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition">
                            Reprendre
                          </button>
                        )}
                        {activeRoundId === round.id && !round.isCompleted && (
                          <button onClick={() => store.completeRound(round.id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">
                            Clôturer
                          </button>
                        )}
                        <button onClick={() => store.deleteRound(round.id)} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition" title="Supprimer la ronde">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sélecteur d'équipe adverse pour cette ronde */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                        <Users className="w-4 h-4 text-rose-400" /> Équipe adverse de cette ronde :
                      </span>
                      <select
                        value={round.assignedOpponentTeamId || ''}
                        onChange={(e) => store.assignOpponentToRound(round.id, e.target.value)}
                        className="w-full sm:w-auto flex-1 bg-slate-900 border border-slate-600 text-white rounded p-2 text-xs outline-none focus:border-sky-500"
                      >
                        <option value="">-- Choisir parmi vos équipes adverses enregistrées --</option>
                        {tournamentOpponents.map(oppTeam => (
                          <option key={oppTeam.id} value={oppTeam.id}>{oppTeam.name} ({oppTeam.players.length} joueurs)</option>
                        ))}
                      </select>
                      {assignedOpp && (
                        <span className="text-xs text-sky-400 font-semibold">{assignedOpp.players.length} joueurs chargés</span>
                      )}
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
                      <p className="text-sm text-slate-400 italic">Aucun match enregistré pour l'instant dans cette ronde.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
