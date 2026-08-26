import React, { useEffect, useState } from 'react';
import { Swords, Grid, Sliders, Trophy, ShieldCheck, Users } from 'lucide-react';
import { useMetaStore } from './store/useMetaStore';
import { PairingAssistant } from './components/PairingAssistant';
import { ZoomableMatrix } from './components/ZoomableMatrix';
import { RosterManager } from './components/RosterManager';
import { MetaEditor } from './components/MetaEditor';
import { TournamentRounds } from './components/TournamentRounds';

export const App: React.FC = () => {
  const { myTeam, opponentTeam, matrices, loadInitialData } = useMetaStore();
  const [activeTab, setActiveTab] = useState<'pairing' | 'matrix' | 'rounds' | 'meta' | 'rosters'>('rosters');
  const [availableMaps] = useState<string[]>(['Map 1', 'Map 2', 'Map 3', 'Map 4', 'Map 5', 'Map 6', 'Map 7', 'Map 8']);

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-400" />
          <h1 className="text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            WTC 40k Tactical Assistant
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'pairing' && (
          <PairingAssistant
            myPlayers={myTeam.players}
            oppPlayers={opponentTeam.players}
            availableMaps={availableMaps}
            matrices={matrices}
          />
        )}

        {activeTab === 'matrix' && (
          <div className="h-[calc(100vh-130px)] p-2">
            <ZoomableMatrix myPlayers={myTeam.players} oppPlayers={opponentTeam.players} matrices={matrices} />
          </div>
        )}

        {activeTab === 'rounds' && <TournamentRounds />}
        {activeTab === 'meta' && <MetaEditor />}
        {activeTab === 'rosters' && <RosterManager />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 flex items-center justify-around pb-6">
        <button onClick={() => setActiveTab('rosters')} className={`flex flex-col items-center gap-1 ${activeTab === 'rosters' ? 'text-sky-400' : 'text-slate-500'}`}>
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Rosters</span>
        </button>
        <button onClick={() => setActiveTab('pairing')} className={`flex flex-col items-center gap-1 ${activeTab === 'pairing' ? 'text-sky-400' : 'text-slate-500'}`}>
          <Swords className="w-5 h-5" />
          <span className="text-[10px]">Pairing</span>
        </button>
        <button onClick={() => setActiveTab('matrix')} className={`flex flex-col items-center gap-1 ${activeTab === 'matrix' ? 'text-sky-400' : 'text-slate-500'}`}>
          <Grid className="w-5 h-5" />
          <span className="text-[10px]">Matrice</span>
        </button>
        <button onClick={() => setActiveTab('rounds')} className={`flex flex-col items-center gap-1 ${activeTab === 'rounds' ? 'text-sky-400' : 'text-slate-500'}`}>
          <Trophy className="w-5 h-5" />
          <span className="text-[10px]">Rondes</span>
        </button>
        <button onClick={() => setActiveTab('meta')} className={`flex flex-col items-center gap-1 ${activeTab === 'meta' ? 'text-sky-400' : 'text-slate-500'}`}>
          <Sliders className="w-5 h-5" />
          <span className="text-[10px]">Meta</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
