// src/components/TeamManager.tsx
import React, { useState } from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { Users, UserPlus, Trash2, Shield, Upload, Sparkles, Wand2 } from 'lucide-react';
import { Player } from '../types';

export const TeamManager: React.FC = () => {
  const store = useMetaStore();

  const myTeam = store.myTeam || { name: 'Mon Équipe', players: [] };
  const opponentTeam = store.opponentTeam || { name: 'Équipe Adverse', players: [] };

  const [activeTab, setActiveTab] = useState<'myTeam' | 'opponentTeam'>('myTeam');
  const [importTarget, setImportTarget] = useState<'myTeam' | 'opponentTeam'>('myTeam');
  const [rawText, setRawText] = useState('');
  const [newName, setNewName] = useState('');
  const [newFaction, setNewFaction] = useState('Space Marines');

  const handleAddPlayerManually = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      faction: newFaction.trim(),
      disposition: 'Balanced',
      tablePreferences: {}
    };

    if (activeTab === 'myTeam') {
      store.addMyPlayer(newPlayer);
    } else {
      store.addOpponentPlayer(newPlayer);
    }
    setNewName('');
  };

  const handleDeletePlayer = (playerId: string) => {
    if (activeTab === 'myTeam') {
      store.deleteMyPlayer(playerId);
    } else {
      store.deleteOpponentPlayer(playerId);
    }
  };

  const handleRawImport = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split('\n').filter(l => l.trim() !== '');
    const newPlayers: Player[] = lines.map(line => {
      const parts = line.split(/[-–:]/);
      return {
        id: crypto.randomUUID(),
        name: parts[0]?.trim() || 'Joueur',
        faction: parts[1]?.trim() || 'Space Marines',
        disposition: 'Balanced',
        tablePreferences: {}
      };
    });

    if (importTarget === 'myTeam') {
      const currentPlayers = myTeam.players || [];
      store.setMyTeam({
        ...myTeam,
        players: [...currentPlayers, ...newPlayers],
        size: currentPlayers.length + newPlayers.length
      });
    } else {
      store.setOpponentTeam({
        ...opponentTeam,
        players: newPlayers,
        size: newPlayers.length
      });
    }
    setRawText('');
  };

  // NOUVELLES FONCTIONS DE GÉNÉRATION APPELLANT LE STORE
  const handleGenerateRandomOpponent = () => {
    if (store.generateRandomOpponentTeam) {
      store.generateRandomOpponentTeam();
      setActiveTab('opponentTeam'); // Bascule sur l'onglet adverse pour voir le résultat
    }
  };

  const handleGenerateMetaTeam = () => {
    if (store.generateMetaOptimizedTeam) {
      store.generateMetaOptimizedTeam();
      setActiveTab('myTeam'); // Bascule sur l'onglet Mon Équipe pour voir le résultat
    }
  };

  const currentTeamToDisplay = activeTab === 'myTeam' ? myTeam : opponentTeam;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Users className="w-6 h-6 text-sky-400" />
            Gestionnaire des Rosters
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gérez les équipes pour les phases de pairing.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <button 
            onClick={() => setActiveTab('myTeam')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'myTeam' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Shield className="w-4 h-4 text-sky-300" />
            Mon Équipe ({myTeam.players?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('opponentTeam')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'opponentTeam' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Users className="w-4 h-4 text-rose-300" />
            Équipe Adverse ({opponentTeam.players?.length || 0})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          
          {/* BLOC GÉNÉRATION AUTO */}
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg space-y-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Génération Automatique
            </h3>
            <div className="space-y-2 pt-1">
              <button 
                onClick={handleGenerateRandomOpponent}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow transition flex items-center justify-center gap-2"
              >
                <Wand2 className="w-4 h-4" /> Générer équipe adverse aléatoire
              </button>
              <button 
                onClick={handleGenerateMetaTeam}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Générer Mon Équipe (Meta)
              </button>
            </div>
          </div>

          {/* BLOC IMPORT BRUT */}
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-400" />
              Import Brut de Roster
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setImportTarget('myTeam')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${importTarget === 'myTeam' ? 'bg-sky-600/30 border-sky-500 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
              >
                Mon Équipe
              </button>
              <button
                type="button"
                onClick={() => setImportTarget('opponentTeam')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${importTarget === 'opponentTeam' ? 'bg-rose-600/30 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
              >
                Équipe Adverse
              </button>
            </div>
            <textarea 
              rows={4}
              placeholder="Ex: Jean - Space Marines&#10;Marc - Aeldari"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-3 text-xs outline-none focus:border-sky-500 font-mono"
            />
            <button 
              onClick={handleRawImport}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow transition"
            >
              Importer
            </button>
          </div>

          {/* BLOC AJOUT MANUEL */}
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl shadow-lg space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Ajout Manuel
            </h3>
            <form onSubmit={handleAddPlayerManually} className="space-y-3">
              <input 
                type="text"
                placeholder="Nom du joueur"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs outline-none focus:border-sky-500"
              />
              <input 
                type="text"
                placeholder="Faction"
                value={newFaction}
                onChange={(e) => setNewFaction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2.5 text-xs outline-none focus:border-sky-500"
              />
              <button 
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition"
              >
                Ajouter
              </button>
            </form>
          </div>

        </div>

        {/* LISTE DES JOUEURS */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-lg space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white">
                Roster : <span className={activeTab === 'myTeam' ? 'text-sky-400' : 'text-rose-400'}>{currentTeamToDisplay.name}</span>
              </h3>
            </div>
          </div>

          {!currentTeamToDisplay.players || currentTeamToDisplay.players.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-10 h-10 mx-auto opacity-40 mb-2" />
              <p className="text-sm">Aucun joueur enregistré.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm bg-slate-950 rounded-lg border border-slate-800">
                <thead className="bg-slate-900 text-slate-300 text-xs uppercase">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Nom</th>
                    <th className="p-3">Faction</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {currentTeamToDisplay.players.map((player, index) => (
                    <tr key={player.id || index} className="text-slate-200 hover:bg-slate-900/50 transition">
                      <td className="p-3 text-xs text-slate-500 font-mono">{index + 1}</td>
                      <td className="p-3 font-bold">{player.name}</td>
                      <td className="p-3 text-sky-400">{player.faction}</td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDeletePlayer(player.id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
