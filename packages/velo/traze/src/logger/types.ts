export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface PerformanceMetrics {
  durationMs?: number;
  bytes?: number;
  memoryBytes?: number;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown> | undefined;
  metrics?: PerformanceMetrics | undefined;
}

export interface Channel {
  handle(entry: LogEntry): void | Promise<void>;
}

export interface Logger {
  debug(
    message: string,
    context?: Record<string, unknown>,
    metrics?: PerformanceMetrics,
  ): Promise<void>;
  info(
    message: string,
    context?: Record<string, unknown>,
    metrics?: PerformanceMetrics,
  ): Promise<void>;
  warn(
    message: string,
    context?: Record<string, unknown>,
    metrics?: PerformanceMetrics,
  ): Promise<void>;
  error(
    message: string,
    context?: Record<string, unknown>,
    metrics?: PerformanceMetrics,
  ): Promise<void>;
  log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    metrics?: PerformanceMetrics,
  ): Promise<void>;
  context(values: Record<string, unknown>): Logger;
  clearContext(): Logger;
  measure<T>(
    message: string,
    fn: () => Promise<T> | T,
    context?: Record<string, unknown>,
  ): Promise<T>;
}
