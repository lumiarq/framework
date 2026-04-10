// ─── @lumiarq/framework ───────────────────────────────────────────────────────
// Main entry: re-exports all core primitives from @illumiarq/core
export * from '@illumiarq/core';

// ─── Config type interfaces ──────────────────────────────────────────────────
// App config files: `export default { ... } satisfies AppConfig`
// Internal: defineConfig() is framework-only — do not use in app code
export type {
  AppConfig,
  AuthConfig,
  DatabaseConfig,
  DatabaseConnectionConfig,
  SqliteConnectionConfig,
  PostgresConnectionConfig,
  PostgresPoolFields,
  MailConfig,
  MailFromFields,
  MailDriversFields,
  SmtpDriverFields,
  ResendDriverFields,
  QueueConfig,
  QueueOptions,
  QueueDriversFields,
  BullMQDriverFields,
  StorageConfig,
  DiskFields,
  LocalDiskFields,
  S3DiskFields,
  CacheConfig,
  CacheTtlFields,
  SessionConfig,
  SessionCookieFields,
  SecurityConfig,
  LoggingConfig,
  LogLevel,
} from './types/config.js';

export type { NeatConfig } from './types/config.js';

// ─── Config helpers ───────────────────────────────────────────────────────────
// defineAppConfig / defineAuthConfig / defineSessionConfig / defineSecurityConfig
// Provide smart defaults so app config files only specify what's different.
export {
  defineAppConfig,
  defineAuthConfig,
  defineSessionConfig,
  defineSecurityConfig,
} from './config-helpers.js';

// ─── Runtime: Boot & Application ──────────────────────────────────────────────
export {
  boot,
  eventBus,
  securityHeadersMiddleware,
  requestIdMiddleware,
  cacheControlMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  localeMiddleware,
  maintenanceMiddleware,
  trustProxiesMiddleware,
  csrfMiddleware,
  sessionMiddleware,
  InMemorySessionStore,
  writeFlash,
  writeOld,
  readAndClearFlash,
  getOld,
  buildSetCookieHeader,
  buildClearCookieHeader,
  buildBackResponse,
  getClientIp,
  isRequestSecure,
  getRequestHost,
  flashMiddleware,
  confirmedMiddleware,
  writeConfirmedAt,
  schedule,
  withTestContext,
} from '@illumiarq/runtime';
export type {
  LumiARQApp,
  BootHooks,
  MiddlewareFn,
  CorsOptions,
  RateLimitOptions,
} from '@illumiarq/runtime';

// ─── HTTP layer ───────────────────────────────────────────────────────────────
export {
  Route,
  route,
  defineRoute,
  defineBinding,
  defineHandler,
  defineLoader,
  defineSitemapLoader,
  currentRoute,
  HttpRequest,
  query,
  params,
  body,
  input,
  header,
  bearerToken,
  wantsJson,
  fullUrl,
  fullUrlWithQuery,
  json,
  redirect,
  HTTP_STATUS_CODES,
  ok,
  created,
  accepted,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  unprocessableEntity,
  serverError,
  HttpError,
  MissingRenderStrategyError,
  InvalidApiRouteError,
  DuplicateRouteError,
  MissingMetaError,
  RouteNotFoundError,
  abort,
  abortIf,
  abortUnless,
} from '@illumiarq/http';
export type {
  RouteDefinition,
  BindingDefinition,
  BindingResolver,
  HandlerContext,
  HandlerType,
  RenderMode,
  MetaData,
  WebRouteOptions,
  ApiRouteOptions,
  BoundLoader,
  SitemapEntry,
  LoaderDefinition,
  SitemapLoaderFn,
  RouteMatch,
  RedirectOptions,
  JsonOptions,
  HttpStatusCode,
} from '@illumiarq/http';
export * as Http from '@illumiarq/http';

// ─── Modules + Context ───────────────────────────────────────────────────────
export * as Modules from '@illumiarq/modules';
export * as Context from '@illumiarq/context';

// ─── Debugging + REPL ────────────────────────────────────────────────────────
export * as Tinker from '@illumiarq/tinker';
export * as Traze from '@trazze/sdk';

// ─── View + Cache + Testing ──────────────────────────────────────────────────
export * as Veil from '@illumiarq/veil';
export * as Query from '@illumiarq/query';
export * as Cache from '@illumiarq/cache';
export * as Testing from '@illumiarq/testing';

// ─── Database: Connection Factory ─────────────────────────────────────────────
export {
  createConnection,
  setConnectionConfig,
  getConnection,
  clearConnectionCache,
  BaseRepository,
  BaseSeeder,
  BaseFactory,
} from '@illumiarq/database';
export type {
  ConnectionOptions,
  DatabaseConnection,
  LibSQLDatabase,
  DatabaseFactoryConfig,
  DatabaseConnectionFactoryEntry,
  IRepository,
  PaginateOptions,
  PaginatedResult,
  CursorPaginateOptions,
  CursorPaginatedResult,
} from '@illumiarq/database';
