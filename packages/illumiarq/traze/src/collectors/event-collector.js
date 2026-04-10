export function createEventCollector() {
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
//# sourceMappingURL=event-collector.js.map
