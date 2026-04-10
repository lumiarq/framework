// ─── Action ──────────────────────────────────────────────────────────────────
export { defineAction } from './action/define-action.js';
export type { ActionFn, ActionMetadata } from './action/define-action.js';

// ─── Task ────────────────────────────────────────────────────────────────────
export { defineTask } from './task/define-task.js';
export type { TaskFn } from './task/define-task.js';

// ─── Query ────────────────────────────────────────────────────────────────────
export { defineQuery } from './query/define-query.js';
export type { QueryFn } from './query/define-query.js';

// ─── Module ──────────────────────────────────────────────────────────────────
export { defineModule } from './module/define-module.js';
export type {
  ModuleDefinition,
  ModuleMode,
  DefineModuleOptions,
  ModuleMiddlewareConfig,
} from './module/define-module.js';

// ─── Policy & Gate ────────────────────────────────────────────────────────────
export { definePolicy } from './policy/define-policy.js';
export type { PolicyDefinition, AbilityMap } from './policy/define-policy.js';
export { Gate, AuthorizationError } from './policy/gate.js';
export type { BoundGate } from './policy/gate.js';

// ─── Events ───────────────────────────────────────────────────────────────────
export { defineEvent } from './event/define-event.js';
export type { EventDefinition } from './event/define-event.js';
export { defineListener } from './event/define-listener.js';
export type { ListenerDefinition } from './event/define-listener.js';
export { EventBus } from './event/event-bus.js';
export type { ListenerFn, EventEnvelope } from './event/event-bus.js';

// ─── Config ───────────────────────────────────────────────────────────────────
export { defineConfig } from './config/define-config.js';
export {
  CONTENT_DEFAULTS,
  AUTH_DEFAULTS,
  HTTP_DEFAULTS,
  RATE_LIMIT_DEFAULTS,
  PAGINATION_DEFAULTS,
  SECURITY_DEFAULTS,
  SCHEDULER_DEFAULTS,
} from './config/defaults.js';

// ─── HTTP utilities ────────────────────────────────────────────────────────────
export { generateRequestId } from './http/request-id.js';
export { sanitizeInput, sanitizeObject } from './http/sanitize.js';

// ─── Errors ───────────────────────────────────────────────────────────────────
export { LumiARQError } from './errors/lumiarq-error.js';
export { NotFoundError, ValidationError } from './errors/domain-errors.js';
export { AuthenticationError, ForbiddenError } from './errors/auth-errors.js';
export { BusinessRuleError, ConflictError } from './errors/action-errors.js';
export { MissingContextError } from './errors/missing-context-error.js';
export { LoaderDependencyError } from './errors/loader-dependency-error.js';
export { StaticBuildError } from './errors/static-build-error.js';
export { ListenerTimeoutError } from './errors/listener-timeout-error.js';
export { ConfigurationError } from './errors/configuration-error.js';
export {
  MissingRenderStrategyError,
  InvalidApiRouteError,
  DuplicateRouteError,
  MissingMetaError,
  RouteNotFoundError,
} from './errors/route-errors.js';

// ─── Crypto utilities ─────────────────────────────────────────────────────────
export { hashPassword, verifyPassword, generateToken } from './crypto/index.js';

// ─── JWT primitives (RS256 only) ─────────────────────────────────────────────
export { sign, verify } from './jwt/index.js';
export type { JwtOptions } from './jwt/index.js';

// ─── Common schemas ───────────────────────────────────────────────────────────
export {
  EmailSchema,
  UuidSchema,
  SlugSchema,
  PaginationSchema,
  CursorSchema,
  SortDirectionSchema,
  DateTimeSchema,
  PositiveIntSchema,
  NonEmptyStringSchema,
  PasswordSchema,
  SemverSchema,
} from './schemas.js';
export type { Pagination, Cursor, SortDirection } from './schemas.js';

// ─── Utilities ───────────────────────────────────────────────────────────────
export { retry } from './utils/retry.js';
export type { RetryOptions } from './utils/retry.js';
export { concurrently } from './utils/concurrently.js';
export { url, setAppUrl } from './utils/url.js';

// ─── i18n ─────────────────────────────────────────────────────────────────────
export { t, setLocaleConfig, loadTranslations, getActiveLocale } from './i18n/index.js';

// ─── Application environment ──────────────────────────────────────────────────
export { app } from './app.js';
export type { AppEnvironment } from './app.js';

// ─── Testing utilities ────────────────────────────────────────────────────────
export {
  getTestTransaction,
  isInTestTransaction,
  runWithTestTransaction,
} from './testing/test-transaction.js';

// ─── Content loader ───────────────────────────────────────────────────────────
export { defineContentLoader } from './content/define-content-loader.js';
export type {
  ContentPage,
  TocEntry,
  ContentLoaderOptions,
  ContentLoader,
} from './content/define-content-loader.js';
export { clearCache as clearContentCache } from './content/content-cache.js';
