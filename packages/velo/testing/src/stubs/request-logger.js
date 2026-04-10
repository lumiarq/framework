import { getContext } from '@velo/context';
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
/**
 * RequestLogger — reads ExecutionContext from ALS at log time so that
 * requestId and actorId are automatically injected into every log line.
 * Implements both LoggerContract and the internal RequestLogger interface.
 */
export class RequestLogger {
  minLevel;
  prettify;
  constructor(opts = {}) {
    this.minLevel = LEVELS[opts.level ?? 'debug'];
    this.prettify = opts.prettify ?? false;
  }
  debug(message, context) {
    this.write('debug', message, context);
  }
  info(message, context) {
    this.write('info', message, context);
  }
  warn(message, context) {
    this.write('warn', message, context);
  }
  error(message, context) {
    this.write('error', message, context);
  }
  write(level, message, meta) {
    if (LEVELS[level] < this.minLevel) return;
    let ctx = {};
    try {
      ctx = getContext();
    } catch {
      /* ambient — no context */
    }
    const entry = {
      level,
      message,
      requestId: ctx.contextId,
      userId: ctx.auth?.userId,
      timestamp: new Date().toISOString(),
      ...meta,
    };
    const output = this.prettify ? JSON.stringify(entry, null, 2) : JSON.stringify(entry);
    if (level === 'error' || level === 'warn') {
      console.error(output);
    } else {
      console.log(output);
    }
  }
}
//# sourceMappingURL=request-logger.js.map
