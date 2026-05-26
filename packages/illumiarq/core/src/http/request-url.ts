const DEFAULT_REQUEST_BASE = 'http://localhost';

/**
 * Parses a request URL safely on serverless runtimes where `req.url` may be relative.
 */
export function parseRequestUrl(req: Request, base = DEFAULT_REQUEST_BASE): URL {
  return new URL(req.url, base);
}
