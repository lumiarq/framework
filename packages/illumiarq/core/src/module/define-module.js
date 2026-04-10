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
export function defineModule(options) {
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
//# sourceMappingURL=define-module.js.map
