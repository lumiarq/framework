export function createHttpCollector() {
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
//# sourceMappingURL=http-collector.js.map
