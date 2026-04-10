/**
 * Unified execution context — covers all lifecycle variants:
 *   request  — HTTP request lifecycle (set by runtime middleware)
 *   job      — Scheduled job lifecycle (set by scheduler before running a job)
 *   command  — CLI command lifecycle (or the ambient default outside any ALS scope)
 *   test     — Test lifecycle (set by withTestContext(); wraps in a transaction)
 *
 * Always non-null. `getContext()` never throws — returns an ambient `command`
 * context when called outside any `runWithContext()` scope.
 */
export interface ExecutionContext {
  /** Discriminates the lifecycle variant. */
  readonly contextType: 'request' | 'job' | 'command' | 'test';
  /** Unique identifier for this execution — request-id, job-id, or generated UUID. */
  readonly contextId: string;
  /** Timestamp when the execution began. */
  readonly startedAt: Date;
  /** Authentication context (may be unauthenticated). */
  readonly auth: AuthContext;
  /** Context-scoped logger. */
  readonly logger: RequestLogger;
  /** BCP 47 locale tag. Defaults to 'en'. */
  readonly locale: string;
  /**
   * Active database connections keyed by connection name.
   * Set by `withTestContext()` to inject transaction connections into repositories.
   * In production contexts this field is absent; repositories use their injected connection.
   */
  readonly db?: Record<string, unknown>;
}

/**
 * Authentication state for the current execution context.
 * Populated by auth middleware before handlers run (request lifecycle).
 */
export interface AuthContext {
  readonly isAuthenticated: boolean;
  getUser(): Promise<AuthUser | null>;
}

/**
 * Minimal authenticated user representation.
 */
export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly role: string;
  /** User's preferred locale (BCP 47 tag). Used by localeMiddleware. */
  readonly locale?: string;
}

/**
 * Context-scoped logger interface.
 */
export interface RequestLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export interface AuditMetadata {
  readonly [key: string]: unknown;
}

export interface AuditEntry {
  readonly action: string;
  readonly timestamp: Date;
  readonly contextId: string;
  readonly userId?: string;
  readonly metadata: AuditMetadata;
}
