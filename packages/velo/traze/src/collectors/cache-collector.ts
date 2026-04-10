import type { CacheEntry } from './types.js';

export interface CacheCollector {
  collect(entry: CacheEntry): void;
  getEntries(): CacheEntry[];
  clear(): void;
}

export function createCacheCollector(): CacheCollector {
  let entries: CacheEntry[] = [];

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
