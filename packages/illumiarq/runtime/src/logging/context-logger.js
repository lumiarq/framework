export function createContextLogger(logger) {
  return (contextId) => ({
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
//# sourceMappingURL=context-logger.js.map
