import { scanSsgEligibleRoutes } from './scanner.js';
import type { RouteDefinition } from '../router/define-route.js';

/**
 * Computes static paths to prerender for all static routes.
 */
export async function prerenderRoutes(): Promise<
  Array<{ route: RouteDefinition; paths: string[] }>
> {
  const routes = scanSsgEligibleRoutes();
  const result: Array<{ route: RouteDefinition; paths: string[] }> = [];

  for (const route of routes) {
    if (route.generateParams) {
      const paramsList = await route.generateParams();
      const paths = paramsList.map((params) => {
        let path = route.path;
        for (const [key, value] of Object.entries(params)) {
          path = path.replace(`:${key}`, encodeURIComponent(value));
        }
        return path;
      });
      result.push({ route, paths });
      continue;
    }

    result.push({ route, paths: [route.path] });
  }

  return result;
}
