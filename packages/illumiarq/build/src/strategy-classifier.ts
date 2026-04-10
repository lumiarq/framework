import type { RouteDefinition } from '@illumiarq/http';

/**
 * The three rendering strategies LumiARQ supports.
 *
 * - `ssg`     — prerendered at build time, never touched at runtime
 * - `isr`     — rendered at runtime + CDN cache with stale-while-revalidate
 * - `dynamic` — rendered fresh on every request
 */
export type RenderStrategy = 'ssg' | 'isr' | 'dynamic';

export interface ClassifiedRoute {
  route: RouteDefinition;
  strategy: RenderStrategy;
  /** The Cache-Control header value to emit for this route */
  cacheControl: string;
  /** The client-side TanStack Query staleTime (milliseconds) */
  staleTime: number;
}

/**
 * Classifies a route definition into its rendering strategy and derives
 * the correct Cache-Control header and client staleTime.
 *
 * - render:'dynamic'              → SSR  → Cache-Control: no-store           → staleTime: 0
 * - render:'static', revalidate:false → SSG → public, max-age=31536000, immutable → staleTime: Infinity
 * - render:'static', revalidate:N → ISR → public, s-maxage=N, stale-while-revalidate=5N → staleTime: N*500
 */
export function classifyRoute(route: RouteDefinition): ClassifiedRoute {
  if (route.render === 'dynamic') {
    return {
      route,
      strategy: 'dynamic',
      cacheControl: 'no-store',
      staleTime: 0,
    };
  }

  if (route.revalidate === false || route.revalidate === undefined) {
    return {
      route,
      strategy: 'ssg',
      cacheControl: 'public, max-age=31536000, immutable',
      staleTime: Infinity,
    };
  }

  const n = route.revalidate;
  return {
    route,
    strategy: 'isr',
    cacheControl: `public, s-maxage=${n}, stale-while-revalidate=${n * 5}`,
    staleTime: n * 500,
  };
}

/** Classifies an array of routes. */
export function classifyRoutes(routes: RouteDefinition[]): ClassifiedRoute[] {
  return routes.map(classifyRoute);
}
