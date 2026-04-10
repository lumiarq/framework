const auditStore = new Map();
function getOrCreateState(context) {
  const existing = auditStore.get(context.contextId);
  if (existing) {
    return existing;
  }
  const state = {
    enabled: false,
    entries: [],
  };
  auditStore.set(context.contextId, state);
  return state;
}
export function enableAuditForContext(context) {
  getOrCreateState(context).enabled = true;
}
export function pushAuditEntry(context, entry) {
  const state = getOrCreateState(context);
  if (!state.enabled) {
    return;
  }
  state.entries.push(entry);
}
export function getAuditEntriesForContext(context) {
  return [...getOrCreateState(context).entries];
}
//# sourceMappingURL=store.js.map
