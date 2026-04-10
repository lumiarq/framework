import { LumiARQError } from './lumiarq-error.js';

/**
 * Thrown when a circular dependency is detected in a route's Loader graph.
 *
 * Every route's Loader dependency graph must be acyclic.
 * `@velo/runtime` validates the DAG before executing any Loaders and
 * throws this error immediately on detection.
 *
 * @see orchestrateLoaders in @velo/runtime
 *
 * @example
 * // LoaderA dependsOn LoaderB, LoaderB dependsOn LoaderA → cycle
 * // LoaderDependencyError: Circular dependency detected: LoaderA → LoaderB → LoaderA
 */
export class LoaderDependencyError extends LumiARQError {
  override readonly name = 'LoaderDependencyError';

  /**
   * @param cycle - String representation of the detected cycle, e.g. 'A → B → A'
   */
  constructor(cycle: string) {
    super(`Circular dependency detected in Loader graph: ${cycle}`);
  }
}
