import Dexie, { Table } from 'dexie';
import { Team, MatchupMatrices, RoundSession } from '../types';

export class WtcDatabase extends Dexie {
  teams!: Table<Team>;
  matrices!: Table<{ id: string; data: MatchupMatrices }>;
  rounds!: Table<RoundSession>;

  constructor() {
    super('WtcTacticalDB');
    this.version(1).stores({
      teams: 'id, name',
      matrices: 'id',
      rounds: 'id, roundNumber, status'
    });
  }
}

export const db = new WtcDatabase();