import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

import type {
  ActionResult,
  PageLoadContext,
  PageMeta,
  PageModule,
  RenderRequest,
  RenderResult,
} from '@illumiarq/contracts';

type RouteContext = { req: { raw: Request }; text: (body: string, status?: number) => Response };

export interface FilesystemPageRoute {
  source: 'filesystem';
  filePath: string;
  routePath: string;
  method: 'GET' | 'POST';
  handler: (ctx: RouteContext) => Promise<Response>;
}

interface PageModuleLike {
  default?:
    | ((context: { data: unknown; request: RenderRequest }) => Promise<RenderResult | string>)
    | unknown;
  page?: PageModule;
  loader?: PageModule['loader'];
  action?: PageModule['action'];
  meta?: PageModule['meta'];
  render?: PageModule['render'];
}

const PAGE_FILE_RE = /^page\.(ts|tsx|js|jsx|mjs|cjs)$/;
const LAYOUT_FILE_RE = /^layout\.(ts|tsx|js|jsx|mjs|cjs)$/;
const ERROR_FILE_RE = /^error\.(ts|tsx|js|jsx|mjs|cjs)$/;
const NOT_FOUND_FILE_RE = /^not-found\.(ts|tsx|js|jsx|mjs|cjs)$/;

function moduleImportPath(filePath: string): string {
  return decodeURI(pathToFileURL(filePath).href);
}

type LayoutRenderer = (context: {
  childrenHtml: string;
  data: unknown;
  request: RenderRequest;
}) => Promise<string> | string;

type ErrorRenderer = (context: {
  error: unknown;
  request: RenderRequest;
}) =>
  | Promise<{ html: string; status?: number } | string>
  | { html: string; status?: number }
  | string;

type NotFoundRenderer = (context: {
  request: RenderRequest;
}) =>
  | Promise<{ html: string; status?: number } | string>
  | { html: string; status?: number }
  | string;

interface FilesystemRouteContext {
  layouts: LayoutRenderer[];
  renderError: ErrorRenderer | undefined;
  renderNotFound: NotFoundRenderer | undefined;
}

function toRoutePath(appDir: string, pageFilePath: string): string {
  const rel = relative(appDir, pageFilePath).replaceAll('\\', '/');
  const dir = rel.replace(/\/?page\.(ts|tsx|js|jsx|mjs|cjs)$/i, '');
  if (!dir) return '/';

  const routeSegments = dir
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      if (/^\[\.\.\.(.+)\]$/.test(segment)) {
        const match = segment.match(/^\[\.\.\.(.+)\]$/);
        return `:${match?.[1] ?? 'path'}*`;
      }

      if (/^\[(.+)\]$/.test(segment)) {
        const match = segment.match(/^\[(.+)\]$/);
        return `:${match?.[1] ?? 'param'}`;
      }

      return segment;
    });

  return `/${routeSegments.join('/')}`;
}

function collectPageFiles(root: string, bucket: string[] = []): string[] {
  if (!existsSync(root)) return bucket;

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      collectPageFiles(fullPath, bucket);
      continue;
    }

    if (PAGE_FILE_RE.test(entry.name)) {
      bucket.push(fullPath);
    }
  }

  return bucket;
}

function findMatchingFile(dir: string, matcher: RegExp): string | undefined {
  if (!existsSync(dir)) return undefined;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (matcher.test(entry.name)) return join(dir, entry.name);
  }
  return undefined;
}

function toHeadersRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    record[key] = value;
  }
  return record;
}

function toSearchRecord(url: URL): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams.entries()) {
    const existing = out[key];
    if (existing === undefined) {
      out[key] = value;
      continue;
    }
    out[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
  }
  return out;
}

function buildRequest(ctx: RouteContext, params: Record<string, string>): RenderRequest {
  const req = ctx.req.raw;
  const url = new URL(req.url);
  return {
    url: req.url,
    method: req.method,
    params,
    headers: toHeadersRecord(req.headers),
    searchParams: toSearchRecord(url),
  };
}

