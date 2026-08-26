import React, { useState } from 'react';
import { UserPlus, Trash2, Edit2, Upload, FileText, Check, Plus, Shield, Users } from 'lucide-react';
import { useMetaStore } from '../store/useMetaStore';
import { Player, DispositionArchetype, ScoreRating } from '../types';

const FACTIONS = [
  'Space Marines', 'Necrons', 'Aeldari', 'Tyranids', 'Tau Empire', 
  'Chaos Space Marines', 'Orks', 'Adeptus Custodes', 'Imperial Knights', 
  'Chaos Knights', 'Thousand Sons', 'World Eaters', 'Death Guard', 
  'Astra Militarum', 'Adepta Sororitas', 'Grey Knights', 'Drukhari', 
  'Genestealer Cults', 'Adeptus Mechanicus'
];

const DISPOSITIONS: DispositionArchetype[] = [
  'Purge the Foe',
  'Reconnaissance',
  'Take & Hold',
  'Disruption',
  'Priority Asset'
];

const MAPS = ['Map 1', 'Map 2', 'Map 3', 'Map 4', 'Map 5', 'Map 6', 'Map 7', 'Map 8'];

export const RosterManager: React.FC = () => {
  const { 
    myTeam, opponentTeam, setMyTeam, setOpponentTeam,
    addMyPlayer, updateMyPlayer, deleteMyPlayer,
    addOpponentPlayer, updateOpponentPlayer, deleteOpponentPlayer
  } = useMetaStore();

  const [activeTab, setActiveTab] = useState<'MY_TEAM' | 'OPP_TEAM' | 'IMPORT_RAW'>('MY_TEAM');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  // Formulaire d'ajout / édition rapide
  const [formName, setFormName] = useState('');
  const [formFaction, setFormFaction] = useState(FACTIONS[0]);
  const [formDisposition, setFormDisposition] = useState<DispositionArchetype>('Take & Hold');
  const [formTablePrefs, setFormTablePrefs] = useState<Record<string, ScoreRating>>({
    'Map 1': 0, 'Map 2': 0, 'Map 3': 0, 'Map 4': 0, 'Map 5': 0, 'Map 6': 0, 'Map 7': 0, 'Map 8': 0
  });

  // Zone d'import brut
  const [rawText, setRawText] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormFaction(FACTIONS[0]);
    setFormDisposition('Take & Hold');
    setEditingPlayerId(null);
  };

  const handleSavePlayer = (isMyTeam: boolean) => {
    if (!formName.trim()) return;

    if (editingPlayerId) {
      const updateData = {
        name: formName,
        faction: formFaction,
        disposition: formDisposition,
        tablePreferences: formTablePrefs
      };
      if (isMyTeam) updateMyPlayer(editingPlayerId, updateData);
      else updateOpponentPlayer(editingPlayerId, updateData);
    } else {
      const newPlayer: Player = {
        id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: formName,
        faction: formFaction,
        disposition: formDisposition,
        tablePreferences: formTablePrefs
      };
      if (isMyTeam) addMyPlayer(newPlayer);
      else addOpponentPlayer(newPlayer);
    }

    resetForm();
  };

  const startEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setFormName(player.name);
    setFormFaction(player.faction);
    setFormDisposition(player.disposition);
    setFormTablePrefs(player.tablePreferences || {});
  };

  // Parser simple des textes d'armées (WTC format / BCP)
  const handleParseRaw = () => {
    if (!rawText.trim()) return;
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const parsedPlayers: Player[] = lines.slice(0, 8).map((line, idx) => {
      const parts = line.split('-').map((s) => s.trim());
      const name = parts[0] || `Joueur ${idx + 1}`;
      const faction = FACTIONS.find((f) => line.toLowerCase().includes(f.toLowerCase())) || FACTIONS[idx % FACTIONS.length];
      return {
        id: `imported-${Date.now()}-${idx}`,
        name,
        faction,
        disposition: DISPOSITIONS[idx % DISPOSITIONS.length],
        tablePreferences: MAPS.reduce((acc, m) => ({ ...acc, [m]: 0 }), {})
      };
    });

    if (activeTab === 'MY_TEAM') {
      setMyTeam({ ...myTeam, players: parsedPlayers });
    } else {
      setOpponentTeam({ ...opponentTeam, players: parsedPlayers });
    }
    setRawText('');
  };

  const isMyTeamTab = activeTab === 'MY_TEAM';
  const currentTeam = isMyTeamTab ? myTeam : opponentTeam;

  return (
    <div className="p-4 space-y-4 pb-28 bg-slate-950 text-slate-100 min-h-screen">
      {/* Navigation Onglets */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1">
        <button
          onClick={() => { setActiveTab('MY_TEAM'); resetForm(); }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'MY_TEAM' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Mon Équipe ({myTeam.players.length}/8)
        </button>
        <button
          onClick={() => { setActiveTab('OPP_TEAM'); resetForm(); }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'OPP_TEAM' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Équipe Adverse ({opponentTeam.players.length}/8)
        </button>
        <button
          onClick={() => setActiveTab('IMPORT_RAW')}
          className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'IMPORT_RAW' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Import Brut
        </button>
      </div>

      {activeTab !== 'IMPORT_RAW' ? (
        <>
          {/* Nom de l'Équipe */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Nom Équipe:</span>
            <input
              type="text"
              value={currentTeam.name}
              onChange={(e) => {
                if (isMyTeamTab) setMyTeam({ ...myTeam, name: e.target.value });
                else setOpponentTeam({ ...opponentTeam, name: e.target.value });
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white w-full focus:outline-none focus:border-sky-500 font-bold"
            />
          </div>

          {/* Formulaire de Saisie / Édition de Joueur */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                {editingPlayerId ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {editingPlayerId ? 'Modifier le Joueur' : 'Ajouter un Joueur Manuellement'}
              </span>
              {editingPlayerId && (
                <button onClick={resetForm} className="text-[10px] text-slate-400 underline">
                  Annuler la modification
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Nom / Pseudo</label>
                <input
                  type="text"
                  placeholder="Ex: Jean (Capitaine)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Faction</label>
                <select
                  value={formFaction}
                  onChange={(e) => setFormFaction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {FACTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Disposition WTC</label>
                <select
                  value={formDisposition}
                  onChange={(e) => setFormDisposition(e.target.value as DispositionArchetype)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {DISPOSITIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => handleSavePlayer(isMyTeamTab)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                isMyTeamTab ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {editingPlayerId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingPlayerId ? 'Enregistrer les Modifications' : 'Ajouter ce Joueur'}
            </button>
          </div>

          {/* Liste des Joueurs */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Composition ({currentTeam.players.length} / 8 Joueurs)
            </span>

            {currentTeam.players.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 text-center text-xs text-slate-500">
                Aucun joueur renseigné. Utilisez le formulaire ci-dessus ou l'import brut.
              </div>
            ) : (
              <div className="space-y-2">
                {currentTeam.players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{player.name}</span>
                        <span className="text-[10px] bg-slate-800 text-sky-300 px-2 py-0.5 rounded-md font-semibold">
                          {player.faction}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Disposition : <span className="text-amber-400 font-medium">{player.disposition}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(player)}
                        className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => (isMyTeamTab ? deleteMyPlayer(player.id) : deleteOpponentPlayer(player.id))}
                        className="p-2 bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Zone Import Brut par Copier-Coller */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <FileText className="w-4 h-4" /> Import Automatique de Roster (8 Lignes)
          </div>
          <p className="text-[11px] text-slate-400">
            Collez la liste des 8 joueurs (un par ligne, ex: "Nom - Faction"). Le système détectera automatiquement la faction associée.
          </p>
          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Joueur 1 - Space Marines&#10;Joueur 2 - Necrons&#10;Joueur 3 - Aeldari..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleParseRaw}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4" /> Générer le Roster
          </button>
        </div>
      )}
    </div>
  );
};