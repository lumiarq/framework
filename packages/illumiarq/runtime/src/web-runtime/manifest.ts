import type { RouteDefinition } from '@illumiarq/http';

import { discoverFilesystemPageRoutes } from './fs-routing.js';
import { rankPath, toCollisionSignature } from './route-ranking.js';

type RouteContext = { req: { raw: Request }; text: (body: string, status?: number) => Response };

export interface RuntimeRouteEntry extends RouteDefinition {
  source: 'legacy' | 'filesystem';
  filePath?: string;
  rank: ReturnType<typeof rankPath>;
  signature: string;
}

export interface RouteCollisionDiagnostic {
  method: string;
  signature: string;
  routes: Array<{
    path: string;
    source: RuntimeRouteEntry['source'];
    filePath?: string;
  }>;
}

export interface BuildWebRuntimeManifestOptions {
  legacyRoutes: readonly RouteDefinition[];
  projectRoot: string;
  enableFilesystemRouting?: boolean;
}

export interface WebRuntimeManifest {
  routes: RuntimeRouteEntry[];
  diagnostics: {
    collisions: RouteCollisionDiagnostic[];
  };
}

function sortRoutes(routes: RuntimeRouteEntry[]): RuntimeRouteEntry[] {
  return [...routes].sort((left, right) => {
    if (left.method !== right.method) return left.method!.localeCompare(right.method!);
    if (left.rank.score !== right.rank.score) return right.rank.score - left.rank.score;
    if (left.rank.staticSegments !== right.rank.staticSegments) {
      return right.rank.staticSegments - left.rank.staticSegments;
    }
    if (left.rank.dynamicSegments !== right.rank.dynamicSegments) {
      return left.rank.dynamicSegments - right.rank.dynamicSegments;
    }
    if (left.rank.catchAllSegments !== right.rank.catchAllSegments) {
      return left.rank.catchAllSegments - right.rank.catchAllSegments;
    }
    if (left.rank.segmentCount !== right.rank.segmentCount) {
      return right.rank.segmentCount - left.rank.segmentCount;
    }
    if (left.path !== right.path) return left.path.localeCompare(right.path);
    return (left.name ?? '').localeCompare(right.name ?? '');
  });
}

function detectCollisions(routes: RuntimeRouteEntry[]): RouteCollisionDiagnostic[] {
  const buckets = new Map<string, RuntimeRouteEntry[]>();
  for (const route of routes) {
    const key = `${route.method}:${route.signature}`;
    const current = buckets.get(key) ?? [];
    current.push(route);
    buckets.set(key, current);
  }

  const diagnostics: RouteCollisionDiagnostic[] = [];
  for (const [key, grouped] of buckets.entries()) {
    if (grouped.length < 2) continue;
    const delimiter = key.indexOf(':');
    const method = delimiter >= 0 ? key.slice(0, delimiter) : 'GET';
    const signature = delimiter >= 0 ? key.slice(delimiter + 1) : '';
    diagnostics.push({
      method,
      signature,
      routes: grouped.map((route) => ({
        path: route.path,
        source: route.source,
        ...(route.filePath ? { filePath: route.filePath } : {}),
      })),
    });
  }
  return diagnostics.sort((a, b) =>
    `${a.method}:${a.signature}`.localeCompare(`${b.method}:${b.signature}`),
  );
}

function fromLegacyRoutes(legacyRoutes: readonly RouteDefinition[]): RuntimeRouteEntry[] {
  return legacyRoutes.map((route) => ({
    ...route,
    method: route.method ?? 'GET',
    source: 'legacy',
    signature: toCollisionSignature(route.path),
    rank: rankPath(route.path),
  }));
}

function filesystemToRouteDefinition(
  route: Awaited<ReturnType<typeof discoverFilesystemPageRoutes>>[number],
): RuntimeRouteEntry {
  const handler = route.handler as unknown as (ctx: RouteContext) => Promise<Response>;
  return {
    path: route.routePath,
    method: route.method,
    handler,
    render: 'dynamic',
    source: route.source,
    filePath: route.filePath,
    signature: toCollisionSignature(route.routePath),
    rank: rankPath(route.routePath),
  };
}

export async function buildWebRuntimeManifest(
  options: BuildWebRuntimeManifestOptions,
): Promise<WebRuntimeManifest> {
  const baseRoutes = fromLegacyRoutes(options.legacyRoutes);
  if (!options.enableFilesystemRouting) {
    const sorted = sortRoutes(baseRoutes);
    return { routes: sorted, diagnostics: { collisions: detectCollisions(sorted) } };
  }

  const filesystemRoutes = await discoverFilesystemPageRoutes(options.projectRoot);
  const allRoutes = [...baseRoutes, ...filesystemRoutes.map(filesystemToRouteDefinition)];
  const sorted = sortRoutes(allRoutes);
  return {
    routes: sorted,
    diagnostics: { collisions: detectCollisions(sorted) },
  };
}
