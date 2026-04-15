import type { RouteDefinition } from './define-route.js';
import type { BindingDefinition } from './define-binding.js';
import type {
  MetaData,
  RenderMode,
  HandlerType,
  RouteGroupOptions,
  ResourceHandlers,
  ResourceOptions,
  ResourceAction,
  MiddlewareInput,
} from './types.js';
import { DuplicateRouteError, RouteNotFoundError } from '../errors/http-errors.js';
import { url } from '../url/url.js';

export interface WebRouteOptions {
  render: RenderMode;
  revalidate?: number | false;
  loaders?: HandlerType[];
  middleware?: MiddlewareInput[];
  generateParams?: () => Promise<Array<Record<string, string>>>;
  meta?: (ctx: {
    params: Record<string, string>;
    loaderData: Record<string, unknown>;
  }) => MetaData | Promise<MetaData>;
  name?: string;
  bind?: Record<string, BindingDefinition>;
  deprecated?: boolean;
  sunset?: string;
}

export interface ApiRouteOptions {
  middleware?: MiddlewareInput[];
  name?: string;
  bind?: Record<string, BindingDefinition>;
  deprecated?: boolean;
  sunset?: string;
}

// ── Registry ──────────────────────────────────────────────────────────────────

const _registry: RouteDefinition[] = [];

export function getRegisteredRoutes(): readonly RouteDefinition[] {
  return _registry;
}

export function clearRegisteredRoutes(): void {
  _registry.length = 0;
}

// ── Group context stack ───────────────────────────────────────────────────────

const _groupStack: RouteGroupOptions[] = [];

/** Resolved prefix from all active groups, e.g. '/api' + '/v1' → '/api/v1' */
function resolvedPrefix(): string {
  return _groupStack.map((g) => g.prefix ?? '').join('');
}

/** Flattened middleware from all active groups (outer → inner order). */
function resolvedGroupMiddleware(): MiddlewareInput[] {
  return _groupStack.flatMap((g) => g.middleware ?? []);
}

/** Resolved version from the innermost group that specifies one. */
function resolvedVersion(): number | undefined {
  for (let i = _groupStack.length - 1; i >= 0; i--) {
    if (_groupStack[i]?.version !== undefined) return _groupStack[i]?.version;
  }
  return undefined;
}

/** Returns true if any active group has deprecated: true. */
function resolvedDeprecated(): boolean {
  return _groupStack.some((g) => g.deprecated === true);
}

/** Resolved sunset from the innermost group that specifies one. */
function resolvedSunset(): string | undefined {
  for (let i = _groupStack.length - 1; i >= 0; i--) {
    if (_groupStack[i]?.sunset !== undefined) return _groupStack[i]?.sunset;
  }
  return undefined;
}

// ── Core register ─────────────────────────────────────────────────────────────

type RouteOptions = WebRouteOptions | ApiRouteOptions;

function register(
  method: NonNullable<RouteDefinition['method']>,
  path: string,
  handler: HandlerType,
  options?: RouteOptions,
): RouteDefinition {
  // Merge group context into path + options
  const fullPath = resolvedPrefix() + path;
  const groupMiddleware = resolvedGroupMiddleware();
  const mergedMiddleware = [...groupMiddleware, ...(options?.middleware ?? [])];

  const definition: RouteDefinition = {
    method,
    path: fullPath,
    handler,
    ...options,
    ...(mergedMiddleware.length > 0 && { middleware: mergedMiddleware }),
    ...(resolvedVersion() !== undefined && { version: resolvedVersion() }),
    ...(resolvedDeprecated() && { deprecated: true }),
    ...(resolvedSunset() !== undefined && { sunset: resolvedSunset() }),
  } as RouteDefinition;

  if (definition.name) {
    const existing = _registry.find((r) => r.name === definition.name);
    if (existing) {
      throw new DuplicateRouteError(existing.method ?? method, existing.path);
    }
  }

  _registry.push(definition);
  return definition;
}

// ── Route object ──────────────────────────────────────────────────────────────

