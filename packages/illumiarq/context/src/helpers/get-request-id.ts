import { getContext } from '../async-local-storage.js';

export function getRequestId(): string {
  return getContext().contextId;
}
