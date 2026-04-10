import { StaticBuildError } from '@velo/core';
import type { ClassifiedRoute } from './strategy-classifier.js';

/**
 * The result of prerendering a single route.
 */
export interface PrerenderResult {
  /** The route path, e.g. "/about" */
  path: string;
  /** The rendered HTML string */
  html: string;
  /**
   * The relative output file path, e.g. "about/index.html".
   * Root path "/" → "index.html".
   */
  outFile: string;
}

/**
 * A user-supplied render function that produces HTML for a route.
 */
export type RouteRenderer = (route: ClassifiedRoute) => string | Promise<string>;

/**
 * Derives the output file name from a route path.
 *
 * @example
 * routePathToOutFile('/')             // → 'index.html'
 * routePathToOutFile('/about')        // → 'about/index.html'
 * routePathToOutFile('/blog/my-post') // → 'blog/my-post/index.html'
 */
export function routePathToOutFile(routePath: string): string {
  const clean = routePath.replace(/^\//, '');
  if (!clean) return 'index.html';
  return `${clean}/index.html`;
}

/**
 * Prerenders SSG routes to static HTML.
 *
 * - Only routes with strategy `ssg` are prerendered.
 * - Routes with strategy `isr` in a static build emit a console.warn and are
 *   treated as `ssg` (ISR→SSG fallback). This is a build-time downgrade.
 * - Routes with strategy `dynamic` are skipped (returned as empty).
 * - Renderer errors are wrapped in `StaticBuildError`.
 *
 * @param routes   - Classified routes to prerender
 * @param renderer - Function that returns HTML for a given route
 * @returns        - Array of prerender results for SSG + ISR-downgraded routes
 *
 * @throws {StaticBuildError} if the renderer throws for any route
 */
export async function prerenderRoutes(
  routes: ClassifiedRoute[],
  renderer: RouteRenderer,
): Promise<PrerenderResult[]> {
  const results: PrerenderResult[] = [];

  for (const classified of routes) {
    if (classified.strategy === 'dynamic') continue;

    if (classified.strategy === 'isr') {
      console.warn(
        `[build] Route "${classified.route.path}" uses ISR but static adapter is active. ` +
          `Falling back to SSG (revalidate will be ignored).`,
      );
    }

    let html: string;
    try {
      html = await Promise.resolve(renderer(classified));
    } catch {
      throw new StaticBuildError(classified.route.path, 'renderer threw during prerender');
    }

    results.push({
      path: classified.route.path,
      html,
      outFile: routePathToOutFile(classified.route.path),
    });
  }

  return results;
}
