/**
 * defineMiddleware — creates and registers a named middleware definition.
 *
 * Registered middleware can be referenced by name in route definitions:
 *
 * ```ts
 * // Register once (e.g. in a middleware file or framework bootstrap)
 * defineMiddleware({
 *   name: 'lumiarq.auth',
 *   handler: async (req, next) => {
 *     const token = req.headers.get('Authorization')
 *     if (!token) return new Response('Unauthorized', { status: 401 })
 *     return next()
 *   },
 *   priority: 100,
 * })
 *
 * // Use by name in routes
 * Route.get('/dashboard', dashboardHandler, { middleware: ['lumiarq.auth'] })
 * ```
 */

import type { MiddlewareFn, MiddlewareDefinition } from '../types/http.types.js';

// ── Global registry ───────────────────────────────────────────────────────────

const _registry = new Map<string, MiddlewareDefinition>();

/**
 * Registers a named middleware definition into the global registry and returns it.
 * If a middleware with the same name already exists, it is overwritten.
 */
export function defineMiddleware(definition: MiddlewareDefinition): MiddlewareDefinition {
  _registry.set(definition.name, definition);
  return definition;
}

/**
 * Retrieves a registered middleware by name.
 * Returns `undefined` if no middleware with that name was registered.
 */
export function getMiddleware(name: string): MiddlewareDefinition | undefined {
  return _registry.get(name);
}

/**
 * Returns true if a middleware with the given name has been registered.
 */
export function hasMiddleware(name: string): boolean {
  return _registry.has(name);
}

/**
 * Returns all registered middleware definitions, sorted by priority descending.
 */
export function getAllMiddleware(): MiddlewareDefinition[] {
  return [..._registry.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/**
 * Clears the global middleware registry.
 * Primarily used in tests to reset state between test runs.
 */
export function clearMiddlewareRegistry(): void {
  _registry.clear();
}

/**
 * Creates a simple middleware from a function (unnamed, not registered, priority 0).
 * Use this for inline one-off middleware — prefer defineMiddleware for reusable named middleware.
 */
export function middleware(handler: MiddlewareFn): MiddlewareDefinition {
  return {
    name: '',
    handler,
    priority: 0,
  };
}
