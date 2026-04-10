import type { ClassifiedRoute } from './strategy-classifier.js';

/**
 * The result of generating a client shell for a dynamic route.
 */
export interface ShellResult {
  /** The route path, e.g. "/dashboard" */
  path: string;
  /** The shell HTML — app skeleton with JS bootstrapping, no SSR content */
  html: string;
  /**
   * The relative output file path.
   * e.g. "/dashboard" → "dashboard/index.html"
   */
  outFile: string;
}

/**
 * Generates client-side shells for dynamic routes.
 *
 * A shell is the minimal HTML skeleton that boots the client-side JS app
 * without any server-rendered content. Dynamic routes need this for the
 * static adapter to serve something while the browser hydrates.
 *
 * Only `dynamic` strategy routes produce a shell.
 * SSG and ISR routes are skipped — they have pre-rendered HTML.
 *
 * @param routes        - Classified routes
 * @param appShellHtml  - The base HTML template (app shell)
 * @returns             - Shell results for dynamic routes
 */
export function generateShells(routes: ClassifiedRoute[], appShellHtml: string): ShellResult[] {
  return routes
    .filter((r) => r.strategy === 'dynamic')
    .map((r) => {
      const clean = r.route.path.replace(/^\//, '');
      const outFile = clean ? `${clean}/index.html` : 'index.html';
      return {
        path: r.route.path,
        html: appShellHtml,
        outFile,
      };
    });
}
