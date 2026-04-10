import { runWithContext } from '../async-local-storage.js';
import type { ExecutionContext } from '../types.js';

export function withContext<T>(context: ExecutionContext, fn: () => T): T {
  return runWithContext(context, fn);
}
