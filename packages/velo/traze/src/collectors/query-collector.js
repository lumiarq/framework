export function createQueryCollector() {
  let entries = [];
  return {
    collect: (entry) => {
      entries.push(entry);
    },
    getEntries: () => [...entries],
    getWarnings: () => {
      const counts = new Map();
      for (const entry of entries) {
        counts.set(entry.sql, (counts.get(entry.sql) ?? 0) + 1);
      }
      return [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([sql, count]) => ({ sql, count, type: 'n-plus-one' }));
    },
    clear: () => {
      entries = [];
    },
  };
}
//# sourceMappingURL=query-collector.js.map
