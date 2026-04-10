import type { AuditEntry, ExecutionContext } from '../types.js';

interface AuditState {
  enabled: boolean;
  entries: AuditEntry[];
}

const auditStore = new Map<string, AuditState>();

function getOrCreateState(context: ExecutionContext): AuditState {
  const existing = auditStore.get(context.contextId);
  if (existing) {
    return existing;
  }

  const state: AuditState = {
    enabled: false,
    entries: [],
  };
  auditStore.set(context.contextId, state);
  return state;
}

export function enableAuditForContext(context: ExecutionContext): void {
  getOrCreateState(context).enabled = true;
}

export function pushAuditEntry(context: ExecutionContext, entry: AuditEntry): void {
  const state = getOrCreateState(context);
  if (!state.enabled) {
    return;
  }

  state.entries.push(entry);
}

export function getAuditEntriesForContext(context: ExecutionContext): AuditEntry[] {
  return [...getOrCreateState(context).entries];
}
