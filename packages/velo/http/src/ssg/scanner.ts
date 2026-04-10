import { getRegisteredRoutes } from '../router/route.js';
import type { RouteDefinition } from '../router/define-route.js';

/**
 * Returns routes eligible for static generation.
 */
export function scanSsgEligibleRoutes(): RouteDefinition[] {
  return getRegisteredRoutes().filter((route) => route.render === 'static');
}
