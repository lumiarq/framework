/**
 * SSG-related types for static site generation.
 */

export type { SitemapEntry } from '../loader/types.js';

/** Result of generating static params for a route. */
export interface GenerateParamsResult {
  /** Array of param combinations to pre-render. */
  params: Array<Record<string, string>>;
}

/** A route eligible for static generation. */
export interface StaticRoute {
  path: string;
  generateParams?: () => Promise<GenerateParamsResult>;
}
