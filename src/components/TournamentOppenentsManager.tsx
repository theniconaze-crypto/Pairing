// src/components/TournamentOpponentsManager.tsx
import React, { useState } from 'react';
import { useMetaStore } from '../store/useMetaStore';
import { Shield, Plus, Trash2, Edit3, Users } from 'lucide-react';
import { Team } from '../types';

export const TournamentOpponentsManager: React.FC = () => {
  const store = useMetaStore();
  const opponents = store.tournamentOpponents || [];

  const [teamName, setTeamName] = useState('');
  const [rawRoster, setRawRoster] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSaveTeam = () => {
    if (!teamName.trim()) return;

    const lines = rawRoster.split('\n').filter(l => l.trim() !== '');
    const players = lines.map(line => {
      const parts = line.split(/[-–:]/);
      return {
        id: crypto.randomUUID(),
        name: parts[0]?.trim() || 'Joueur Adverse',
        faction: parts[1]?.trim() || 'Space Marines',
        disposition: 'Balanced',
        tablePreferences: {}
      };
    });

    const newTeam: Team = {
      id: editingId || crypto.randomUUID(),
      name: teamName,
      size: players.length || 8,
      players
    };

    if (editingId) {
      store.updateTournamentOpponent(newTeam);
      setEditingId(null);
    } else {
      store.addTournamentOpponent(newTeam);
    }

    setTeamName('');
    setRawRoster('');
  };

  const handleEdit = (team: Team) => {
    setEditingId(team.id);
    setTeamName(team.name);
    setRawRoster(team.players.map(p => `${p.name} - ${p.faction}`).join('\n'));
  };

  return (
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-lg space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Users className="w-6 h-6 text-sky-400" />
        <div>
          <h3 className="text-lg font-bold text-white">Gestion des 5 Équipes Adverses du Tournoi</h3>
          <p className="text-xs text-slate-400">Enregistrez vos adversaires pour les assigner ensuite ronde par ronde.</p>
        </div>
      </div>

      {/* Formulaire d'ajout / modification */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-4">
        <h4 className="text-sm font-bold text-sky-300">{editingId ? "Modifier l'équipe adverse" : "Ajouter une équipe adverse"}</h4>
        
        <input 
          type="text"
          placeholder="Nom de l'équipe adverse (ex: Team France, Les Orks du 93...)"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-sky-500"
        />

        <textarea 
          rows={4}
          placeholder="Coller le roster brut (1 ligne par joueur : Nom - Faction)"
          value={rawRoster}
          onChange={(e) => setRawRoster(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-sky-500 font-mono text-xs"
        />

        <div className="flex justify-end gap-2">
          {editingId && (
            <button 
              onClick={() => { setEditingId(null); setTeamName(''); setRawRoster(''); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition"
            >
              Annuler
            </button>
          )}
          <button 
            onClick={handleSaveTeam}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition"
          >
            <Plus className="w-4 h-4" />
            {editingId ? "Mettre à jour l'équipe" : "Enregistrer l'équipe"}
          </button>
        </div>
      </div>

      {/* Liste des équipes enregistrées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opponents.map((team, idx) => (
          <div key={team.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-start">
                <h5 className="font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-400" />
                  Ronde {idx + 1} / Équipe : {team.name}
                </h5>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(team)} className="p-1.5 text-sky-400 hover:bg-sky-500/10 rounded transition" title="Modifier">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => store.deleteTournamentOpponent(team.id)} className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">{team.players.length} joueurs enregistrés</p>
            </div>

            <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-900/60 p-2 rounded border border-slate-700/50">
              {team.players.map(p => (
                <div key={p.id} className="text-xs text-slate-300 flex justify-between">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-sky-400">{p.faction}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
