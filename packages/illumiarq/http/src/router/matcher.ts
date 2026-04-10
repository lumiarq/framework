/**
 * Route matcher — matches a URL path against a route pattern.
 *
 * Supports `:param` segments and `*` wildcards.
 * Used for route URL generation and testing (the runtime uses Hono's
 * built-in router for actual request dispatch).
 */

import type { RouteMatch } from '../types/http.types.js';

/**
 * Compiles a route pattern into a RegExp and a list of parameter names.
 *
 * @param pattern - Route pattern (e.g. '/posts/:id', '/files/*')
 * @returns Compiled regex and param names
 */
export function compilePattern(pattern: string): {
  regex: RegExp;
  paramNames: string[];
} {
  const paramNames: string[] = [];

  const regexStr = pattern
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, name: string) => {
      paramNames.push(name);
      return '([^/]+)';
    })
    .replace(/\*/g, '(.*)');

  return {
    regex: new RegExp(`^${regexStr}$`),
    paramNames,
  };
}

/**
 * Matches a URL path against a route pattern.
 *
 * @param pattern - Route pattern (e.g. '/posts/:id')
 * @param path    - URL path to match (e.g. '/posts/abc-123')
 * @returns Match result with extracted parameters
 *
 * @example
 * matchRoute('/posts/:id', '/posts/abc-123')
 * // → { matched: true, params: { id: 'abc-123' } }
 *
 * matchRoute('/posts/:id', '/users/1')
 * // → { matched: false, params: {} }
 */
export function matchRoute(pattern: string, path: string): RouteMatch {
  const { regex, paramNames } = compilePattern(pattern);
  const match = regex.exec(path);

  if (!match) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < paramNames.length; i++) {
    const name = paramNames[i];
    const value = match[i + 1];
    if (name !== undefined && value !== undefined) {
      params[name] = decodeURIComponent(value);
    }
  }

  return { matched: true, params };
}
