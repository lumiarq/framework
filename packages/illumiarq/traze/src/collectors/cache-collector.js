export function createCacheCollector() {
  let entries = [];
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
//# sourceMappingURL=cache-collector.js.map
