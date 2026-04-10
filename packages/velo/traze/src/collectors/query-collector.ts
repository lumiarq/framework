import type { QueryEntry, QueryWarning } from './types.js';

export interface QueryCollector {
  collect(entry: QueryEntry): void;
  getEntries(): QueryEntry[];
  getWarnings(): QueryWarning[];
  clear(): void;
}

export function createQueryCollector(): QueryCollector {
  let entries: QueryEntry[] = [];

  return {
    collect: (entry) => {
      entries.push(entry);
    },
    getEntries: () => [...entries],
    getWarnings: () => {
      const counts = new Map<string, number>();
      for (const entry of entries) {
        counts.set(entry.sql, (counts.get(entry.sql) ?? 0) + 1);
      }

      return [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([sql, count]) => ({ sql, count, type: 'n-plus-one' as const }));
    },
    clear: () => {
      entries = [];
    },
  };
}
