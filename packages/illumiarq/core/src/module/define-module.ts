/**
 * Defines a module's metadata and configuration.
 *
 * Usage (in module.ts):
 * ```ts
 * import { defineModule } from '@lumiarq/framework';
 *
 * export default defineModule({
 *   name: 'Blog',
 *   // prefix: '/blog',
 *   // middleware: { web: ['lumiarq.auth'], api: ['lumiarq.auth'] },
 * });
 * ```
 */

/** Describes how a module is operating within the application. */
export type ModuleMode = 'embedded' | 'standalone';

/** Middleware configuration for a module. */
export interface ModuleMiddlewareConfig {
  /** Middleware applied to web (CSRF + session) routes in this module. */
  web?: string[];
  /** Middleware applied to API (JWT-only) routes in this module. */
  api?: string[];
}

/** Options accepted by `defineModule()`. */
export interface DefineModuleOptions {
  /** PascalCase module name (e.g. "Blog", "User"). Used for display and lookup. */
  name: string;
  /**
   * Optional short alias for the module (e.g. "blog").
   * Defaults to the kebab-case of `name`.
   */
  alias?: string;
  /**
   * Load priority. Lower values load first.
   * Modules with equal priority load in discovery order.
   * @default 100
   */
  priority?: number;
  /**
   * URL prefix applied to all routes in this module.
   * @example '/admin'
   */
  prefix?: string;
  /**
   * Module-level middleware applied after global middleware.
   * Runs before route-level middleware.
   */
  middleware?: ModuleMiddlewareConfig;

  /**
   * Optional hook that runs before the module is loaded. Useful for dynamic
   */
  description?: string;
}

/** Configuration returned when a module is defined. */
export interface ModuleDefinition {
  /** The module name (PascalCase, e.g. "User", "Auth") */
  name: string;
  /** Optional alias (kebab-case). Defaults to kebab(name). */
  alias: string;
  /** Load priority. */
  priority: number;
  /** URL prefix for all routes in this module, or undefined. */
  prefix: string | undefined;
  /** Module-level middleware configuration. */
  middleware: ModuleMiddlewareConfig;
}

/**
 * Defines a module's metadata and routing configuration.
 * Call this in `module.ts` and use `export default`.
 *
 * @example
 * export default defineModule({
 *   name: 'Blog',
 *   prefix: '/blog',
 *   middleware: { api: ['lumiarq.auth'] },
 * });
 */
export function defineModule(options: DefineModuleOptions): ModuleDefinition {
  const { name, alias, priority = 100, prefix, middleware = {} } = options;

  // Auto-derive alias from name if not provided (PascalCase → kebab-case)
  const derivedAlias =
    alias ??
    name
      .replace(/([A-Z])/g, (m, l, offset) => (offset > 0 ? '-' : '') + l.toLowerCase())
      .replace(/^-/, '');

  return {
    name,
    alias: derivedAlias,
    priority,
    prefix,
    middleware,
  };
}
