export type SaveStatus = 'saved' | 'pending' | 'error';

export interface Autosaver<T> {
  /** Queues a value; it is saved after the delay unless a newer value arrives first. */
  schedule(value: T): void;
  /** Saves the queued value now. Returns false if saving failed (the value stays queued). */
  flush(): boolean;
  cancel(): void;
}

/** Debounced saving that never silently drops the last change and reports failures instead of throwing. */
export function createAutosaver<T>(
  save: (value: T) => void,
  delayMs: number,
  onStatus: (status: SaveStatus) => void,
): Autosaver<T> {
  let pending: { value: T } | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = (): boolean => {
    clearTimeout(timer);
    timer = undefined;
    if (!pending) return true;
    try {
      save(pending.value);
      pending = null;
      onStatus('saved');
      return true;
    } catch {
      onStatus('error');
      return false;
    }
  };

  return {
    schedule(value) {
      pending = { value };
      onStatus('pending');
      clearTimeout(timer);
      timer = setTimeout(flush, delayMs);
    },
    flush,
    cancel() {
      clearTimeout(timer);
      timer = undefined;
    },
  };
}
