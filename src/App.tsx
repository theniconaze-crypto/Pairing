import React, { useEffect, useState } from 'react';
import { 
  Swords, 
  Grid, 
  Users, 
  FileCode, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';
import { useMetaStore } from './store/useMetaStore';
import { PairingAssistant } from './components/PairingAssistant';
import { ZoomableMatrix } from './components/ZoomableMatrix';
import { ListParser } from './components/ListParser';
import { Player, Team, DispositionArchetype } from './types';

// Données de démonstration initiales si l'équipe est vide
const initialMyTeam: Team = {
  id: 'my-team-1',
  name: 'Équipe de France WTC',
  size: 8,
  players: [
    { id: 'p1', name: 'Alexandre', faction: 'Space Marines', disposition: 'Take & Hold', tablePreferences: { 'Map 1': 0.5, 'Map 2': 0, 'Map 3': 1 } },
    { id: 'p2', name: 'Thomas', faction: 'Aeldari', disposition: 'Reconnaissance', tablePreferences: { 'Map 1': 1, 'Map 2': 0.5, 'Map 3': -0.5 } },
    { id: 'p3', name: 'Julien', faction: 'Necrons', disposition: 'Purge the Foe', tablePreferences: { 'Map 1': -0.5, 'Map 2': 1, 'Map 3': 0 } },
    { id: 'p4', name: 'Maxime', faction: 'Tyranids', disposition: 'Disruption', tablePreferences: { 'Map 1': 0, 'Map 2': -1, 'Map 3': 0.5 } },
    { id: 'p5', name: 'Nicolas', faction: 'Space Marines', disposition: 'Priority Asset', tablePreferences: { 'Map 1': 0, 'Map 2': 0.5, 'Map 3': 0 } },
    { id: 'p6', name: 'Romain', faction: 'Aeldari', disposition: 'Take & Hold', tablePreferences: { 'Map 1': 0.5, 'Map 2': 0, 'Map 3': 0.5 } },
    { id: 'p7', name: 'Antoine', faction: 'Necrons', disposition: 'Reconnaissance', tablePreferences: { 'Map 1': -1, 'Map 2': 0, 'Map 3': 1 } },
    { id: 'p8', name: 'Sébastien', faction: 'Tyranids', disposition: 'Purge the Foe', tablePreferences: { 'Map 1': 0, 'Map 2': 0.5, 'Map 3': 0 } },
  ]
};

const initialOpponentTeam: Team = {
  id: 'opp-team-1',
  name: 'Équipe Adverse (Exemple)',
  size: 8,
  players: [
    { id: 'op1', name: 'Opponent 1', faction: 'Necrons', disposition: 'Purge the Foe', tablePreferences: {} },
    { id: 'op2', name: 'Opponent 2', faction: 'Space Marines', disposition: 'Take & Hold', tablePreferences: {} },
    { id: 'op3', name: 'Opponent 3', faction: 'Tyranids', disposition: 'Disruption', tablePreferences: {} },
    { id: 'op4', name: 'Opponent 4', faction: 'Aeldari', disposition: 'Reconnaissance', tablePreferences: {} },
    { id: 'op5', name: 'Opponent 5', faction: 'Space Marines', disposition: 'Priority Asset', tablePreferences: {} },
    { id: 'op6', name: 'Opponent 6', faction: 'Necrons', disposition: 'Take & Hold', tablePreferences: {} },
    { id: 'op7', name: 'Opponent 7', faction: 'Aeldari', disposition: 'Purge the Foe', tablePreferences: {} },
    { id: 'op8', name: 'Opponent 8', faction: 'Tyranids', disposition: 'Reconnaissance', tablePreferences: {} },
  ]
};

export const App: React.FC = () => {
  const { 
    myTeam, 
    opponentTeam, 
    matrices, 
    loadInitialData, 
    setMyTeam, 
    setOpponentTeam 
  } = useMetaStore();

  const [activeTab, setActiveTab] = useState<'pairing' | 'matrix' | 'teams' | 'import'>('pairing');
  const [availableMaps] = useState<string[]>(['Map 1', 'Map 2', 'Map 3', 'Map 4', 'Map 5', 'Map 6', 'Map 7', 'Map 8']);
  const [targetTeam, setTargetTeam] = useState<'MY' | 'OPPONENT'>('MY');

  useEffect(() => {
    loadInitialData().then(() => {
      if (!myTeam) setMyTeam(initialMyTeam);
      if (!opponentTeam) setOpponentTeam(initialOpponentTeam);
    });
  }, []);

  const handleParsedPlayer = (info: { name: string; faction: string; disposition: DispositionArchetype; rawList: string }) => {
    const currentTeam = targetTeam === 'MY' ? (myTeam || initialMyTeam) : (opponentTeam || initialOpponentTeam);
    
    const newPlayer: Player = {
      id: `parsed-${Date.now()}`,
      name: info.name,
      faction: info.faction,
      disposition: info.disposition,
      rawList: info.rawList,
      tablePreferences: {}
    };

    const updatedPlayers = [...currentTeam.players, newPlayer].slice(0, currentTeam.size);
    const updatedTeam = { ...currentTeam, players: updatedPlayers };

    if (targetTeam === 'MY') {
      setMyTeam(updatedTeam);
    } else {
      setOpponentTeam(updatedTeam);
    }

    setActiveTab('teams');
  };

  const removePlayer = (teamType: 'MY' | 'OPPONENT', playerId: string) => {
    if (teamType === 'MY' && myTeam) {
      setMyTeam({
        ...myTeam,
        players: myTeam.players.filter((p) => p.id !== playerId)
      });
    } else if (teamType === 'OPPONENT' && opponentTeam) {
      setOpponentTeam({
        ...opponentTeam,
        players: opponentTeam.players.filter((p) => p.id !== playerId)
      });
    }
  };

  const currentMyTeam = myTeam || initialMyTeam;
  const currentOpponentTeam = opponentTeam || initialOpponentTeam;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Header mobile avec statut Offline & Titre */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-400" />
          <h1 className="text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            WTC 40k Tactical Assistant
          </h1>
        </div>
        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono font-medium">
          Offline Ready
        </span>
      </header>

      {/* Vue Contenu Principal */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'pairing' && (
          <PairingAssistant
            myPlayers={currentMyTeam.players}
            oppPlayers={currentOpponentTeam.players}
            availableMaps={availableMaps}
            matrices={matrices}
          />
        )}

        {activeTab === 'matrix' && (
          <div className="h-[calc(100vh-130px)] p-2">
            <ZoomableMatrix
              myPlayers={currentMyTeam.players}
              oppPlayers={currentOpponentTeam.players}
              matrices={matrices}
            />
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="p-4 space-y-6 pb-24">
            {/* Mon Équipe */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                  <Users className="w-4 h-4" /> Mon Équipe ({currentMyTeam.players.length}/{currentMyTeam.size})
                </div>
                <button
                  onClick={() => {
                    setTargetTeam('MY');
                    setActiveTab('import');
                  }}
                  className="flex items-center gap-1 text-xs bg-sky-950 text-sky-300 border border-sky-800 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Importer
                </button>
              </div>

              <div className="divide-y divide-slate-800/60">
                {currentMyTeam.players.map((player) => (
                  <div key={player.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-slate-200">{player.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span className="text-sky-400">{player.faction}</span>
                        <span>•</span>
                        <span>{player.disposition}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removePlayer('MY', player.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Équipe Adverse */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Users className="w-4 h-4" /> Équipe Adverse ({currentOpponentTeam.players.length}/{currentOpponentTeam.size})
                </div>
                <button
                  onClick={() => {
                    setTargetTeam('OPPONENT');
                    setActiveTab('import');
                  }}
                  className="flex items-center gap-1 text-xs bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Importer
                </button>
              </div>

              <div className="divide-y divide-slate-800/60">
                {currentOpponentTeam.players.map((player) => (
                  <div key={player.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-slate-200">{player.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span className="text-amber-400">{player.faction}</span>
                        <span>•</span>
                        <span>{player.disposition}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removePlayer('OPPONENT', player.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="p-4 space-y-4 pb-24">
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span>Cible d'importation :</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setTargetTeam('MY')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    targetTeam === 'MY' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Mon Équipe
                </button>
                <button
                  onClick={() => setTargetTeam('OPPONENT')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    targetTeam === 'OPPONENT' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Adversaire
                </button>
              </div>
            </div>

            <ListParser onParsed={handleParsedPlayer} />
          </div>
        )}
      </main>

      {/* Navigation Fixe en bas de l'écran (Navigation au pouce optimisée iPhone) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-around pb-6">
        <button
          onClick={() => setActiveTab('pairing')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'pairing' ? 'text-sky-400 scale-105' : 'text-slate-500'
          }`}
        >
          <Swords className="w-5 h-5" />
          <span className="text-[10px] font-medium">Pairing</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'matrix' ? 'text-sky-400 scale-105' : 'text-slate-500'
          }`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-medium">Matrice</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'teams' ? 'text-sky-400 scale-105' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium">Équipes</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'import' ? 'text-sky-400 scale-105' : 'text-slate-500'
          }`}
        >
          <FileCode className="w-5 h-5" />
          <span className="text-[10px] font-medium">Parser</span>
        </button>
      </nav>
    </div>
  );
};

export default App;