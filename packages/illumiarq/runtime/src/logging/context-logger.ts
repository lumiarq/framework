import type { RequestLogger } from '../context/index.js';
import type { RuntimeLogger } from '../types.js';

export function createContextLogger(logger: RuntimeLogger): (contextId: string) => RequestLogger {
  return (contextId: string) => ({
    info: (message: string, meta?: Record<string, unknown>) => {
      void logger.info(message, { contextId, ...(meta ?? {}) });
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      void logger.warn(message, { contextId, ...(meta ?? {}) });
    },
    error: (message: string, meta?: Record<string, unknown>) => {
      void logger.error(message, { contextId, ...(meta ?? {}) });
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      void logger.debug(message, { contextId, ...(meta ?? {}) });
    },
  });
}
