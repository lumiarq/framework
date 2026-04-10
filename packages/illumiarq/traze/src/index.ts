/**
 * @deprecated Use `@trazze/sdk` instead. This package will be removed in a future release.
 */
console.warn(
  '[@illumiarq/traze] This package is deprecated. Migrate to @trazze/sdk.',
);

import { dd, dump, trace } from './helpers/index.js';

export { createLogger } from './logger/logger.js';
export type { LogEntry, LogLevel, PerformanceMetrics, Channel, Logger } from './logger/types.js';

export { dump, dd, trace, formatDump, formatDuration, formatBytes } from './helpers/index.js';
export { style } from './helpers/style.js';
export type { TrazeStyle } from './helpers/style.js';

export {
  createHttpCollector,
  createQueryCollector,
  createEventCollector,
  createCacheCollector,
} from './collectors/index.js';
export type {
  HttpCollector,
  QueryCollector,
  EventCollector,
  CacheCollector,
} from './collectors/index.js';
export type {
  HttpEntry,
  QueryEntry,
  QueryWarning,
  EventEntry,
  CacheEntry,
} from './collectors/types.js';

export { createFileChannel, createConsoleChannel, createHttpChannel } from './channels/index.js';
export type { ChannelOptions } from './channels/types.js';

const globals = globalThis as Record<string, unknown>;
globals['dump'] = dump;
globals['dd'] = dd;
globals['trace'] = trace;
