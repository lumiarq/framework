/**
 * Classifies a route definition into its rendering strategy and derives
 * the correct Cache-Control header and client staleTime.
 *
 * - render:'dynamic'              → SSR  → Cache-Control: no-store           → staleTime: 0
 * - render:'static', revalidate:false → SSG → public, max-age=31536000, immutable → staleTime: Infinity
 * - render:'static', revalidate:N → ISR → public, s-maxage=N, stale-while-revalidate=5N → staleTime: N*500
 */
export function classifyRoute(route) {
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
export function classifyRoutes(routes) {
  return routes.map(classifyRoute);
}
//# sourceMappingURL=strategy-classifier.js.map
