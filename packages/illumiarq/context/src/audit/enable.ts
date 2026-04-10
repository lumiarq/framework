import { getContext } from '../async-local-storage.js';
import type { ExecutionContext } from '../types.js';
import { enableAuditForContext } from './store.js';

export function enableAudit(context: ExecutionContext = getContext()): ExecutionContext {
  enableAuditForContext(context);
  return context;
}
