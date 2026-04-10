export function createLogger(options = {}) {
  const channels = options.channels ?? [];
  let currentContext = { ...(options.context ?? {}) };
  const log = async (level, message, context, metrics) => {
    const entry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...currentContext, ...(context ?? {}) },
      metrics,
    };
    await Promise.all(channels.map((channel) => channel.handle(entry)));
  };
  const logger = {
    debug: (message, context, metrics) => log('debug', message, context, metrics),
    info: (message, context, metrics) => log('info', message, context, metrics),
    warn: (message, context, metrics) => log('warn', message, context, metrics),
    error: (message, context, metrics) => log('error', message, context, metrics),
    log,
    context: (values) => {
      currentContext = { ...currentContext, ...values };
      return logger;
    },
    clearContext: () => {
      currentContext = {};
      return logger;
    },
    measure: async (message, fn, context) => {
      const startedAt = performance.now();
      try {
        return await fn();
      } finally {
        await log('info', message, context, { durationMs: performance.now() - startedAt });
      }
    },
  };
  return logger;
}
//# sourceMappingURL=logger.js.map
