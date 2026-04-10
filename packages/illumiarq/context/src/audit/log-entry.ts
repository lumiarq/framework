import { getContext } from '../async-local-storage.js';
import type { AuditEntry, AuditMetadata, ExecutionContext } from '../types.js';
import { pushAuditEntry } from './store.js';

export async function logAuditEntry(
  action: string,
  metadata: AuditMetadata = {},
  context: ExecutionContext = getContext(),
): Promise<AuditEntry> {
  const user = await context.auth.getUser();
  const entry: AuditEntry = {
    action,
    timestamp: new Date(),
    contextId: context.contextId,
    metadata,
    ...(user?.id !== undefined ? { userId: user.id } : {}),
  };

  pushAuditEntry(context, entry);
  return entry;
}
