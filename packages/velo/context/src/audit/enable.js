import { getContext } from '../async-local-storage.js';
import { enableAuditForContext } from './store.js';
export function enableAudit(context = getContext()) {
  enableAuditForContext(context);
  return context;
}
//# sourceMappingURL=enable.js.map
