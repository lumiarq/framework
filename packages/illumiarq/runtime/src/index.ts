// ─── Execution Context ────────────────────────────────────────────────────────
export {
  runWithContext,
  getContext,
  setApplicationContext,
  createRequestContext,
  createJobContext,
  createCommandContext,
  createTestContext,
} from './context/index.js';
export type {
  ExecutionContext,
  AuthContext,
  AuthUser,
  CreateRequestContextOptions,
  CreateJobContextOptions,
  CreateCommandContextOptions,
  CreateTestContextOptions,
} from './context/index.js';

// ─── Boot & Application ───────────────────────────────────────────────────────
export { boot } from './boot.js';
export { eventBus } from './event-bus-instance.js';
export type { LumiARQApp, BootHooks } from './types.js';

// ─── Module Discovery ─────────────────────────────────────────────────────────
export { discoverModules, autoRegisterListeners } from './discovery/discover-modules.js';
export type { ModuleManifestEntry, ModulesManifest } from './discovery/discover-modules.js';

// ─── Loader Orchestration ────────────────────────────────────────────────────
export { orchestrateLoaders, createRequestCache } from './loader-orchestrator.js';
export type { RequestCache } from './loader-orchestrator.js';

// ─── Middleware Pipeline ──────────────────────────────────────────────────────
export {
  composeMiddleware,
  deriveCacheControl,
  withHeaders,
  securityHeadersMiddleware,
  requestIdMiddleware,
  cacheControlMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
} from './middleware-pipeline.js';
export type {
  MiddlewareFn,
  CorsOptions,
  RateLimitOptions,
  RouteRenderConfig,
} from './middleware-pipeline.js';

// ─── Middleware: Locale ───────────────────────────────────────────────────────
export { localeMiddleware } from './middleware/locale.js';
export type { LocaleOptions } from './middleware/locale.js';

// ─── Middleware: Maintenance ──────────────────────────────────────────────────
export { maintenanceMiddleware } from './middleware/maintenance.js';
export type { MaintenanceSentinel } from './middleware/maintenance.js';

// ─── Middleware: Trust Proxies ────────────────────────────────────────────────
export { trustProxiesMiddleware } from './middleware/trust-proxies.js';
export type { TrustProxiesOptions } from './middleware/trust-proxies.js';

// ─── Middleware: CSRF ─────────────────────────────────────────────────────────
export { csrfMiddleware } from './middleware/csrf.js';
export type { CsrfOptions } from './middleware/csrf.js';

// ─── Middleware: Session ──────────────────────────────────────────────────────
export { sessionMiddleware } from './middleware/session.js';
export type { SessionOptions } from './middleware/session.js';

// ─── Session Store ────────────────────────────────────────────────────────────
export { InMemorySessionStore } from './session/index.js';
export type { SessionData, SessionStore } from './session/index.js';

// ─── Request Lifecycle ────────────────────────────────────────────────────────
export { handleRequest } from './request-lifecycle.js';
export type { HandleRequestOptions } from './request-lifecycle.js';

// ─── Helpers: Flash ───────────────────────────────────────────────────────────
export { writeFlash, writeOld, readAndClearFlash, getOld } from './helpers/flash.js';

// ─── Helpers: Cookie ──────────────────────────────────────────────────────────
export { buildSetCookieHeader, buildClearCookieHeader } from './helpers/cookie.js';
export type { CookieOptions } from './helpers/cookie.js';

// ─── Helpers: Back ────────────────────────────────────────────────────────────
export { buildBackResponse } from './helpers/back.js';

// ─── Helpers: Request ─────────────────────────────────────────────────────────
export { getClientIp, isRequestSecure, getRequestHost, expectsJson } from './helpers/req.js';

// ─── Middleware: Flash ────────────────────────────────────────────────────────
export { flashMiddleware } from './middleware/flash.js';
export type { FlashMiddlewareOptions } from './middleware/flash.js';

// ─── Middleware: Password Confirmation ────────────────────────────────────────
export { confirmedMiddleware, writeConfirmedAt } from './middleware/confirmed.js';
export type { ConfirmedOptions } from './middleware/confirmed.js';

// ─── Stub Scheduler (v1) ─────────────────────────────────────────────────────
export { StubScheduler, schedule } from './stub-scheduler.js';

// ─── Test utilities ───────────────────────────────────────────────────────────
export { withTestContext } from './with-test-context.js';
export type { WithTestContextOverrides } from './with-test-context.js';

// ─── Runtime Stub Implementations ────────────────────────────────────────────
export {
  RequestLogger,
  StubMailer,
  StubQueue,
  StubStorage,
  StubCache,
  StubAudit,
} from './stubs/index.js';
export type {
  RequestLoggerOptions,
  StubMailerOptions,
  StubQueueOptions,
  StubStorageOptions,
  StubAuditOptions,
} from './stubs/index.js';
