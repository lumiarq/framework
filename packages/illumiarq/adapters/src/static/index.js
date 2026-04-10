/**
 * Builds static HTML output from all SSG routes.
 * Only `render: 'static', revalidate: false` routes are prerendered.
 * ISR and dynamic routes are skipped with a build warning.
 *
 * @param routes  - All classified routes for the application
 * @param options - Build configuration
 */
export function planStaticBuild(routes, options) {
  const files = [];
  const skipped = [];
  for (const cr of routes) {
    if (cr.strategy === 'ssg') {
      files.push(cr.route.path);
    } else if (cr.strategy === 'isr') {
      skipped.push({
        path: cr.route.path,
        reason: 'ISR requires a runtime — falling back to SSG in static build',
      });
    } else {
      skipped.push({
        path: cr.route.path,
        reason: 'Dynamic route skipped in static build — emitting client-rendered shell',
      });
    }
  }
  return { files, skipped };
}
export { generateHtaccess, generateNginxConf } from './server-configs.js';
export { generateBffScaffold } from './bff-scaffold.js';
//# sourceMappingURL=index.js.map