function matchRouteParams(routePath: string, pathname: string): Record<string, string> {
  const routeSegments = routePath.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);
  const params: Record<string, string> = {};
  let pathIndex = 0;

  for (const routeSegment of routeSegments) {
    if (routeSegment.startsWith(':') && routeSegment.endsWith('*')) {
      const key = routeSegment.slice(1, -1) || 'path';
      params[key] = decodeURIComponent(pathSegments.slice(pathIndex).join('/'));
      return params;
    }

    const pathSegment = pathSegments[pathIndex];
    if (pathSegment === undefined) return {};

    if (routeSegment.startsWith(':')) {
      const key = routeSegment.slice(1) || 'param';
      params[key] = decodeURIComponent(pathSegment);
      pathIndex += 1;
      continue;
    }

    pathIndex += 1;
  }

  return params;
}

async function loadLayoutRenderer(filePath: string): Promise<LayoutRenderer | undefined> {
  const mod = (await import(moduleImportPath(filePath))) as {
    default?: LayoutRenderer;
    render?: LayoutRenderer;
  };
  const candidate = mod.render ?? mod.default;
  return typeof candidate === 'function' ? candidate : undefined;
}

async function loadErrorRenderer(filePath: string): Promise<ErrorRenderer | undefined> {
  const mod = (await import(moduleImportPath(filePath))) as {
    renderError?: ErrorRenderer;
    default?: ErrorRenderer;
  };
  const candidate = mod.renderError ?? mod.default;
  return typeof candidate === 'function' ? candidate : undefined;
}

async function loadNotFoundRenderer(filePath: string): Promise<NotFoundRenderer | undefined> {
  const mod = (await import(moduleImportPath(filePath))) as {
    renderNotFound?: NotFoundRenderer;
    default?: NotFoundRenderer;
  };
  const candidate = mod.renderNotFound ?? mod.default;
  return typeof candidate === 'function' ? candidate : undefined;
}

async function discoverRouteContext(
  appDir: string,
  pageFilePath: string,
): Promise<FilesystemRouteContext> {
  const pageDir = pageFilePath.slice(0, pageFilePath.lastIndexOf('/'));
  const relPageDir = relative(appDir, pageDir).replaceAll('\\', '/');
  const chain = relPageDir
    .split('/')
    .filter(Boolean)
    .reduce<string[]>((dirs, segment) => {
      const prev = dirs[dirs.length - 1];
      dirs.push(prev ? `${prev}/${segment}` : segment);
      return dirs;
    }, []);
  const directories = [appDir, ...chain.map((dir) => join(appDir, dir))];

  const layouts: LayoutRenderer[] = [];
  for (const dir of directories) {
    const layoutPath = findMatchingFile(dir, LAYOUT_FILE_RE);
    if (!layoutPath) continue;
    const renderer = await loadLayoutRenderer(layoutPath);
    if (renderer) layouts.push(renderer);
  }

  let renderError: ErrorRenderer | undefined;
  let renderNotFound: NotFoundRenderer | undefined;
  for (let index = directories.length - 1; index >= 0; index -= 1) {
    const dir = directories[index];
    if (!renderError) {
      const errorPath = dir ? findMatchingFile(dir, ERROR_FILE_RE) : undefined;
      if (errorPath) {
        renderError = await loadErrorRenderer(errorPath);
      }
    }
    if (!renderNotFound) {
      const notFoundPath = dir ? findMatchingFile(dir, NOT_FOUND_FILE_RE) : undefined;
      if (notFoundPath) {
        renderNotFound = await loadNotFoundRenderer(notFoundPath);
      }
    }
    if (renderError && renderNotFound) break;
  }

  return { layouts, renderError, renderNotFound };
}

function normalizePageModule(mod: PageModuleLike): PageModule {
  if (mod.page && typeof mod.page.render === 'function') {
    return mod.page;
  }

  const defaultRender = mod.default;
  const renderFromDefault =
    typeof defaultRender === 'function'
      ? async (context: { data: unknown; request: RenderRequest }) => {
          const result = await defaultRender(context);
          if (typeof result === 'string') {
            return {
              html: result,
              payload: {
                initialData: context.data,
                pageVersion: 'fs-runtime-v1',
              },
              status: 200,
            };
          }
          return result as RenderResult;
        }
      : undefined;

  if (mod.render || renderFromDefault) {
    const pageModule: PageModule = {
      render: mod.render ?? renderFromDefault!,
    };
    if (mod.loader) pageModule.loader = mod.loader;
    if (mod.action) pageModule.action = mod.action;
    if (mod.meta) pageModule.meta = mod.meta;
    return pageModule;
  }

  throw new Error('Filesystem page module missing render/page export');
}

