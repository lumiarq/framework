import { getContext } from '../async-local-storage.js';
import type { AuditEntry, ExecutionContext } from '../types.js';
import { getAuditEntriesForContext } from './store.js';

export function getAuditTrail(context: ExecutionContext = getContext()): AuditEntry[] {
  return getAuditEntriesForContext(context);
}
