import { getContext } from '../async-local-storage.js';
import { pushAuditEntry } from './store.js';
export async function logAuditEntry(action, metadata = {}, context = getContext()) {
  const user = await context.auth.getUser();
  const entry = {
    action,
    timestamp: new Date(),
    contextId: context.contextId,
    metadata,
    ...(user?.id !== undefined ? { userId: user.id } : {}),
  };
  pushAuditEntry(context, entry);
  return entry;
}
//# sourceMappingURL=log-entry.js.map
