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
export function generateShells(routes, appShellHtml) {
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
//# sourceMappingURL=shell-generator.js.map
