import { getContext } from '../async-local-storage.js';
import { getAuditEntriesForContext } from './store.js';
export function getAuditTrail(context = getContext()) {
  return getAuditEntriesForContext(context);
}
//# sourceMappingURL=get-trail.js.map