export const Route = {
  get(
    path: string,
    handler: HandlerType,
    options?: WebRouteOptions | ApiRouteOptions,
  ): RouteDefinition {
    return register('GET', path, handler, options);
  },

  post(path: string, handler: HandlerType, options?: ApiRouteOptions): RouteDefinition {
    return register('POST', path, handler, options);
  },

  put(path: string, handler: HandlerType, options?: ApiRouteOptions): RouteDefinition {
    return register('PUT', path, handler, options);
  },

  patch(path: string, handler: HandlerType, options?: ApiRouteOptions): RouteDefinition {
    return register('PATCH', path, handler, options);
  },

  delete(path: string, handler: HandlerType, options?: ApiRouteOptions): RouteDefinition {
    return register('DELETE', path, handler, options);
  },

  /**
   * Groups routes under a shared prefix, middleware, and/or version.
   *
   * @example
   * Route.group({ prefix: '/api/v1', version: 1, middleware: ['auth'] }, () => {
   *   Route.get('/users', listUsersHandler, { name: 'v1.users.index' })
   *   Route.post('/users', createUserHandler, { name: 'v1.users.store' })
   * })
   *
   * @example Nested groups
   * Route.group({ prefix: '/api', middleware: ['throttle'] }, () => {
   *   Route.group({ prefix: '/v1', version: 1 }, () => {
   *     Route.get('/posts', listPostsHandler, { name: 'v1.posts.index' })
   *   })
   *   Route.group({ prefix: '/v2', version: 2 }, () => {
   *     Route.get('/posts', listPostsV2Handler, { name: 'v2.posts.index' })
   *   })
   * })
   */
  group(options: RouteGroupOptions, callback: () => void): void {
    _groupStack.push(options);
    try {
      callback();
    } finally {
      _groupStack.pop();
    }
  },

  /**
   * Registers the full set of CRUD resource routes (including web form routes).
   *
   * Generated routes for `Route.resource('/photos', handlers)`:
   * | Method | Path              | Action  | Name            |
   * |--------|-------------------|---------|-----------------|
   * | GET    | /photos           | index   | photos.index    |
   * | GET    | /photos/create    | create  | photos.create   |
   * | POST   | /photos           | store   | photos.store    |
   * | GET    | /photos/:id       | show    | photos.show     |
   * | GET    | /photos/:id/edit  | edit    | photos.edit     |
   * | PUT    | /photos/:id       | update  | photos.update   |
   * | DELETE | /photos/:id       | destroy | photos.destroy  |
   *
   * @example
   * Route.resource('/photos', PhotoHandlers)
   * Route.resource('/photos', PhotoHandlers, { only: ['index', 'show'] })
   * Route.resource('/photos', PhotoHandlers, { except: ['destroy'] })
   */
  resource(path: string, handlers: ResourceHandlers, options: ResourceOptions = {}): void {
    const slug = path.replace(/^\//, '').replace(/\//g, '.');
    registerResource(path, slug, handlers, options, false);
  },

  /**
   * Registers API-only CRUD resource routes (no web form routes: no create/edit).
   *
   * Generated routes for `Route.apiResource('/photos', handlers)`:
   * | Method | Path        | Action  | Name           |
   * |--------|-------------|---------|----------------|
   * | GET    | /photos     | index   | photos.index   |
   * | POST   | /photos     | store   | photos.store   |
   * | GET    | /photos/:id | show    | photos.show    |
   * | PUT    | /photos/:id | update  | photos.update  |
   * | DELETE | /photos/:id | destroy | photos.destroy |
   *
   * @example
   * Route.apiResource('/photos', PhotoApiHandlers)
   * Route.apiResource('/photos', PhotoApiHandlers, { only: ['index', 'store'] })
   */
  apiResource(path: string, handlers: ResourceHandlers, options: ResourceOptions = {}): void {
    const slug = path.replace(/^\//, '').replace(/\//g, '.');
    registerResource(path, slug, handlers, options, true);
  },
} as const;

// ── Resource route registration ───────────────────────────────────────────────

function registerResource(
  basePath: string,
  namePrefix: string,
  handlers: ResourceHandlers,
  options: ResourceOptions,
  apiOnly: boolean,
): void {
  const {
    only,
    except,
    names = {},
    middleware,
    render = 'dynamic',
    bind,
    deprecated,
    sunset,
  } = options;

  const shouldInclude = (action: ResourceAction): boolean => {
    if (only) return only.includes(action);
    if (except) return !except.includes(action);
    return true;
  };

  const sharedOpts: Partial<ApiRouteOptions> = {
    ...(middleware && { middleware }),
    ...(bind && { bind }),
    ...(deprecated && { deprecated }),
    ...(sunset && { sunset }),
  };

  const webOpts = (action: ResourceAction): WebRouteOptions => ({
    render,
    name: names[action] ?? `${namePrefix}.${action}`,
    ...sharedOpts,
  });

  const apiOpts = (action: ResourceAction): ApiRouteOptions => ({
    name: names[action] ?? `${namePrefix}.${action}`,
    ...sharedOpts,
  });

  if (shouldInclude('index') && handlers.index) {
    register('GET', basePath, handlers.index, webOpts('index'));
  }
  if (!apiOnly && shouldInclude('create') && handlers.create) {
    register('GET', `${basePath}/create`, handlers.create, webOpts('create'));
  }
  if (shouldInclude('store') && handlers.store) {
    register('POST', basePath, handlers.store, apiOpts('store'));
  }
  if (shouldInclude('show') && handlers.show) {
    register('GET', `${basePath}/:id`, handlers.show, webOpts('show'));
  }
  if (!apiOnly && shouldInclude('edit') && handlers.edit) {
    register('GET', `${basePath}/:id/edit`, handlers.edit, webOpts('edit'));
  }
  if (shouldInclude('update') && handlers.update) {
    // Support both PUT and PATCH for update — register PUT only (clients can send either)
    register('PUT', `${basePath}/:id`, handlers.update, apiOpts('update'));
  }
  if (shouldInclude('destroy') && handlers.destroy) {
    register('DELETE', `${basePath}/:id`, handlers.destroy, apiOpts('destroy'));
  }
}

// ── route() helper ────────────────────────────────────────────────────────────

export function route(
  name: string,
  params?: Record<string, string | number>,
  query?: Record<string, string>,
): string {
  const registered = getRegisteredRoutes();
  const found = registered.find((r) => r.name === name);
  if (!found) throw new RouteNotFoundError(name);

  let path = found.path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, String(value));
    }
  }

  if (query && Object.keys(query).length > 0) {
    const qs = new URLSearchParams(query).toString();
    path = `${path}?${qs}`;
  }

  return url(path);
}
