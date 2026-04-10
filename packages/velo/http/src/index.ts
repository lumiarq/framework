export { Route, route, getRegisteredRoutes, clearRegisteredRoutes } from './router/route.js';
export { matchRoute, compilePattern } from './router/matcher.js';
export { defineRoute } from './router/define-route.js';
export { defineBinding } from './router/define-binding.js';
export type { RouteDefinition } from './router/define-route.js';
export type { BindingDefinition, BindingResolver } from './router/define-binding.js';
export type {
  HandlerType,
  RenderMode,
  MetaData,
  WebRouteOptions,
  ApiRouteOptions,
  RouteGroupOptions,
  ResourceHandlers,
  ResourceOptions,
  ResourceAction,
} from './router/types.js';

export { defineHandler } from './handler/define-handler.js';
export { createRequestHandler } from './handler/execute.js';
export type { HandlerContext } from './handler/types.js';

export { defineLoader, defineSitemapLoader } from './loader/define-loader.js';
export { orchestrateLoaders, createRequestCache } from './loader/execute.js';
export type { BoundLoader, SitemapEntry } from './loader/types.js';
export type { LoaderDefinition, SitemapLoaderFn } from './loader/define-loader.js';
export type { RequestCache } from './loader/execute.js';

export { defineMiddleware, getMiddleware, hasMiddleware, getAllMiddleware, clearMiddlewareRegistry, middleware } from './middleware/define-middleware.js';
export { composeMiddleware } from './middleware/pipeline.js';
export { MiddlewareStack } from './middleware/stack.js';
export type { MiddlewareFn, MiddlewareDefinition, MiddlewareInput } from './middleware/types.js';

export { url, setAppUrl } from './url/url.js';
export { route as routeUrl } from './url/route.js';
export { currentRoute } from './url/current-route.js';

export { HttpRequest } from './request/request.js';
export {
  query,
  params,
  body,
  input,
  header,
  bearerToken,
  wantsJson,
  expectsJson,
  fullUrl,
  fullUrlWithQuery,
} from './request/helpers.js';

export { json } from './response/json.js';
export { redirect } from './response/redirect.js';
export { HTTP_STATUS_CODES } from './response/http-status-codes.js';
export type { HttpStatusCode } from './response/http-status-codes.js';
export {
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
} from './response/helpers.js';

export {
  HttpError,
  MissingRenderStrategyError,
  InvalidApiRouteError,
  DuplicateRouteError,
  MissingMetaError,
  RouteNotFoundError,
} from './errors/http-errors.js';
export { LoaderDependencyError } from '@velo/core';
export { abort, abortIf, abortUnless } from './errors/abort.js';

export { scanSsgEligibleRoutes } from './ssg/scanner.js';
export { prerenderRoutes } from './ssg/prerender.js';

export type { RouteMatch, RedirectOptions, JsonOptions } from './types/http.types.js';
export type { GenerateParamsResult, StaticRoute } from './types/ssg.types.js';

// ── Built-in middleware ───────────────────────────────────────────────────────
// Importing this registers all framework built-in middleware into the global registry.
// Called once by boot.ts — do not call in application code.
export { authMiddleware, csrfMiddleware, throttleMiddleware } from './middleware/builtins/index.js';
