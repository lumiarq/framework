import { ConfigurationError } from '../errors/index.js';
// Internal config store — simple module-level variable the app sets at bootstrap
let _appUrl;
export function setAppUrl(appUrl) {
  _appUrl = appUrl;
}
/**
 * Builds a full URL using the configured app base URL.
 *
 * - Replaces `:key` tokens in `path` with values from `params`
 * - Appends `queryParams` as a query string
 *
 * @throws {ConfigurationError} when appUrl has not been set via setAppUrl()
 */
export function url(path, params, queryParams) {
  if (!_appUrl) {
    throw new ConfigurationError('appConfig.appUrl is not set. Call setAppUrl() at bootstrap.');
  }
  // Replace :key tokens in path
  let resolvedPath = path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      resolvedPath = resolvedPath.replace(`:${key}`, encodeURIComponent(value));
    }
  }
  // Combine base URL and path — avoid double slashes
  const base = _appUrl.replace(/\/$/, '');
  let fullUrl = `${base}${resolvedPath}`;
  // Append queryParams
  if (queryParams && Object.keys(queryParams).length > 0) {
    const entries = Object.entries(queryParams).map(([k, v]) => [k, String(v)]);
    const searchParams = new URLSearchParams(entries);
    fullUrl += `?${searchParams.toString()}`;
  }
  return fullUrl;
}
//# sourceMappingURL=url.js.map
