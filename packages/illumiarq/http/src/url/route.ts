import { route as routeByName } from '../router/route.js';

/**
 * route() helper for named routes.
 */
export function route(
  name: string,
  params?: Record<string, string | number>,
  query?: Record<string, string>,
): string {
  return routeByName(name, params, query);
}
