import { LumiARQError } from './lumiarq-error.js';

/**
 * Thrown during a static build when a required field is missing or a
 * static build rule is violated.
 *
 * `@illumiarq/adapters/static` enforces:
 * - Dynamic routes with no `generateParams` declaration throw `StaticBuildError`
 *   (the static build cannot enumerate pages without it).
 * - ISR routes fall back to SSG with a build warning (not an error).
 *
 * @see planStaticBuild in @illumiarq/adapters/static
 *
 * @example
 * // Route '/blog/:slug' has no generateParams → StaticBuildError
 * // StaticBuildError: Route '/blog/:slug' requires generateParams for static prerender
 */
export class StaticBuildError extends LumiARQError {
  override readonly name = 'StaticBuildError';

  /**
   * @param path - The route path that triggered the error
   * @param reason - Human-readable explanation of the violation
   */
  constructor(path: string, reason: string) {
    super(`Static build error for route '${path}': ${reason}`);
  }
}
