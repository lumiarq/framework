import type { EventEntry } from './types.js';

export interface EventCollector {
  collect(entry: EventEntry): void;
  getEntries(): EventEntry[];
  clear(): void;
}

export function createEventCollector(): EventCollector {
  let entries: EventEntry[] = [];

  return {
    collect: (entry) => {
      entries.push(entry);
    },
    getEntries: () => [...entries],
    clear: () => {
      entries = [];
    },
  };
}
