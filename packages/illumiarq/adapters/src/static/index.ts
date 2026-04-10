import type { ClassifiedRoute } from '@illumiarq/build';

export interface StaticBuildOptions {
  /** Directory to write prerendered HTML files into (default: 'dist') */
  outDir?: string;
  /** Base URL for sitemap and canonical URLs */
  siteUrl: string;
}

export interface StaticBuildResult {
  /** Paths of HTML files written */
  files: string[];
  /** Routes skipped because they are not SSG */
  skipped: { path: string; reason: string }[];
}

/**
 * Builds static HTML output from all SSG routes.
 * Only `render: 'static', revalidate: false` routes are prerendered.
 * ISR and dynamic routes are skipped with a build warning.
 *
 * @param routes  - All classified routes for the application
 * @param options - Build configuration
 */
export function planStaticBuild(
  routes: ClassifiedRoute[],
  options: StaticBuildOptions,
): StaticBuildResult {
  const files: string[] = [];
  const skipped: { path: string; reason: string }[] = [];

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
export type { ApacheOptions, NginxOptions } from './server-configs.js';

export { generateBffScaffold } from './bff-scaffold.js';
export type { BffScaffoldOptions } from './bff-scaffold.js';
