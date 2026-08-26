import React, { useState } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import { DispositionArchetype } from '../types';

interface ListParserProps {
  onParsed: (playerInfo: { name: string; faction: string; disposition: DispositionArchetype; rawList: string }) => void;
}

export const ListParser: React.FC<ListParserProps> = ({ onParsed }) => {
  const [rawText, setRawText] = useState('');

  const parseWtcList = () => {
    if (!rawText.trim()) return;

    let faction = 'Space Marines';
    let name = 'Joueur Inconnu';
    let disposition: DispositionArchetype = 'Take & Hold';

    // Regex d'analyse des blocs WTC / BCP
    const factionMatch = rawText.match(/(?:FACTION|Faction Main|Faction)\s*:\s*([^\n\r]+)/i);
    if (factionMatch) faction = factionMatch[1].trim();

    const nameMatch = rawText.match(/(?:PLAYER|Name|Joueur)\s*:\s*([^\n\r]+)/i);
    if (nameMatch) name = nameMatch[1].trim();

    if (/purge/i.test(rawText)) disposition = 'Purge the Foe';
    else if (/recon|reconnaissance/i.test(rawText)) disposition = 'Reconnaissance';
    else if (/disruption/i.test(rawText)) disposition = 'Disruption';
    else if (/priority/i.test(rawText)) disposition = 'Priority Asset';

    onParsed({ name, faction, disposition, rawList: rawText });
    setRawText('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-100 space-y-3">
      <label className="flex items-center gap-2 font-semibold text-sm text-sky-400">
        <FileText className="w-4 h-4" /> Importateur de Liste WTC / BCP
      </label>
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Collez ici la liste au format texte..."
        className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:ring-2 focus:ring-sky-500 outline-none resize-none"
      />
      <button
        onClick={parseWtcList}
        className="w-full h-12 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] transition-all rounded-xl font-medium text-sm flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-4 h-4" /> Analyser et Importer
      </button>
    </div>
  );
};