import type { HttpEntry } from './types.js';

export interface HttpCollector {
  collect(entry: HttpEntry): void;
  getEntries(): HttpEntry[];
  clear(): void;
}

export function createHttpCollector(): HttpCollector {
  let entries: HttpEntry[] = [];

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
