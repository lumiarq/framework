let _appUrl: string | undefined;

export function setAppUrl(appUrl: string): void {
  _appUrl = appUrl;
}

/**
 * Builds a full URL using the configured app base URL.
 */
export function url(
  path: string,
  params?: Record<string, string>,
  queryParams?: Record<string, string | number | boolean>,
): string {
  if (!_appUrl) {
    throw new Error('appUrl is not set. Call setAppUrl() at bootstrap.');
  }

  let resolvedPath = path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      resolvedPath = resolvedPath.replace(`:${key}`, encodeURIComponent(value));
    }
  }

  const base = _appUrl.replace(/\/$/, '');
  let fullUrl = `${base}${resolvedPath}`;

  if (queryParams && Object.keys(queryParams).length > 0) {
    const entries: [string, string][] = Object.entries(queryParams).map(([k, v]) => [k, String(v)]);
    const searchParams = new URLSearchParams(entries);
    fullUrl += `?${searchParams.toString()}`;
  }

  return fullUrl;
}