function buildGetHandler(
  pageModule: PageModule,
  routePath: string,
  routeContext: FilesystemRouteContext,
): (ctx: RouteContext) => Promise<Response> {
  return async (ctx) => {
    const pathname = new URL(ctx.req.raw.url).pathname;
    const params = matchRouteParams(routePath, pathname);
    const request = buildRequest(ctx, params);

    try {
      const loadContext: PageLoadContext = { request };
      const data = pageModule.loader ? await pageModule.loader(loadContext) : undefined;
      const meta = pageModule.meta ? await pageModule.meta({ data, request }) : undefined;
      const rendered = await pageModule.render({ data, request });
      const headers = new Headers(rendered.headers ?? {});
      if (meta) {
        headers.set('x-lumiarq-page-meta', JSON.stringify(meta satisfies PageMeta));
      }

      let html = rendered.html;
      if (rendered.status === 404 && routeContext.renderNotFound) {
        const notFoundResult = await routeContext.renderNotFound({ request });
        if (typeof notFoundResult === 'string') {
          html = notFoundResult;
        } else {
          html = notFoundResult.html;
        }
      }

      for (let index = routeContext.layouts.length - 1; index >= 0; index -= 1) {
        const layout = routeContext.layouts[index];
        if (!layout) continue;
        html = await layout({ childrenHtml: html, data, request });
      }

      headers.set('x-lumiarq-runtime-route', 'filesystem');
      return new Response(html, {
        status: rendered.status,
        headers,
      });
    } catch (error) {
      if (routeContext.renderError) {
        const boundaryResult = await routeContext.renderError({ error, request });
        if (typeof boundaryResult === 'string') {
          return new Response(boundaryResult, { status: 500 });
        }
        return new Response(boundaryResult.html, { status: boundaryResult.status ?? 500 });
      }
      throw error;
    }
  };
}

function buildPostHandler(
  pageModule: PageModule,
  routePath: string,
  routeContext: FilesystemRouteContext,
): (ctx: RouteContext) => Promise<Response> {
  return async (ctx) => {
    if (!pageModule.action) {
      return ctx.text('Method Not Allowed', 405);
    }

    const pathname = new URL(ctx.req.raw.url).pathname;
    const params = matchRouteParams(routePath, pathname);
    const request = buildRequest(ctx, params);

    try {
      const result: ActionResult = await pageModule.action({ request });
      if (result.redirectTo) {
        return new Response(null, {
          status: result.status ?? 303,
          headers: { Location: result.redirectTo },
        });
      }
      return new Response(JSON.stringify(result.data ?? {}), {
        status: result.status ?? 200,
        headers: { 'Content-Type': 'application/json', 'x-lumiarq-runtime-route': 'filesystem' },
      });
    } catch (error) {
      if (routeContext.renderError) {
        const boundaryResult = await routeContext.renderError({ error, request });
        if (typeof boundaryResult === 'string') {
          return new Response(boundaryResult, { status: 500 });
        }
        return new Response(boundaryResult.html, { status: boundaryResult.status ?? 500 });
      }
      throw error;
    }
  };
}

export async function discoverFilesystemPageRoutes(
  projectRoot: string,
): Promise<FilesystemPageRoute[]> {
  const appDir = join(projectRoot, 'src', 'app');
  const files = collectPageFiles(appDir).sort((a, b) => a.localeCompare(b));
  const routes: FilesystemPageRoute[] = [];

  for (const filePath of files) {
    const routePath = toRoutePath(appDir, filePath);
    const mod = (await import(moduleImportPath(filePath))) as PageModuleLike;
    const pageModule = normalizePageModule(mod);
    const routeContext = await discoverRouteContext(appDir, filePath);
    routes.push({
      source: 'filesystem',
      filePath,
      routePath,
      method: 'GET',
      handler: buildGetHandler(pageModule, routePath, routeContext),
    });

    if (pageModule.action) {
      routes.push({
        source: 'filesystem',
        filePath,
        routePath,
        method: 'POST',
        handler: buildPostHandler(pageModule, routePath, routeContext),
      });
    }
  }

  return routes;
}
