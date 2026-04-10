import type { Channel, LogEntry, LogLevel, Logger, PerformanceMetrics } from './types.js';

export interface CreateLoggerOptions {
  channels?: Channel[];
  context?: Record<string, unknown>;
}

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const channels = options.channels ?? [];
  let currentContext: Record<string, unknown> = { ...(options.context ?? {}) };

  const log = async (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    metrics?: PerformanceMetrics,
  ): Promise<void> => {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...currentContext, ...(context ?? {}) },
      metrics,
    };

    await Promise.all(channels.map((channel) => channel.handle(entry)));
  };

  const logger: Logger = {
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
    measure: async <T>(
      message: string,
      fn: () => Promise<T> | T,
      context?: Record<string, unknown>,
    ) => {
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
