/** The five test tasks of consult/ux-ui.md. `expected` tells which token a correct pick is (wrong-pick count). */
export interface TokenInfo {
  kind: 'player' | 'ball';
  team?: 'home' | 'away';
  number?: number;
}

export interface TaskDef {
  id: string;
  text: string;
  expected?: (t: TokenInfo) => boolean;
}

const home = (...numbers: number[]) => (t: TokenInfo) =>
  t.kind === 'player' && t.team === 'home' && numbers.includes(t.number ?? -1);

export const TASKS: TaskDef[] = [
  { id: 'T1', text: 'Flytta vänsterbacken (2:an) 10 meter framåt i steg 1.', expected: home(2) },
  { id: 'T2', text: 'Låt 8:an löpa in bakom deras mittfält.', expected: home(8) },
  { id: 'T3', text: 'Spela bollen från mittbacken till 6:an – och vidare till 8:an där hen landar.', expected: (t) => t.kind === 'ball' },
  { id: 'T4', text: 'Gör uppspelet: tre spelare rör sig och en passning, över tre steg. Spela upp.' },
  { id: 'T5', text: '8:an ska springa kortare. Ta sedan bort 9:ans löpning.', expected: home(8, 9) },
];
