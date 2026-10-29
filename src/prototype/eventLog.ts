/** In-memory event log of one prototype session. No names, nothing stored: it lives until the page is closed. */
import { TASKS, type TokenInfo } from './tasks';

export interface LogEvent {
  t: number;
  type: string;
  step?: number;
  task?: string;
  [key: string]: unknown;
}

export interface EventLog {
  variant: string;
  startedAt: string;
  t0: number;
  participant: string;
  order: string;
  events: LogEvent[];
  task: string | null;
}

/** Event types that count as one coach action (T4 threshold: <= 12 actions). */
export const ACTION_TYPES = [
  'drag',
  'free-arrow',
  'zone',
  'add-player',
  'tool',
  'step-add',
  'step-go',
  'arrow-type',
  'arrow-remove',
  'undo',
];
/** An undo this soon after a drag counts as a probable wrong pick or unintended move. */
export const QUICK_UNDO_MS = 8000;

export const PARTICIPANTS = ['Pilot (ägaren)', 'Tränare 1', 'Tränare 2', 'Tränare 3'];
export const ORDERS = ['Första varianten', 'Andra varianten'];

export function createLog(variant: string): EventLog {
  return {
    variant,
    startedAt: new Date().toISOString(),
    t0: performance.now(),
    participant: PARTICIPANTS[0]!,
    order: ORDERS[0]!,
    events: [],
    task: null,
  };
}

export function record(log: EventLog, type: string, data: Record<string, unknown> = {}): LogEvent {
  const event: LogEvent = {
    t: Math.round(performance.now() - log.t0),
    type,
    ...(log.task ? { task: log.task } : {}),
    ...data,
  };
  log.events.push(event);
  return event;
}

export function startTask(log: EventLog, id: string) {
  log.task = id;
  record(log, 'task-start');
}

export function endTask(log: EventLog) {
  if (!log.task) return;
  const start = [...log.events].reverse().find((e) => e.type === 'task-start' && e.task === log.task);
  record(log, 'task-end', { ms: start ? Math.round(performance.now() - log.t0) - start.t : 0 });
  log.task = null;
}

/** True if the token is not what the active task asks for. */
export function isWrongPick(taskId: string | null, token: TokenInfo): boolean {
  const expected = TASKS.find((t) => t.id === taskId)?.expected;
  return !!expected && !expected(token);
}

export interface TaskSummary {
  task: string;
  seconds: number;
  drags: number;
  undos: number;
  quickUndos: number;
  wrongPicks: number;
  actions: number;
}

/** One row per finished task run (a task run twice gives two rows). */
export function summarize(events: LogEvent[]): TaskSummary[] {
  const rows: TaskSummary[] = [];
  let open: { start: LogEvent; inside: LogEvent[] } | null = null;
  for (const e of events) {
    if (e.type === 'task-start') {
      open = { start: e, inside: [] };
    } else if (e.type === 'task-end' && open) {
      const inside = open.inside;
      const drags = inside.filter((x) => x.type === 'drag');
      rows.push({
        task: String(open.start.task),
        seconds: Math.round(Number(e.ms ?? 0) / 100) / 10,
        drags: drags.length,
        undos: inside.filter((x) => x.type === 'undo').length,
        quickUndos: inside.filter((x) => x.type === 'undo' && x.quick === true).length,
        wrongPicks: drags.filter((x) => x.wrong === true).length,
        actions: inside.filter((x) => ACTION_TYPES.includes(x.type)).length,
      });
      open = null;
    } else {
      open?.inside.push(e);
    }
  }
  return rows;
}

export function formatLog(log: EventLog): string {
  const rows = summarize(log.events).map(
    (r) =>
      `${r.task}: ${r.seconds} s · drag ${r.drags} · ångra ${r.undos} (snabbt ${r.quickUndos}) · fel bricka ${r.wrongPicks} · handlingar ${r.actions}`,
  );
  return [
    'Spelboken prototyp – testlogg',
    `variant: ${log.variant.toUpperCase()} · deltagare: ${log.participant} · ordning: ${log.order} · start: ${log.startedAt}`,
    '--- Sammanfattning ---',
    ...(rows.length ? rows : ['(inga avslutade uppgifter)']),
    '--- Händelser (JSON) ---',
    JSON.stringify(log.events),
  ].join('\n');
}
