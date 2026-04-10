// ─── RequestLogger — console/file logger implementing LoggerContract ──────────
import type { LoggerContract } from '@velo/contracts';
import { getContext } from '@velo/context';

export interface RequestLoggerOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';
  prettify?: boolean;
}

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

/**
 * RequestLogger — reads ExecutionContext from ALS at log time so that
 * requestId and actorId are automatically injected into every log line.
 * Implements both LoggerContract and the internal RequestLogger interface.
 */
export class RequestLogger implements LoggerContract {
  private readonly minLevel: number;
  private readonly prettify: boolean;

  constructor(opts: RequestLoggerOptions = {}) {
    this.minLevel = LEVELS[opts.level ?? 'debug'];
    this.prettify = opts.prettify ?? false;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.write('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('error', message, context);
  }

  private write(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (LEVELS[level] < this.minLevel) return;

    let ctx: { contextId?: string; auth?: { userId?: string } } = {};
    try {
      ctx = getContext() as typeof ctx;
    } catch {
      /* ambient — no context */
    }

    const entry: Record<string, unknown> = {
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
