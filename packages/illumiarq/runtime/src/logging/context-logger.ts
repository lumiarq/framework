import type { RequestLogger } from '../context/index.js';
import type { RuntimeLogger } from '../types.js';

export function createContextLogger(logger: RuntimeLogger): (contextId: string) => RequestLogger {
  return (contextId: string) => ({
    info: (message, meta) => {
      void logger.info(message, { contextId, ...(meta ?? {}) });
    },
    warn: (message, meta) => {
      void logger.warn(message, { contextId, ...(meta ?? {}) });
    },
    error: (message, meta) => {
      void logger.error(message, { contextId, ...(meta ?? {}) });
    },
    debug: (message, meta) => {
      void logger.debug(message, { contextId, ...(meta ?? {}) });
    },
  });
}