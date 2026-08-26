// Exemple de fonctions à ajouter dans votre store Zustand (useMetaStore)
generateRandomOpponentTeam: (name = "Équipe Aléatoire") => {
  const sampleNames = ["Alex", "Thomas", "Nicolas", "Julien", "David", "Maxime", "Lucas", "Romain"];
  const sampleFactions = ["Space Marines", "Aeldari", "Orks", "Tyranids", "Necrons", "World Eaters", "Tau Empire", "Guard Impériale"];
  
  const players = Array.from({ length: 5 }, (_, i) => ({
    id: crypto.randomUUID(),
    name: `${sampleNames[i % sampleNames.length]} ${i + 1}`,
    faction: sampleFactions[Math.floor(Math.random() * sampleFactions.length)],
    disposition: 'Balanced' as const,
    tablePreferences: {}
  }));

  const newTeam = { id: crypto.randomUUID(), name, size: players.length, players };
  set((state) => ({ opponentTeam: newTeam }));
},

generateMetaOptimizedTeam: () => {
  // Sélectionne les meilleures factions de votre meta-tableau
  const matrices = get().matrices?.factionVsFaction || {};
  const allFactions = Object.keys(matrices);
  
  if (allFactions.length === 0) return;

  // Calcule la faction ayant le meilleur score moyen global dans le tableau
  const scoredFactions = allFactions.map(faction => {
    const scores = Object.values(matrices[faction] || {}) as number[];
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { faction, avg };
  }).sort((a, b) => b.avg - a.avg);

  const topFaction = scoredFactions[0]?.faction || "Space Marines";

  const optimizedPlayers = Array.from({ length: 5 }, (_, i) => ({
    id: crypto.randomUUID(),
    name: `Champion Meta ${i + 1}`,
    faction: topFaction,
    disposition: 'Balanced' as const,
    tablePreferences: {}
  }));

  set((state) => ({
    myTeam: {
      ...state.myTeam,
      name: `Meta Dream Team (${topFaction})`,
      players: optimizedPlayers,
      size: optimizedPlayers.length
    }
  }));
}
