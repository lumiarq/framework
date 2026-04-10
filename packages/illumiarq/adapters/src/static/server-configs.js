/**
 * Generates an Apache `.htaccess` file for single-page application hosting.
 *
 * Features:
 * - Disables MultiViews to prevent Apache serving unexpected variants
 * - Serves static files directly when they exist
 * - Falls back to `index.html` for all other paths (SPA routing)
 *
 * @param options - Optional extra rewrite rules to include
 * @returns       - `.htaccess` content as a string
 */
export function generateHtaccess(options = {}) {
  const { extraRules = [] } = options;
  const extraBlock = extraRules.length > 0 ? extraRules.join('\n') + '\n' : '';
  return [
    'Options -MultiViews',
    'RewriteEngine On',
    '',
    '# Serve existing files and directories directly',
    'RewriteCond %{REQUEST_FILENAME} !-f',
    'RewriteCond %{REQUEST_FILENAME} !-d',
    '',
    extraBlock.trimEnd(),
    '# SPA fallback — all unknown paths → index.html',
    'RewriteRule ^ /index.html [L]',
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
/**
 * Generates an nginx server configuration block for static SPA hosting.
 *
 * Features:
 * - Serves pre-rendered HTML pages when they exist
 * - Falls back to `index.html` for client-rendered (dynamic-shell) routes
 * - Sets gzip on for reduced transfer sizes
 *
 * @param options - Optional nginx configuration overrides
 * @returns       - nginx.conf content block as a string
 */
export function generateNginxConf(options = {}) {
  const { port = 80, root = '/usr/share/nginx/html' } = options;
  return `server {
  listen ${port};
  root ${root};
  index index.html;

  gzip on;
  gzip_types text/html text/css application/javascript application/json;

  location / {
    try_files $uri $uri/ $uri.html /index.html;
  }
}`;
}
//# sourceMappingURL=server-configs.js.map
